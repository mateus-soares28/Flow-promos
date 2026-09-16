import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAdminSession } from "../adminAuth";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isAdminSession: boolean;
};

function buildAdminUser(username: string): User {
  const now = new Date();
  return {
    id: 0,
    openId: "flowpromos-admin-session",
    authUserId: null,
    name: username,
    email: null,
    loginMethod: "admin_credentials",
    role: "admin",
    passwordHash: null,
    status: "active",
    stripeCustomerId: null,
    currentPlanId: null,
    planExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const adminSession = await getAdminSession(opts.req);
  if (adminSession) {
    return {
      req: opts.req,
      res: opts.res,
      user: buildAdminUser(adminSession.username),
      isAdminSession: true,
    };
  }

  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isAdminSession: false,
  };
}
