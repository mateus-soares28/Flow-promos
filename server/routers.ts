import { ADMIN_COOKIE_NAME, COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte } from "drizzle-orm";
import QRCode from "qrcode";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import bcrypt from "bcryptjs";
import {
  affiliateIntegrations,
  affiliateEvents,
  coupons,
  dispatches,
  invoices,
  messageTemplates,
  offers,
  segments,
  subscriptions,
  users,
  whatsappGroups,
  whatsappSessions,
  whatsappConnectionLogs,
  automationJobs,
} from "../drizzle/schema";
import { FLOW_PLANS } from "../shared/products";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  activateUserFromCheckout,
  getAdminMetrics,
  getAffiliateDashboardStats,
  getDb,
  getUserByEmail,
} from "./db";
import { createFlowCheckoutSession, decryptCustomerPassword, retrievePaidCheckoutSession } from "./stripe";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { sendWhatsAppText } from "./integrations/whatsapp";
import { convertAffiliateLink } from "./integrations/marketplaces";
import { invokeLLM } from "./_core/llm";
import { ADMIN_SESSION_MAX_AGE_MS, createAdminSessionToken, validateAdminCredentials } from "./adminAuth";

async function logWhatsAppEvent(db: any, userId: number, action: "qr_requested" | "status_check" | "connected" | "disconnected" | "test_message" | "error", status: "success" | "failure", details?: string, errorMessage?: string, sessionId?: number) {
  await db.insert(whatsappConnectionLogs).values({ userId, sessionId: sessionId ?? null, action, status, details: details ?? null, errorMessage: errorMessage ?? null });
}

export const appRouter = router({
  system: systemRouter,

  // Autenticação (Manus OAuth + Login direto com Email/Senha)
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return null;
      }

      return ctx.user;
    }),

    loginWithCredentials: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash || user.status !== "active" || !(await bcrypt.compare(input.password, user.passwordHash))) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail ou senha inválidos.",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "" });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            currentPlanId: user.currentPlanId,
            status: user.status,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard principal do Afiliado (Visão Geral idêntica à referência)
  dashboard: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getAffiliateDashboardStats(ctx.user.id);
    }),
  }),

  analytics: router({
    overview: protectedProcedure.input(z.object({ period: z.enum(["daily", "weekly", "monthly"]) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { totals: { clicks: 0, conversions: 0, commissionCents: 0 }, marketplaces: [], timeline: [] };
      const durationMs = input.period === "daily" ? 24 * 60 * 60 * 1000 : input.period === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const events = await db.select().from(affiliateEvents).where(and(eq(affiliateEvents.userId, ctx.user.id), gte(affiliateEvents.createdAt, new Date(Date.now() - durationMs)))).orderBy(desc(affiliateEvents.createdAt));
      const byMarketplace = new Map<string, { marketplace: string; clicks: number; conversions: number; commissionCents: number; orderValueCents: number }>();
      const byDay = new Map<string, { date: string; clicks: number; conversions: number; commissionCents: number }>();
      for (const event of events) {
        const current = byMarketplace.get(event.marketplace) || { marketplace: event.marketplace, clicks: 0, conversions: 0, commissionCents: 0, orderValueCents: 0 };
        if (event.eventType === "click") current.clicks += 1;
        else { current.conversions += 1; current.commissionCents += event.commissionCents; current.orderValueCents += event.orderValueCents; }
        byMarketplace.set(event.marketplace, current);
        const date = new Date(event.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const day = byDay.get(date) || { date, clicks: 0, conversions: 0, commissionCents: 0 };
        if (event.eventType === "click") day.clicks += 1; else { day.conversions += 1; day.commissionCents += event.commissionCents; }
        byDay.set(date, day);
      }
      const marketplaces = Array.from(byMarketplace.values());
      return { totals: { clicks: marketplaces.reduce((sum, item) => sum + item.clicks, 0), conversions: marketplaces.reduce((sum, item) => sum + item.conversions, 0), commissionCents: marketplaces.reduce((sum, item) => sum + item.commissionCents, 0) }, marketplaces, timeline: Array.from(byDay.values()).slice(0, 14).reverse() };
    }),
    registerClick: protectedProcedure.input(z.object({ offerId: z.number() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [offer] = await db.select().from(offers).where(and(eq(offers.id, input.offerId), eq(offers.userId, ctx.user.id))).limit(1);
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      await db.insert(affiliateEvents).values({ userId: ctx.user.id, offerId: offer.id, marketplace: offer.marketplace, eventType: "click", source: "offers" });
      return { success: true };
    }),
  }),

  // Planos e Assinaturas (Stripe)
  plans: router({
    list: publicProcedure.query(() => {
      return FLOW_PLANS;
    }),

    createCheckout: publicProcedure
      .input(
        z.object({
          planId: z.string(),
          customerEmail: z.string().email(),
          customerName: z.string().optional(),
          customerPassword: z.string().min(8),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const origin = ctx.req.headers.origin || "https://3000-izhvqna93zc6bjvyobwdk-f63c16aa.us1.manus.computer";
        return createFlowCheckoutSession({
          planId: input.planId,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPassword: input.customerPassword,
          origin,
          userId: ctx.user?.id,
        });
      }),

    confirmPaymentAndActivate: publicProcedure
      .input(
        z.object({
          email: z.string().email().optional(),
          name: z.string().optional(),
          planId: z.string(),
          sessionId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const checkout = await retrievePaidCheckoutSession(input.sessionId);
        const checkoutEmail = checkout.customer_details?.email || input.email;
        if (!checkoutEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "O Stripe não retornou um e-mail para ativar a conta." });
        const checkoutPlanId = checkout.metadata?.plan_id;
        if (!checkoutPlanId) throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout sem plano associado." });
        return activateUserFromCheckout({
          email: checkoutEmail,
          name: checkout.customer_details?.name || input.name,
          planId: checkoutPlanId,
          tempPassword: decryptCustomerPassword(checkout.metadata?.customer_password_encrypted),
          stripeSessionId: input.sessionId,
          stripePaymentIntentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : undefined,
        });
      }),
  }),

  // Módulo de WhatsApp (Geração de QR Code, Pareamento e Status)
  whatsapp: router({
    getSession: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      if (!ENV.evolutionApiUrl || !ENV.evolutionApiToken || !ENV.evolutionInstanceId) return null;

      let [session] = await db
        .select()
        .from(whatsappSessions)
        .where(eq(whatsappSessions.userId, ctx.user.id))
        .limit(1);

      if (!session) {
        const [fresh] = await db
          .select()
          .from(whatsappSessions)
          .where(eq(whatsappSessions.userId, ctx.user.id))
          .limit(1);
        session = fresh;
      }

      if (session && ENV.evolutionApiUrl && ENV.evolutionApiToken && ENV.evolutionInstanceId && (session.apiBaseUrl !== ENV.evolutionApiUrl || session.externalInstanceId !== ENV.evolutionInstanceId)) {
        await db.update(whatsappSessions).set({ instanceName: ENV.evolutionInstanceId, provider: "evolution", apiBaseUrl: ENV.evolutionApiUrl, apiToken: ENV.evolutionApiToken, externalInstanceId: ENV.evolutionInstanceId, webhookSecret: ENV.evolutionWebhookSecret || null }).where(eq(whatsappSessions.id, session.id));
        session = { ...session, instanceName: ENV.evolutionInstanceId, provider: "evolution", apiBaseUrl: ENV.evolutionApiUrl, apiToken: ENV.evolutionApiToken, externalInstanceId: ENV.evolutionInstanceId, webhookSecret: ENV.evolutionWebhookSecret || null };
      }
      if (!session && ENV.evolutionApiUrl && ENV.evolutionApiToken && ENV.evolutionInstanceId) {
        await db.insert(whatsappSessions).values({ userId: ctx.user.id, instanceName: ENV.evolutionInstanceId, provider: "evolution", apiBaseUrl: ENV.evolutionApiUrl, apiToken: ENV.evolutionApiToken, externalInstanceId: ENV.evolutionInstanceId, webhookSecret: ENV.evolutionWebhookSecret || null, status: "disconnected" });
        [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
      }
      if (!session) return null;
      try {
        const { getWhatsAppConnectionState } = await import("./integrations/whatsapp");
        const remoteStatus = await getWhatsAppConnectionState(session);
        if (remoteStatus !== session.status) {
          await db.update(whatsappSessions).set({ status: remoteStatus, lastPingAt: new Date() }).where(eq(whatsappSessions.id, session.id));
          await logWhatsAppEvent(db, ctx.user.id, remoteStatus === "connecting" ? "status_check" : remoteStatus, "success", `Status remoto atualizado para ${remoteStatus}`, undefined, session.id);
          session = { ...session, status: remoteStatus, lastPingAt: new Date() };
        }
      } catch (error) {
        const [recentError] = await db.select().from(whatsappConnectionLogs).where(and(eq(whatsappConnectionLogs.userId, ctx.user.id), eq(whatsappConnectionLogs.action, "status_check"), eq(whatsappConnectionLogs.status, "failure"))).orderBy(desc(whatsappConnectionLogs.createdAt)).limit(1);
        if (!recentError || Date.now() - recentError.createdAt.getTime() > 60_000) await logWhatsAppEvent(db, ctx.user.id, "status_check", "failure", "Falha ao consultar o estado da Evolution API", String(error), session.id);
      }
      return {
        id: session.id, userId: session.userId, instanceName: session.instanceName,
        provider: session.provider, apiBaseUrl: session.apiBaseUrl, externalInstanceId: session.externalInstanceId,
        status: session.status, qrCodeData: session.qrCodeData, connectedPhone: session.connectedPhone,
        batteryLevel: session.batteryLevel, lastPingAt: session.lastPingAt, createdAt: session.createdAt, updatedAt: session.updatedAt,
      };
    }),

    logs: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(whatsappConnectionLogs).where(eq(whatsappConnectionLogs.userId, ctx.user.id)).orderBy(desc(whatsappConnectionLogs.createdAt)).limit(25);
    }),

    generateQrCode: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [configured] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
      if (!configured?.apiBaseUrl || !configured.apiToken || !configured.externalInstanceId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure o gateway WhatsApp antes de gerar o QR Code." });
      }
      const { getWhatsAppQrCode } = await import("./integrations/whatsapp");
      let qrDataUrl: string;
      try {
        qrDataUrl = await getWhatsAppQrCode(configured);
        await logWhatsAppEvent(db, ctx.user.id, "qr_requested", "success", "QR Code solicitado à Evolution API", undefined, configured.id);
      } catch (error) {
        await logWhatsAppEvent(db, ctx.user.id, "qr_requested", "failure", "Não foi possível gerar o QR Code", String(error), configured.id);
        throw error;
      }

      /* fallback visual apenas quando o gateway devolve uma string não-imagem */
      const qrDataUrlFinal = qrDataUrl.startsWith("data:") ? qrDataUrl : await QRCode.toDataURL(qrDataUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0a0a0a",
          light: "#ffffff",
        },
      });

      await db
        .update(whatsappSessions)
        .set({
          status: "connecting",
          qrCodeData: qrDataUrlFinal,
          lastPingAt: new Date(),
        })
        .where(eq(whatsappSessions.userId, ctx.user.id));

      return {
        qrCodeData: qrDataUrlFinal,
        status: "connecting",
      };
    }),

    saveConfig: adminProcedure
      .input(z.object({
        provider: z.enum(["evolution", "zapi"]),
        apiBaseUrl: z.string().url(),
        apiToken: z.string().min(8),
        externalInstanceId: z.string().min(2),
        webhookSecret: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [existing] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
        const values = { ...input, userId: ctx.user.id, instanceName: input.externalInstanceId, status: "disconnected" as const };
        if (existing) {
          await db.update(whatsappSessions).set(values).where(eq(whatsappSessions.id, existing.id));
        } else {
          await db.insert(whatsappSessions).values(values);
        }
        return { success: true };
      }),

    sendTestMessage: protectedProcedure
      .input(z.object({ phone: z.string().min(8), message: z.string().min(2), confirmAuthorized: z.literal(true) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
        if (!session?.apiBaseUrl || !session.apiToken || !session.externalInstanceId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure o gateway WhatsApp antes de enviar." });
        }
        const { sendWhatsAppText } = await import("./integrations/whatsapp");
        try {
          await sendWhatsAppText(session, input.phone, input.message);
          await logWhatsAppEvent(db, ctx.user.id, "test_message", "success", `Mensagem de teste enviada para final ${input.phone.replace(/\D/g, "").slice(-4)}`, undefined, session.id);
        } catch (error) {
          await logWhatsAppEvent(db, ctx.user.id, "test_message", "failure", `Falha no envio para final ${input.phone.replace(/\D/g, "").slice(-4)}`, String(error), session.id);
          throw error;
        }
        return { success: true };
      }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
      if (session?.apiBaseUrl && session.apiToken && session.externalInstanceId) {
        const { disconnectWhatsApp } = await import("./integrations/whatsapp");
        try {
          await disconnectWhatsApp(session);
          await logWhatsAppEvent(db, ctx.user.id, "disconnected", "success", "Sessão desconectada pelo usuário", undefined, session.id);
        } catch (error) {
          await logWhatsAppEvent(db, ctx.user.id, "disconnected", "failure", "Falha ao desconectar a sessão", String(error), session.id);
          throw error;
        }
      }

      await db
        .update(whatsappSessions)
        .set({
          status: "disconnected",
          connectedPhone: null,
          qrCodeData: null,
          lastPingAt: new Date(),
        })
        .where(eq(whatsappSessions.userId, ctx.user.id));

      return { success: true, status: "disconnected" };
    }),
  }),

  // Grupos de WhatsApp
  groups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(whatsappGroups)
        .where(eq(whatsappGroups.userId, ctx.user.id))
        .orderBy(desc(whatsappGroups.createdAt));
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          jid: z.string().min(5),
          segmentId: z.number().optional(),
          delaySeconds: z.number().default(30),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(whatsappGroups).values({
          userId: ctx.user.id,
          name: input.name,
          jid: input.jid.trim(),
          segmentId: input.segmentId,
          participantsCount: 0,
          delaySeconds: input.delaySeconds,
          autoPostingEnabled: true,
        });

        return { success: true };
      }),

    toggleAutoPosting: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          enabled: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db
          .update(whatsappGroups)
          .set({ autoPostingEnabled: input.enabled })
          .where(and(eq(whatsappGroups.id, input.groupId), eq(whatsappGroups.userId, ctx.user.id)));

        return { success: true };
      }),
  }),

  // Segmentos e Nichos de produtos
  segments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(segments)
        .where(eq(segments.userId, ctx.user.id))
        .orderBy(desc(segments.createdAt));
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          keywords: z.string().min(2),
          excludedKeywords: z.string().optional(),
          minDiscountPercent: z.number().default(10),
          minQualityScore: z.number().default(50),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(segments).values({
          userId: ctx.user.id,
          name: input.name,
          keywords: input.keywords,
          excludedKeywords: input.excludedKeywords,
          minDiscountPercent: input.minDiscountPercent,
          minQualityScore: input.minQualityScore,
          isActive: true,
        });

        return { success: true };
      }),
  }),

  // Ofertas Automáticas e Afiliados
  offers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(offers)
        .where(eq(offers.userId, ctx.user.id))
        .orderBy(desc(offers.createdAt));
    }),
    generateCopy: protectedProcedure
      .input(z.object({ productUrl: z.string().url(), productTitle: z.string().optional(), marketplace: z.string().optional() }))
      .mutation(async ({ input }) => {
        let pageContext = "";
        try {
          const response = await fetch(input.productUrl, { headers: { "user-agent": "FlowPromos/1.0" }, signal: AbortSignal.timeout(8000) });
          if (response.ok) pageContext = (await response.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ").replace(/\s+/g, " ").slice(0, 9000);
        } catch {}
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "Você é um redator de ofertas para afiliados no WhatsApp. Escreva em português brasileiro, com clareza, urgência responsável e sem inventar preço, desconto, frete, cupom ou características que não estejam no contexto. Retorne apenas o texto final pronto para copiar, sem explicar o processo." },
            { role: "user", content: `Crie uma mensagem persuasiva curta para vender este produto. Título informado: ${input.productTitle || "não informado"}. Marketplace: ${input.marketplace || "não informado"}. Link: ${input.productUrl}. Conteúdo público extraído da página: ${pageContext || "indisponível"}. Inclua uma chamada para ação e preserve o link exatamente.` },
          ],
          reasoning: { effort: "low" },
        });
        const content = result.choices?.[0]?.message?.content;
        return { copy: typeof content === "string" ? content : "Não foi possível gerar o texto agora." };
      }),

    createManualOffer: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3),
          originalUrl: z.string().url(),
          marketplace: z.string(),
          originalPriceCents: z.number(),
          discountPriceCents: z.number(),
          couponCode: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const discountPercent = Math.round(
          ((input.originalPriceCents - input.discountPriceCents) / input.originalPriceCents) * 100
        );

        const [integration] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace as any))).limit(1);
        if (!integration) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a integração de afiliado antes de cadastrar ofertas." });
        const affiliateUrl = convertAffiliateLink(input.originalUrl, integration);

        await db.insert(offers).values({
          userId: ctx.user.id,
          title: input.title,
          originalUrl: input.originalUrl,
          affiliateUrl,
          marketplace: input.marketplace,
          originalPriceCents: input.originalPriceCents,
          discountPriceCents: input.discountPriceCents,
          discountPercent,
          couponCode: input.couponCode,
          imageUrl: input.imageUrl,
          qualityScore: 0,
          isOfficialStore: false,
          isFreeShipping: false,
          status: "detected",
        });

        return { success: true };
      }),

    dispatchOfferNow: protectedProcedure
      .input(
        z.object({
          offerId: z.number(),
          groupId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [offer] = await db
          .select()
          .from(offers)
          .where(and(eq(offers.id, input.offerId), eq(offers.userId, ctx.user.id)))
          .limit(1);

        if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Oferta não encontrada" });

        const formattedMessage = `🚨 *OFERTA IMPERDÍVEL:* ${offer.title}\n💰 De R$ ${(
          offer.originalPriceCents / 100
        ).toFixed(2)} por *R$ ${(offer.discountPriceCents / 100).toFixed(2)}* (${
          offer.discountPercent
        }% OFF)\n${offer.couponCode ? `🏷️ Cupom: ${offer.couponCode}\n` : ""}🔗 Compre aqui: ${
          offer.affiliateUrl
        }`;

        const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);
        if (!session || session.status !== "connected") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte um gateway WhatsApp real antes de disparar." });
        const groups = input.groupId ? await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.id, input.groupId), eq(whatsappGroups.userId, ctx.user.id))).limit(1) : await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.userId, ctx.user.id), eq(whatsappGroups.autoPostingEnabled, true)));
        if (!groups.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cadastre pelo menos um grupo de destino." });
        for (const group of groups) {
          await sendWhatsAppText(session, group.jid, formattedMessage);
          await db.insert(dispatches).values({ userId: ctx.user.id, offerId: offer.id, groupId: group.id, channelType: "whatsapp", formattedMessage, status: "sent", sentAt: new Date() });
        }
        await db.update(offers).set({ status: "published", publishedAt: new Date() }).where(eq(offers.id, offer.id));
        return { success: true, message: `Oferta enviada para ${groups.length} grupo(s).` };
      }),
  }),
  // Cupons de desconto
  coupons: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(coupons)
        .where(eq(coupons.userId, ctx.user.id))
        .orderBy(desc(coupons.createdAt));
    }),

    create: protectedProcedure
      .input(
        z.object({
          marketplace: z.string(),
          code: z.string().min(2),
          description: z.string().optional(),
          discountLabel: z.string().optional(),
          minSpendCents: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(coupons).values({
          userId: ctx.user.id,
          marketplace: input.marketplace,
          code: input.code.toUpperCase().trim(),
          description: input.description,
          discountLabel: input.discountLabel,
          minSpendCents: input.minSpendCents,
          isActive: true,
        });

        return { success: true };
      }),
  }),

  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(messageTemplates).where(eq(messageTemplates.userId, ctx.user.id)).orderBy(desc(messageTemplates.createdAt));
    }),
    save: protectedProcedure.input(z.object({ id: z.number().optional(), title: z.string().min(2), content: z.string().min(2) })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.id) await db.update(messageTemplates).set({ title: input.title, content: input.content }).where(and(eq(messageTemplates.id, input.id), eq(messageTemplates.userId, ctx.user.id)));
      else await db.insert(messageTemplates).values({ userId: ctx.user.id, title: input.title, content: input.content, isDefault: false });
      return { success: true };
    }),
  }),
  // Integrações com Lojas (Shopee, Amazon, Magalu, Mercado Livre etc)
  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(affiliateIntegrations)
        .where(eq(affiliateIntegrations.userId, ctx.user.id));
    }),

    saveTag: protectedProcedure
      .input(
        z.object({
          marketplace: z.enum(["amazon", "shopee", "magalu", "mercadolivre", "aliexpress", "kabum"]),
          affiliateTag: z.string().min(2),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [existing] = await db
          .select()
          .from(affiliateIntegrations)
          .where(
            and(
              eq(affiliateIntegrations.userId, ctx.user.id),
              eq(affiliateIntegrations.marketplace, input.marketplace)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(affiliateIntegrations)
            .set({
              affiliateTag: input.affiliateTag,
              isConnected: true,
              autoConvertLinks: true,
            })
            .where(eq(affiliateIntegrations.id, existing.id));
        } else {
          await db.insert(affiliateIntegrations).values({
            userId: ctx.user.id,
            marketplace: input.marketplace,
            affiliateTag: input.affiliateTag,
            isConnected: true,
            autoConvertLinks: true,
          });
        }

        return { success: true };
      }),
    saveCredentials: protectedProcedure
      .input(z.object({
        marketplace: z.enum(["amazon", "shopee", "magalu", "mercadolivre", "aliexpress", "kabum"]),
        affiliateTag: z.string().min(2),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        appId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [existing] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace))).limit(1);
        const values = { affiliateTag: input.affiliateTag.trim(), apiKey: input.apiKey || null, apiSecret: input.apiSecret || null, appId: input.appId || null, isConnected: Boolean(input.apiKey && input.apiSecret && input.appId), autoConvertLinks: true };
        if (existing) await db.update(affiliateIntegrations).set(values).where(eq(affiliateIntegrations.id, existing.id));
        else await db.insert(affiliateIntegrations).values({ userId: ctx.user.id, marketplace: input.marketplace, ...values });
        return { success: true };
      }),
  }),

  // Disparos e Fila
  dispatches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(dispatches)
        .where(eq(dispatches.userId, ctx.user.id))
        .orderBy(desc(dispatches.createdAt))
        .limit(30);
    }),
  }),

  // Faturamento e Faturas
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, ctx.user.id))
        .orderBy(desc(invoices.createdAt));
    }),
  }),

  automation: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [job] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      return job || null;
    }),
    enable: protectedProcedure.input(z.object({ cronExpression: z.string().default("0 */15 * * * *") })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      if (existing?.scheduleCronTaskUid) return { success: true, taskUid: existing.scheduleCronTaskUid };
      const session = parseCookie(ctx.req.headers.cookie || "")[COOKIE_NAME] || "";
      const job = await createHeartbeatJob({ name: `flowpromos-scan-${ctx.user.id}`, cron: input.cronExpression, path: "/api/scheduled/scan-promotions", payload: { userId: ctx.user.id }, description: "Varredura periódica de promoções configuradas pelo usuário" }, session);
      if (existing) await db.update(automationJobs).set({ scheduleCronTaskUid: job.taskUid, cronExpression: input.cronExpression, isEnabled: true }).where(eq(automationJobs.id, existing.id));
      else await db.insert(automationJobs).values({ userId: ctx.user.id, name: `flowpromos-scan-${ctx.user.id}`, scheduleCronTaskUid: job.taskUid, cronExpression: input.cronExpression, isEnabled: true });
      return { success: true, taskUid: job.taskUid };
    }),
    disable: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [job] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      if (!job?.scheduleCronTaskUid) return { success: true };
      const session = parseCookie(ctx.req.headers.cookie || "")[COOKIE_NAME] || "";
      await deleteHeartbeatJob(job.scheduleCronTaskUid, session);
      await db.update(automationJobs).set({ scheduleCronTaskUid: null, isEnabled: false }).where(eq(automationJobs.id, job.id));
      return { success: true };
    }),
  }),
  // Painel Administrativo Geral
  admin: router({
    login: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!validateAdminCredentials(input.username, input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha administrativos inválidos." });
        }
        const token = await createAdminSessionToken(input.username);
        ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ADMIN_SESSION_MAX_AGE_MS,
        });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    getOverview: adminProcedure.query(async ({ ctx }) => {
      return getAdminMetrics();
    }),

    toggleUserStatus: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          status: z.enum(["active", "suspended", "pending_payment"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.update(users).set({ status: input.status }).where(eq(users.id, input.userId));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
