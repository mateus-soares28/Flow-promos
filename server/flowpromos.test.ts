import { describe, expect, it } from "vitest";
import { FLOW_PLANS } from "../shared/products";
import { activateUserFromCheckout, getUserByEmail } from "./db";
import { decryptCustomerPassword, encryptCustomerPassword } from "./stripe";

describe("FlowPromos Business Logic", () => {
  it("deve carregar os planos com preços e regras de limite corretos", () => {
    expect(FLOW_PLANS.length).toBe(3);
    const proPlan = FLOW_PLANS.find((p) => p.id === "pro_annual");
    expect(proPlan).toBeDefined();
    expect(proPlan?.monthlyEquivalent).toBe(49.9);
    expect(proPlan?.priceCents).toBe(59880);
    expect(proPlan?.dailyLimitOffers).toBe(150);
  });

  it("deve ativar o usuário pós-compra do Stripe e gerar senha temporária", async () => {
    const testEmail = `test_affiliate_${Date.now()}@flowpromos.com.br`;
    const activation = await activateUserFromCheckout({
      email: testEmail,
      name: "Afiliado Teste",
      planId: "pro_annual",
      stripeSessionId: "sess_test_12345",
    });

    expect(activation.email).toBe(testEmail);
    expect(activation.tempPassword).toBeDefined();
    expect(activation.plan.name).toBe("Pro");

    const userInDb = await getUserByEmail(testEmail);
    expect(userInDb).toBeDefined();
    expect(userInDb?.status).toBe("active");
    expect(userInDb?.currentPlanId).toBe("pro_annual");
  });

  it("deve proteger e recuperar a senha do cadastro sem texto puro no metadado", () => {
    const encrypted = encryptCustomerPassword("senha-segura-123");
    expect(encrypted).not.toContain("senha-segura-123");
    expect(decryptCustomerPassword(encrypted)).toBe("senha-segura-123");
  });
});
