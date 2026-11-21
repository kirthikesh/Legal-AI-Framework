// Authorisation rules (RBAC + tenant isolation), in one place so they can be unit tested.
// Kept free of Next.js imports on purpose.

import type { DepartmentId, ModelId, Role } from "./data.ts";

export interface SessionUser {
  sub: string;
  name: string;
  email: string;
  role: Role;
  dept: DepartmentId | null;
}

/** Can this user read a department's documents and use its AI assistant? */
export function canUseDepartment(user: SessionUser | null, dept: string): boolean {
  if (!user || !user.dept) return false; // platform admins manage tenants but never read tenant data
  return user.dept === dept;
}

/** Can this user add/remove people in a department? Only that department's own admin. */
export function canManageUsers(user: SessionUser | null, dept: string): boolean {
  return !!user && user.role === "dept_admin" && user.dept === dept;
}

export function isPlatformAdmin(user: SessionUser | null): boolean {
  return !!user && user.role === "platform_admin";
}

export function isModelApproved(
  approvals: Record<DepartmentId, ModelId[]>,
  dept: DepartmentId,
  model: string,
): boolean {
  return (approvals[dept] ?? []).includes(model as ModelId);
}

/** Where a user lands after sign-in. */
export function homePath(user: SessionUser): string {
  if (user.role === "platform_admin" || !user.dept) return "/admin";
  return `/w/${user.dept}`;
}
