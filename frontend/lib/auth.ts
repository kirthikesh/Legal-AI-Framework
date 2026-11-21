import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canManageUsers, canUseDepartment, isPlatformAdmin, type SessionUser } from "./access.ts";
import { SESSION_COOKIE, verifySessionToken } from "./session.ts";
import { audit } from "./store.ts";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Page-level checks. The proxy checks too, but pages never rely on it alone. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireDepartment(dept: string): Promise<SessionUser> {
  const user = await requireSession();
  if (isPlatformAdmin(user)) redirect("/admin");
  if (!canUseDepartment(user, dept)) {
    audit({ user: user.name, dept: user.dept ?? "-", event: `Tried to open the ${dept} workspace: denied`, kind: "denied" });
    redirect(`/denied?tenant=${encodeURIComponent(dept)}`);
  }
  return user;
}

export async function requireDeptAdmin(dept: string): Promise<SessionUser> {
  const user = await requireDepartment(dept);
  if (!canManageUsers(user, dept)) redirect(`/denied?reason=role&tenant=${encodeURIComponent(dept)}`);
  return user;
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (!isPlatformAdmin(user)) redirect("/denied?reason=admin");
  return user;
}
