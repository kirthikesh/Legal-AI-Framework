"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDeptAdmin } from "@/lib/auth.ts";
import type { DepartmentId } from "@/lib/data.ts";
import { audit, inviteUser, removeUser } from "@/lib/store.ts";

// Every action re-checks the caller: server actions are public endpoints.

export async function invite(dept: string, formData: FormData) {
  const admin = await requireDeptAdmin(dept);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "dept_admin" ? "dept_admin" : "member";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/w/${dept}/users?error=email`);
  inviteUser(dept as DepartmentId, email, role);
  audit({ user: admin.name, dept, event: `Invited ${email} as ${role === "dept_admin" ? "Department admin" : "Member"}`, kind: "ok" });
  revalidatePath(`/w/${dept}/users`);
}

export async function remove(dept: string, formData: FormData) {
  const admin = await requireDeptAdmin(dept);
  const id = String(formData.get("id") ?? "");
  if (id === admin.sub) redirect(`/w/${dept}/users?error=self`);
  if (removeUser(dept as DepartmentId, id)) {
    audit({ user: admin.name, dept, event: "Removed a user", kind: "ok" });
  }
  revalidatePath(`/w/${dept}/users`);
}
