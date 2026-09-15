import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import QRCode from "qrcode";
import {
  affiliateIntegrations,
  coupons,
  dispatches,
  InsertUser,
  invoices,
  messageTemplates,
  offers,
  plans,
  segments,
  subscriptions,
  User,
  users,
  whatsappGroups,
  whatsappSessions,
} from "../drizzle/schema";
import { FLOW_PLANS } from "../shared/products";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
  };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const val = user[field];
    if (val !== undefined) {
      values[field] = val;
      updateSet[field] = val;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

/**
 * Cria ou ativa um usuário após a confirmação de pagamento no Stripe.
 * Gera login e senha e libera acesso com plano anual.
 */
export async function activateUserFromCheckout(params: {
  email: string;
  name?: string;
  planId: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  tempPassword?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  if (params.stripeSessionId) {
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSessionId, params.stripeSessionId))
      .limit(1);
    if (existingSubscription) {
      const existingUser = await getUserById(existingSubscription.userId);
      return {
        userId: existingSubscription.userId,
        email: existingUser?.email || params.email.toLowerCase().trim(),
        tempPassword: undefined,
        plan: FLOW_PLANS.find((plan) => plan.id === existingSubscription.planId) || FLOW_PLANS[1],
      };
    }
  }

  const cleanEmail = params.email.toLowerCase().trim();
  let existing = await getUserByEmail(cleanEmail);

  // Calcula validade do plano (1 ano a partir de hoje)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  let userId: number;
  const generatedPassword = params.tempPassword || `${crypto.randomBytes(9).toString("base64url")}Fp!`;
  const passwordHash = await bcrypt.hash(generatedPassword, 12);

  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        status: "active",
        currentPlanId: params.planId,
        planExpiresAt: expiresAt,
        passwordHash,
        name: params.name || existing.name,
      })
      .where(eq(users.id, existing.id));
  } else {
    const openId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [insertResult] = await db.insert(users).values({
      openId,
      name: params.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      passwordHash,
      role: "user",
      status: "active",
      loginMethod: "credentials",
      currentPlanId: params.planId,
      planExpiresAt: expiresAt,
    });
    userId = (insertResult as any).insertId;
  }

  const selectedPlan = FLOW_PLANS.find((p) => p.id === params.planId) || FLOW_PLANS[1];

  // Registrar assinatura e fatura
  await db.insert(subscriptions).values({
    userId,
    planId: params.planId,
    stripeSessionId: params.stripeSessionId || `checkout_${Date.now()}`,
    stripePaymentIntentId: params.stripePaymentIntentId,
    status: "active",
    amountCents: selectedPlan.priceCents,
    currency: "BRL",
    customerEmail: cleanEmail,
    customerName: params.name,
  });

  await db.insert(invoices).values({
    userId,
    stripeInvoiceId: `inv_${Date.now()}`,
    stripePaymentIntentId: params.stripePaymentIntentId,
    amountCents: selectedPlan.priceCents,
    currency: "BRL",
    status: "paid",
    planName: `Plano ${selectedPlan.name} (Anual)`,
  });

  // Inicializar dados padrão para o usuário recém-ativado (templates, integração e sessão)

  return {
    userId,
    email: cleanEmail,
    tempPassword: generatedPassword,
    plan: selectedPlan,
  };
}

/**
 * Consulta estatísticas do Dashboard do afiliado
 */
export async function getAffiliateDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      whatsappStatus: "disconnected",
      planName: null,
      daysRemaining: 0,
      offersDetectedCount: 0,
      segmentsCount: 0,
      groupsCount: 0,
      scheduledDispatches: [],
      onboardingSteps: [],
    };
  }

  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [sessionRow] = await db
    .select()
    .from(whatsappSessions)
    .where(eq(whatsappSessions.userId, userId))
    .limit(1);

  const [offersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(offers)
    .where(eq(offers.userId, userId));

  const [segmentsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(segments)
    .where(eq(segments.userId, userId));

  const [groupsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(whatsappGroups)
    .where(eq(whatsappGroups.userId, userId));

  const scheduledList = await db
    .select()
    .from(dispatches)
    .where(and(eq(dispatches.userId, userId), eq(dispatches.status, "scheduled")))
    .orderBy(desc(dispatches.scheduledFor))
    .limit(5);

  // Calcula dias restantes da assinatura
  let daysRemaining = 0;
  if (userRow?.planExpiresAt) {
    const diffTime = new Date(userRow.planExpiresAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return {
    whatsappStatus: sessionRow?.status || "disconnected",
    connectedPhone: sessionRow?.connectedPhone || null,
    planName: userRow?.currentPlanId?.includes("expert")
      ? "Expert Anual"
      : userRow?.currentPlanId?.includes("essential")
      ? "Essencial Anual"
      : userRow?.currentPlanId?.includes("pro")
      ? "Pro Anual"
      : "Nenhum plano",
    planStatus: userRow?.currentPlanId && userRow?.status === "active" ? "Ativo" : "Sem assinatura",
    planExpiresAtFormatted: userRow?.planExpiresAt
      ? new Date(userRow.planExpiresAt).toLocaleDateString("pt-BR")
      : null,
    daysRemaining,
    offersDetectedCount: Number(offersCount?.count || 0),
    segmentsCount: Number(segmentsCount?.count || 0),
    groupsCount: Number(groupsCount?.count || 0),
    scheduledDispatches: scheduledList,
  };
}

/**
 * Funções de Admin para gerenciar todos os usuários, assinaturas e ofertas
 */
export async function getAdminMetrics() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      activeSubscribers: 0,
      totalRevenueCents: 0,
      totalOffersTracked: 0,
      recentUsers: [],
      recentSubscriptions: [],
    };
  }

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [activeUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.status, "active"));
  const [totalRevenue] = await db
    .select({ total: sql<number>`COALESCE(sum(amountCents), 0)` })
    .from(invoices)
    .where(eq(invoices.status, "paid"));
  const [totalOffers] = await db.select({ count: sql<number>`count(*)` }).from(offers);

  const recentUsersList = await db.select().from(users).orderBy(desc(users.createdAt)).limit(10);
  const recentSubsList = await db
    .select()
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt))
    .limit(10);

  return {
    totalUsers: Number(totalUsers?.count || 0),
    activeSubscribers: Number(activeUsers?.count || 0),
    totalRevenueCents: Number(totalRevenue?.total || 0),
    totalOffersTracked: Number(totalOffers?.count || 0),
    recentUsers: recentUsersList,
    recentSubscriptions: recentSubsList,
  };
}
