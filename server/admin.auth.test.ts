import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { validateAdminCredentials } from "./adminAuth";
import { activateUserFromCheckout } from "./db";

const hasDatabase = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("replace-with-database-password"));

function createPublicContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string }> } {
  const cookies: Array<{ name: string; value: string }> = [];
  return {
    cookies,
    ctx: {
      user: null,
      isAdminSession: false,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string) => cookies.push({ name, value }),
      } as TrpcContext["res"],
    },
  };
}

describe("admin credential authentication", () => {
  it("accepts the configured server credentials and rejects invalid credentials", () => {
    const username = process.env.FLOWPROMOS_ADMIN_USERNAME;
    const password = process.env.FLOWPROMOS_ADMIN_PASSWORD;

    expect(username).toBeTruthy();
    expect(password).toBeTruthy();
    expect(validateAdminCredentials(username ?? "", password ?? "")).toBe(true);
    expect(validateAdminCredentials(username ?? "", `${password ?? ""}-invalid`)).toBe(false);
    expect(validateAdminCredentials("invalid-admin", password ?? "")).toBe(false);
  });

  it("authenticates through the admin login API procedure and issues a session cookie", async () => {
    const username = process.env.FLOWPROMOS_ADMIN_USERNAME ?? "";
    const password = process.env.FLOWPROMOS_ADMIN_PASSWORD ?? "";
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.login({ username, password });

    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBeTruthy();
  });

  it.skipIf(!hasDatabase)("authenticates a paid customer and issues the regular session cookie", async () => {
    const email = `credential_login_${Date.now()}@flowpromos.com.br`;
    await activateUserFromCheckout({
      email,
      name: "Cliente FlowPromos",
      planId: "essential_annual",
      tempPassword: "senha-teste-123",
      stripeSessionId: `sess_login_${Date.now()}`,
    });

    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.loginWithCredentials({ email, password: "senha-teste-123" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(email);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBeTruthy();
  });
});
