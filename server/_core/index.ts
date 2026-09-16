import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { affiliateEvents, affiliateIntegrations, automationJobs, offers, segments, whatsappSessions } from "../../drizzle/schema";
import { verifyWhatsAppWebhook } from "../integrations/whatsapp";
import { convertAffiliateLink, fetchConfiguredPromotions } from "../integrations/marketplaces";
import { activateUserFromCheckout } from "../db";
import { decryptCustomerPassword, stripe, stripeWebhookSecret } from "../stripe";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb", verify: (req, _res, buffer) => { (req as any).rawBody = buffer.toString("utf8"); } }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe || !stripeWebhookSecret) return res.status(503).json({ error: "stripe webhook unavailable" });
    const signature = req.header("stripe-signature");
    if (!signature || !(req as any).rawBody) return res.status(400).json({ error: "stripe signature required" });

    try {
      const event = stripe.webhooks.constructEvent((req as any).rawBody, signature, stripeWebhookSecret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.payment_status === "paid" && session.metadata?.plan_id) {
          const email = session.customer_details?.email || session.metadata.customer_email;
          if (!email) return res.status(400).json({ error: "checkout email missing" });
          await activateUserFromCheckout({
            email,
            name: session.customer_details?.name || session.metadata.customer_name || undefined,
            planId: session.metadata.plan_id,
            tempPassword: decryptCustomerPassword(session.metadata.customer_password_encrypted),
            stripeSessionId: session.id,
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          });
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe webhook] invalid event", error);
      return res.status(400).json({ error: "invalid stripe event" });
    }
  });
  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const db = await getDb();
      const instance = req.body?.instance || req.body?.instanceName || req.body?.data?.instance;
      const [session] = db ? await db.select().from(whatsappSessions).where(eq(whatsappSessions.externalInstanceId, instance || "")).limit(1) : [];
      if (!session || !verifyWhatsAppWebhook(session, req.header("x-webhook-secret") || req.header("authorization")?.replace(/^Bearer /, ""))) return res.status(401).json({ error: "invalid webhook" });
      const event = String(req.body?.event || req.body?.type || "").toLowerCase();
      const connected = event.includes("connection.update") || event.includes("connected") || req.body?.data?.state === "open";
      const disconnected = event.includes("logout") || event.includes("close") || req.body?.data?.state === "close";
      if (db && (connected || disconnected)) await db.update(whatsappSessions).set({ status: connected ? "connected" : "disconnected", connectedPhone: req.body?.data?.phone || req.body?.phone || null, lastPingAt: new Date() }).where(eq(whatsappSessions.id, session.id));
      return res.json({ ok: true });
    } catch (error) { return res.status(500).json({ error: String(error) }); }
  });
  app.post("/api/webhooks/shopee", async (req, res) => {
    try {
      const db = await getDb();
      const partnerId = String(req.body?.partner_id || req.header("x-partner-id") || "");
      const authorization = String(req.header("authorization") || "");
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const callbackUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const integrations = db ? await db.select().from(affiliateIntegrations).where(eq(affiliateIntegrations.marketplace, "shopee")) : [];
      const verified = integrations.some(integration => {
        if (partnerId && integration.appId && integration.appId !== partnerId) return false;
        const key = integration.apiSecret || integration.apiKey;
        if (!key || !authorization) return false;
        const expected = crypto.createHmac("sha256", key).update(`${callbackUrl}|${rawBody}`).digest("hex");
        return expected.length === authorization.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(authorization));
      });
      if (!verified) return res.status(401).json({ error: "invalid Shopee push signature" });
      console.log("[Shopee webhook] authenticated push", req.body?.code || req.body?.type || "unknown");
      return res.json({ ok: true });
    } catch (error) { return res.status(500).json({ error: String(error) }); }
  });
  app.post("/api/webhooks/affiliate/:marketplace", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database unavailable" });
      const marketplace = String(req.params.marketplace).toLowerCase();
      const affiliateTag = String(req.body?.affiliateTag || req.body?.partnerTag || req.body?.tag || "");
      const eventId = String(req.body?.externalEventId || req.body?.eventId || req.body?.orderId || "");
      if (!affiliateTag || !eventId) return res.status(400).json({ error: "affiliateTag and eventId are required" });
      const [integration] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.marketplace, marketplace as any), eq(affiliateIntegrations.affiliateTag, affiliateTag))).limit(1);
      if (!integration) return res.status(404).json({ error: "integration not found" });
      const [existing] = await db.select().from(affiliateEvents).where(eq(affiliateEvents.externalEventId, eventId)).limit(1);
      if (existing) return res.json({ ok: true, duplicate: true });
      const orderValueCents = Math.round(Number(req.body?.orderValueCents ?? req.body?.orderValue ?? 0) * (req.body?.orderValueCents ? 1 : 100));
      const commissionCents = Math.round(Number(req.body?.commissionCents ?? req.body?.commission ?? 0) * (req.body?.commissionCents ? 1 : 100));
      await db.insert(affiliateEvents).values({ userId: integration.userId, offerId: Number(req.body?.offerId) || null, marketplace, eventType: "conversion", orderValueCents, commissionCents, source: "marketplace-webhook", externalEventId: eventId });
      return res.json({ ok: true });
    } catch (error) { return res.status(500).json({ error: String(error) }); }
  });
  app.post("/api/scheduled/scan-promotions", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const db = await getDb();
      if (!db) return res.json({ ok: true, skipped: "database unavailable" });
      const [job] = await db.select().from(automationJobs).where(eq(automationJobs.scheduleCronTaskUid, user.taskUid)).limit(1);
      if (!job) return res.json({ ok: true, skipped: "orphan" });
      const integrations = await db.select().from(affiliateIntegrations).where(eq(affiliateIntegrations.userId, job.userId));
      const userSegments = await db.select().from(segments).where(eq(segments.userId, job.userId));
      const keywords = userSegments.flatMap(segment => segment.keywords.split(",").map(keyword => keyword.trim()).filter(Boolean));
      let scanned = 0;
      for (const integration of integrations) {
        if (!integration.isConnected) continue;
        for (const keyword of keywords) {
          const promotions = await fetchConfiguredPromotions(integration, keyword);
          for (const promotion of promotions) {
            if (!promotion.priceCents) continue;
            const [existing] = await db.select().from(offers).where(and(eq(offers.userId, job.userId), eq(offers.originalUrl, promotion.url))).limit(1);
            if (existing) continue;
            await db.insert(offers).values({ userId: job.userId, title: promotion.title, originalUrl: promotion.url, affiliateUrl: convertAffiliateLink(promotion.url, integration), marketplace: integration.marketplace, originalPriceCents: promotion.originalPriceCents || promotion.priceCents, discountPriceCents: promotion.priceCents, discountPercent: 0, imageUrl: promotion.imageUrl, couponCode: promotion.couponCode, qualityScore: 0, isOfficialStore: false, isFreeShipping: false, status: "detected" });
            scanned += 1;
          }
        }
      }
      await db.update(automationJobs).set({ lastRunAt: new Date(), lastError: null }).where(eq(automationJobs.id, job.id));
      return res.json({ ok: true, scanned });
    } catch (error) {
      console.error("[scheduled/scan-promotions]", error);
      return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.VERCEL) {
    // A Vercel function serves the API; the frontend is served by Vercel's static output.
  } else if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  if (!process.env.VERCEL) {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  }

  return app;
}

export const appPromise = startServer();

if (!process.env.VERCEL) {
  appPromise.catch(console.error);
}
