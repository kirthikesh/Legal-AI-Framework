// In-memory store for the prototype: model approvals, department users and the audit log.
// Resets when the server restarts. Swap for DynamoDB (one partition per tenant) in production.

import { DEFAULT_APPROVALS, DEMO_USERS, type DepartmentId, type ModelId, type Role } from "./data.ts";

export interface DeptUser {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "platform_admin">;
  status: "Active" | "Invited";
}

export interface AuditEntry {
  at: string; // ISO time
  user: string;
  dept: string;
  event: string;
  model?: string;
  kind: "ok" | "blocked" | "denied";
}

interface Store {
  approvals: Record<DepartmentId, ModelId[]>;
  users: Record<DepartmentId, DeptUser[]>;
  audit: AuditEntry[];
}

function seed(): Store {
  const users = {} as Record<DepartmentId, DeptUser[]>;
  for (const id of ["developer", "testing", "finance", "hr", "legal", "operations"] as DepartmentId[]) users[id] = [];
  for (const u of DEMO_USERS) {
    if (u.dept && u.role !== "platform_admin") {
      users[u.dept].push({ id: u.id, name: u.name, email: u.email, role: u.role, status: "Active" });
    }
  }
  users.finance.push({ id: "u-pending-1", name: "Pending", email: "new.analyst@company.com", role: "member", status: "Invited" });
  return {
    approvals: structuredClone(DEFAULT_APPROVALS),
    users,
    audit: [],
  };
}

// Keep one instance across hot reloads in dev
const g = globalThis as unknown as { __lafStore?: Store };
const store: Store = g.__lafStore ?? (g.__lafStore = seed());

export function getApprovals(): Record<DepartmentId, ModelId[]> {
  return store.approvals;
}

export function toggleApproval(dept: DepartmentId, model: ModelId): boolean {
  const list = store.approvals[dept];
  const on = list.includes(model);
  store.approvals[dept] = on ? list.filter((m) => m !== model) : [...list, model];
  return !on;
}

export function listUsers(dept: DepartmentId): DeptUser[] {
  return store.users[dept];
}

export function inviteUser(dept: DepartmentId, email: string, role: DeptUser["role"]): DeptUser {
  const user: DeptUser = { id: `u-${Date.now().toString(36)}`, name: "Pending", email, role, status: "Invited" };
  store.users[dept].push(user);
  return user;
}

export function removeUser(dept: DepartmentId, id: string): boolean {
  const before = store.users[dept].length;
  store.users[dept] = store.users[dept].filter((u) => u.id !== id);
  return store.users[dept].length < before;
}

export function audit(entry: Omit<AuditEntry, "at">): void {
  store.audit.unshift({ at: new Date().toISOString(), ...entry });
  if (store.audit.length > 500) store.audit.length = 500;
}

export function listAudit(limit = 100): AuditEntry[] {
  return store.audit.slice(0, limit);
}
