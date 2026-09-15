import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Tabela de usuários principal.
 * Compatível com o pipeline OAuth do Manus e com login direto por credenciais/Stripe checkout.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  status: mysqlEnum("status", ["pending_payment", "active", "suspended"]).default("active"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  currentPlanId: varchar("currentPlanId", { length: 64 }),
  planExpiresAt: timestamp("planExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Planos disponíveis no sistema (Essencial, Pro, Expert) com recorrência mensal/anual.
 */
export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  interval: mysqlEnum("interval", ["month", "year"]).default("year").notNull(),
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
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 160 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 160 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 160 }),
  status: mysqlEnum("status", ["pending", "active", "canceled", "failed"]).default("pending").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: text("customerName"),
  tempPasswordGenerated: varchar("tempPasswordGenerated", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

/**
 * Sessões de WhatsApp com QR Code gerado, status de conexão e número pareado.
 */
export const whatsappSessions = mysqlTable("whatsapp_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  instanceName: varchar("instanceName", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["disconnected", "connecting", "connected"]).default("disconnected").notNull(),
  qrCodeData: text("qrCodeData"),
  connectedPhone: varchar("connectedPhone", { length: 40 }),
  batteryLevel: int("batteryLevel").default(100),
  lastPingAt: timestamp("lastPingAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  provider: mysqlEnum("provider", ["evolution", "zapi"]).default("evolution").notNull(),
  apiBaseUrl: varchar("apiBaseUrl", { length: 255 }),
  apiToken: text("apiToken"),
  externalInstanceId: varchar("externalInstanceId", { length: 120 }),
  webhookSecret: varchar("webhookSecret", { length: 180 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappSession = typeof whatsappSessions.$inferSelect;

export const whatsappConnectionLogs = mysqlTable("whatsapp_connection_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: int("sessionId"),
  action: mysqlEnum("action", ["qr_requested", "status_check", "connected", "disconnected", "test_message", "error"]).notNull(),
  status: mysqlEnum("status", ["success", "failure"]).notNull(),
  details: text("details"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappConnectionLog = typeof whatsappConnectionLogs.$inferSelect;

/**
 * Grupos de WhatsApp cadastrados para receber ofertas automáticas.
 */
export const whatsappGroups = mysqlTable("whatsapp_groups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  jid: varchar("jid", { length: 160 }).notNull(),
  segmentId: int("segmentId"),
  participantsCount: int("participantsCount").default(0).notNull(),
  autoPostingEnabled: boolean("autoPostingEnabled").default(true).notNull(),
  delaySeconds: int("delaySeconds").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappGroup = typeof whatsappGroups.$inferSelect;

/**
 * Segmentos / Nichos de ofertas (ex: Eletrônicos, Casa & Cozinha, Ferramentas, Moda).
 */
export const segments = mysqlTable("segments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  keywords: text("keywords").notNull(),
  excludedKeywords: text("excludedKeywords"),
  minDiscountPercent: int("minDiscountPercent").default(10).notNull(),
  minQualityScore: int("minQualityScore").default(50).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Segment = typeof segments.$inferSelect;

/**
 * Credenciais e tags de afiliados cadastradas por loja (Shopee, Amazon, Magalu, Mercado Livre, AliExpress etc).
 */
export const affiliateIntegrations = mysqlTable("affiliate_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  marketplace: mysqlEnum("marketplace", [
    "amazon",
    "shopee",
    "magalu",
    "mercadolivre",
    "aliexpress",
    "kabum"
  ]).notNull(),
  affiliateTag: varchar("affiliateTag", { length: 120 }).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  appId: varchar("appId", { length: 120 }),
  isConnected: boolean("isConnected").default(true).notNull(),
  autoConvertLinks: boolean("autoConvertLinks").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateIntegration = typeof affiliateIntegrations.$inferSelect;

/**
 * Ofertas detectadas pelos crawlers/APIs prontas para envio ou já enviadas.
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
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
  status: mysqlEnum("status", ["detected", "queued", "published", "rejected"]).default("detected").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;

/** Eventos de atribuição recebidos ou registrados por marketplace. */
export const affiliateEvents = mysqlTable("affiliate_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  offerId: int("offerId"),
  marketplace: varchar("marketplace", { length: 60 }).notNull(),
  eventType: mysqlEnum("eventType", ["click", "conversion"]).notNull(),
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
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
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
export const dispatches = mysqlTable("dispatches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  offerId: int("offerId"),
  groupId: int("groupId"),
  channelType: mysqlEnum("channelType", ["whatsapp", "telegram"]).default("whatsapp").notNull(),
  formattedMessage: text("formattedMessage").notNull(),
  scheduledFor: timestamp("scheduledFor").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["scheduled", "sending", "sent", "failed"]).default("scheduled").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dispatch = typeof dispatches.$inferSelect;

/**
 * Templates de mensagens customizáveis para conversão em vendas.
 */
export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
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
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 160 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 160 }),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["paid", "open", "void", "uncollectible"]).default("paid").notNull(),
  planName: varchar("planName", { length: 120 }).notNull(),
  pdfUrl: text("pdfUrl"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Jobs recorrentes configurados pelo usuário. */
export const automationJobs = mysqlTable("automation_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  cronExpression: varchar("cronExpression", { length: 80 }).default("0 */15 * * * *").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationJob = typeof automationJobs.$inferSelect;

export type Invoice = typeof invoices.$inferSelect;
