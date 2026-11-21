import { test } from "node:test";
import assert from "node:assert/strict";
import { canManageUsers, canUseDepartment, homePath, isModelApproved, isPlatformAdmin, type SessionUser } from "../lib/access.ts";
import { DEFAULT_APPROVALS } from "../lib/data.ts";

const financeMember: SessionUser = { sub: "1", name: "A", email: "a@x", role: "member", dept: "finance" };
const financeAdmin: SessionUser = { sub: "2", name: "B", email: "b@x", role: "dept_admin", dept: "finance" };
const platformAdmin: SessionUser = { sub: "3", name: "C", email: "c@x", role: "platform_admin", dept: null };

test("members only reach their own department", () => {
  assert.equal(canUseDepartment(financeMember, "finance"), true);
  for (const other of ["developer", "testing", "hr", "legal", "operations"]) {
    assert.equal(canUseDepartment(financeMember, other), false, other);
  }
});

test("platform admins never read department data", () => {
  assert.equal(canUseDepartment(platformAdmin, "finance"), false);
  assert.equal(isPlatformAdmin(platformAdmin), true);
  assert.equal(homePath(platformAdmin), "/admin");
});

test("only a department's own admin manages its users", () => {
  assert.equal(canManageUsers(financeAdmin, "finance"), true);
  assert.equal(canManageUsers(financeAdmin, "hr"), false);
  assert.equal(canManageUsers(financeMember, "finance"), false);
  assert.equal(canManageUsers(platformAdmin, "finance"), false);
});

test("signed-out users get nothing", () => {
  assert.equal(canUseDepartment(null, "finance"), false);
  assert.equal(canManageUsers(null, "finance"), false);
});

test("model approvals are per department", () => {
  assert.equal(isModelApproved(DEFAULT_APPROVALS, "finance", "claude"), true);
  assert.equal(isModelApproved(DEFAULT_APPROVALS, "finance", "gptoss"), false);
  assert.equal(isModelApproved(DEFAULT_APPROVALS, "developer", "gptoss"), true);
});
