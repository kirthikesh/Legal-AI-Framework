"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homePath } from "@/lib/access.ts";
import { DEMO_USERS } from "@/lib/data.ts";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session.ts";
import { audit } from "@/lib/store.ts";

/** Demo sign-in: picks a sample user. Replace with the Cognito / IdP callback in production. */
export async function signInAsDemoUser(formData: FormData) {
  if (process.env.AUTH_MODE && process.env.AUTH_MODE !== "demo") {
    throw new Error("Demo sign-in is disabled (AUTH_MODE is not 'demo')");
  }
  const demo = DEMO_USERS.find((u) => u.id === formData.get("userId"));
  if (!demo) redirect("/login?error=unknown-user");

  const user = { sub: demo.id, name: demo.name, email: demo.email, role: demo.role, dept: demo.dept };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions);
  audit({ user: user.name, dept: user.dept ?? "platform", event: "Signed in", kind: "ok" });

  const next = String(formData.get("next") ?? "");
  // Only follow same-site relative paths
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homePath(user));
}
