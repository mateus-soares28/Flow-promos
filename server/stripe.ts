import Stripe from "stripe";
import crypto from "node:crypto";
import { FLOW_PLANS } from "../shared/products";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2025-01-27.acacia" as any }) : null;
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

function passwordKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado para proteger o checkout.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptCustomerPassword(password: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", passwordKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptCustomerPassword(value?: string | null) {
  if (!value) return undefined;
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) return undefined;
  const decipher = crypto.createDecipheriv("aes-256-gcm", passwordKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
}

export interface CreateCheckoutInput { planId: string; customerEmail: string; customerName?: string; customerPassword: string; origin: string; userId?: number; }

export async function createFlowCheckoutSession(input: CreateCheckoutInput) {
  const selectedPlan = FLOW_PLANS.find(p => p.id === input.planId);
  if (!selectedPlan) throw new Error("Plano inválido.");
  if (!stripe) throw new Error("Stripe não configurado. Adicione STRIPE_SECRET_KEY em Settings → Payment.");
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: input.customerEmail,
    client_reference_id: input.userId ? String(input.userId) : undefined,
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: "brl", product_data: { name: `FlowPromos - Plano ${selectedPlan.name}`, description: selectedPlan.features.slice(0, 3).join(" • ") }, unit_amount: selectedPlan.priceCents }, quantity: 1 }],
    mode: "payment",
    metadata: { plan_id: selectedPlan.id, customer_email: input.customerEmail, customer_name: input.customerName || "", customer_password_encrypted: encryptCustomerPassword(input.customerPassword), user_id: input.userId ? String(input.userId) : "" },
    success_url: `${input.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${selectedPlan.id}`,
    cancel_url: `${input.origin}/planos?canceled=true`,
  });
  return { url: session.url || `${input.origin}/planos`, sessionId: session.id, isSimulated: false, plan: selectedPlan };
}

export async function retrievePaidCheckoutSession(sessionId: string) {
  if (!stripe) throw new Error("Stripe não configurado.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") throw new Error("Pagamento ainda não confirmado pelo Stripe.");
  return session;
}
