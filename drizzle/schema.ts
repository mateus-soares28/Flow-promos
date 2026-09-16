import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const table = pgTable;
const int = integer;

const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
const userStatusEnum = pgEnum("user_status", ["pending_payment", "active", "suspended"]);
const billingIntervalEnum = pgEnum("billing_interval", ["month", "year"]);
const subscriptionStatusEnum = pgEnum("subscription_status", ["pending", "active", "canceled", "failed"]);
const whatsappStatusEnum = pgEnum("whatsapp_status", ["disconnected", "connecting", "connected"]);
const providerEnum = pgEnum("whatsapp_provider", ["evolution", "zapi"]);
const whatsappActionEnum = pgEnum("whatsapp_action", ["qr_requested", "status_check", "connected", "disconnected", "test_message", "error"]);
const logStatusEnum = pgEnum("log_status", ["success", "failure"]);
const marketplaceEnum = pgEnum("marketplace", ["amazon", "shopee", "magalu", "mercadolivre", "aliexpress", "kabum"]);
const offerStatusEnum = pgEnum("offer_status", ["detected", "queued", "published", "rejected"]);
const eventTypeEnum = pgEnum("affiliate_event_type", ["click", "conversion"]);
const channelTypeEnum = pgEnum("channel_type", ["whatsapp", "telegram"]);
const dispatchStatusEnum = pgEnum("dispatch_status", ["scheduled", "sending", "sent", "failed"]);
const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "open", "void", "uncollectible"]);

/**
 * Tabela de usuários principal.
 * Compatível com o pipeline OAuth do Manus e com login direto por credenciais/Stripe checkout.
 */
export const users = table("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  authUserId: uuid("authUserId").unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  status: userStatusEnum("status").default("active"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  currentPlanId: varchar("currentPlanId", { length: 64 }),
  planExpiresAt: timestamp("planExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Planos disponíveis no sistema (Essencial, Pro, Expert) com recorrência mensal/anual.
 */
export const plans = table("plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  interval: billingIntervalEnum("interval").default("year").notNull(),
  priceCents: int("priceCents").notNull(),
  dailyLimitOffers: int("dailyLimitOffers").default(150).notNull(),
  maxWhatsappGroups: int("maxWhatsappGroups").default(5).notNull(),
  maxTelegramChannels: int("maxTelegramChannels").default(5).notNull(),
  qualityScoreMax: int("qualityScoreMax").default(80).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  stripeProductId: varchar("stripeProductId", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;

/**
 * Pedidos e assinaturas registradas no Stripe / checkout FlowPromos.
 */
export const subscriptions = table("subscriptions", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 160 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 160 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 160 }),
  status: subscriptionStatusEnum("status").default("pending").notNull(),
  amountCents: integer("amountCents").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: text("customerName"),
  tempPasswordGenerated: varchar("tempPasswordGenerated", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

/**
 * Sessões de WhatsApp com QR Code gerado, status de conexão e número pareado.
 */
export const whatsappSessions = table("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  instanceName: varchar("instanceName", { length: 100 }).notNull(),
  status: whatsappStatusEnum("status").default("disconnected").notNull(),
  qrCodeData: text("qrCodeData"),
  connectedPhone: varchar("connectedPhone", { length: 40 }),
  batteryLevel: int("batteryLevel").default(100),
  lastPingAt: timestamp("lastPingAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  provider: providerEnum("provider").default("evolution").notNull(),
  apiBaseUrl: varchar("apiBaseUrl", { length: 255 }),
  apiToken: text("apiToken"),
  externalInstanceId: varchar("externalInstanceId", { length: 120 }),
  webhookSecret: varchar("webhookSecret", { length: 180 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappSession = typeof whatsappSessions.$inferSelect;

export const whatsappConnectionLogs = table("whatsapp_connection_logs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  sessionId: int("sessionId"),
  action: whatsappActionEnum("action").notNull(),
  status: logStatusEnum("status").notNull(),
  details: text("details"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappConnectionLog = typeof whatsappConnectionLogs.$inferSelect;

/**
 * Grupos de WhatsApp cadastrados para receber ofertas automáticas.
 */
export const whatsappGroups = table("whatsapp_groups", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  jid: varchar("jid", { length: 160 }).notNull(),
  segmentId: int("segmentId"),
  participantsCount: int("participantsCount").default(0).notNull(),
  autoPostingEnabled: boolean("autoPostingEnabled").default(true).notNull(),
  delaySeconds: int("delaySeconds").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappGroup = typeof whatsappGroups.$inferSelect;

/**
 * Segmentos / Nichos de ofertas (ex: Eletrônicos, Casa & Cozinha, Ferramentas, Moda).
 */
export const segments = table("segments", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  keywords: text("keywords").notNull(),
  excludedKeywords: text("excludedKeywords"),
  minDiscountPercent: int("minDiscountPercent").default(10).notNull(),
  minQualityScore: int("minQualityScore").default(50).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Segment = typeof segments.$inferSelect;

/**
 * Credenciais e tags de afiliados cadastradas por loja (Shopee, Amazon, Magalu, Mercado Livre, AliExpress etc).
 */
export const affiliateIntegrations = table("affiliate_integrations", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  marketplace: marketplaceEnum("marketplace").notNull(),
  affiliateTag: varchar("affiliateTag", { length: 120 }).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  appId: varchar("appId", { length: 120 }),
  isConnected: boolean("isConnected").default(true).notNull(),
  autoConvertLinks: boolean("autoConvertLinks").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AffiliateIntegration = typeof affiliateIntegrations.$inferSelect;

/**
 * Ofertas detectadas pelos crawlers/APIs prontas para envio ou já enviadas.
 */
export const offers = table("offers", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  originalUrl: text("originalUrl").notNull(),
  affiliateUrl: text("affiliateUrl").notNull(),
  marketplace: varchar("marketplace", { length: 60 }).notNull(),
  originalPriceCents: int("originalPriceCents").notNull(),
  discountPriceCents: int("discountPriceCents").notNull(),
  discountPercent: int("discountPercent").notNull(),
  couponCode: varchar("couponCode", { length: 80 }),
  imageUrl: text("imageUrl"),
  qualityScore: int("qualityScore").default(75).notNull(),
  isOfficialStore: boolean("isOfficialStore").default(false).notNull(),
  isFreeShipping: boolean("isFreeShipping").default(false).notNull(),
  segmentId: int("segmentId"),
  status: offerStatusEnum("status").default("detected").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;

/** Eventos de atribuição recebidos ou registrados por marketplace. */
export const affiliateEvents = table("affiliate_events", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  offerId: int("offerId"),
  marketplace: varchar("marketplace", { length: 60 }).notNull(),
  eventType: eventTypeEnum("eventType").notNull(),
  orderValueCents: int("orderValueCents").default(0).notNull(),
  commissionCents: int("commissionCents").default(0).notNull(),
  source: varchar("source", { length: 80 }),
  externalEventId: varchar("externalEventId", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateEvent = typeof affiliateEvents.$inferSelect;

/**
 * Cupons detectados de lojas parceiras.
 */
export const coupons = table("coupons", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  marketplace: varchar("marketplace", { length: 60 }).notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  description: text("description"),
  discountLabel: varchar("discountLabel", { length: 80 }),
  minSpendCents: int("minSpendCents").default(0),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;

/**
 * Fila de disparos agendados e histórico de envios com status e link gerado.
 */
export const dispatches = table("dispatches", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  offerId: int("offerId"),
  groupId: int("groupId"),
  channelType: channelTypeEnum("channelType").default("whatsapp").notNull(),
  formattedMessage: text("formattedMessage").notNull(),
  scheduledFor: timestamp("scheduledFor").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  status: dispatchStatusEnum("status").default("scheduled").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dispatch = typeof dispatches.$inferSelect;

/**
 * Templates de mensagens customizáveis para conversão em vendas.
 */
export const messageTemplates = table("message_templates", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  content: text("content").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;

/**
 * Histórico de faturamento e pagamentos de clientes na plataforma.
 */
export const invoices = table("invoices", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 160 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 160 }),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  status: invoiceStatusEnum("status").default("paid").notNull(),
  planName: varchar("planName", { length: 120 }).notNull(),
  pdfUrl: text("pdfUrl"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Jobs recorrentes configurados pelo usuário. */
export const automationJobs = table("automation_jobs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  cronExpression: varchar("cronExpression", { length: 80 }).default("0 */15 * * * *").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AutomationJob = typeof automationJobs.$inferSelect;

export type Invoice = typeof invoices.$inferSelect;
