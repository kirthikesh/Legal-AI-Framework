// Signed session cookie (JWT, HS256) holding who the user is, their role and their department.
// In production the identity comes from the company IdP via Amazon Cognito; the cookie format stays the same.

import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "./access.ts";

export const SESSION_COOKIE = "laf_session";
const MAX_AGE_SECONDS = 8 * 60 * 60; // one working day

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("SESSION_SECRET must be set (32+ characters) in production");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-0123456789");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role, dept: user.dept })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as SessionUser["role"],
      dept: (payload.dept ?? null) as SessionUser["dept"],
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
