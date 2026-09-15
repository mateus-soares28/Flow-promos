import crypto from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { Request } from "express";
import { parse as parseCookie } from "cookie";
import { ADMIN_COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type AdminSessionPayload = {
  username: string;
  admin: true;
};

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateAdminCredentials(username: string, password: string) {
  const configuredUsername = ENV.adminUsername;
  const configuredPassword = ENV.adminPassword;
  if (!configuredUsername || !configuredPassword || !username || !password) return false;
  return timingSafeStringEqual(username, configuredUsername) && timingSafeStringEqual(password, configuredPassword);
}

function getSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createAdminSessionToken(username: string) {
  return new SignJWT({ username, admin: true } satisfies AdminSessionPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ADMIN_SESSION_TTL_MS) / 1000))
    .sign(getSecret());
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token || !ENV.cookieSecret) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.admin !== true || typeof payload.username !== "string" || !payload.username) return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function getAdminSession(req: Request) {
  const token = parseCookie(req.headers.cookie || "")[ADMIN_COOKIE_NAME];
  return verifyAdminSessionToken(token);
}

export const ADMIN_SESSION_MAX_AGE_MS = ADMIN_SESSION_TTL_MS;
export const ADMIN_SESSION_COOKIE = ADMIN_COOKIE_NAME;
