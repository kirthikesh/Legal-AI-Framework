import type { Metadata } from "next";
import Link from "next/link";
import { LockIcon } from "@/components/Icons.tsx";
import { homePath } from "@/lib/access.ts";
import { requireSession } from "@/lib/auth.ts";
import { ROLE_LABEL, departmentName, isDepartmentId } from "@/lib/data.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Access denied" };

export default async function DeniedPage({ searchParams }: { searchParams: Promise<{ tenant?: string; reason?: string }> }) {
  const user = await requireSession();
  const { tenant = "", reason } = await searchParams;
  const target = isDepartmentId(tenant) ? departmentName(tenant) : null;
  const mine = user.dept ? departmentName(user.dept) : "no department (platform admin)";

  let title = "This belongs to another department";
  let body = (
    <>You are signed in to <strong>{mine}</strong>. This is in the <strong>{target ?? "another"}</strong> workspace, so it isn&apos;t available to you, and the AI assistant can&apos;t read it either.</>
  );
  if (reason === "admin") {
    title = "Admins only";
    body = <>The admin console is for platform admins. Your role is <strong>{ROLE_LABEL[user.role]}</strong>.</>;
  } else if (reason === "role") {
    title = "Department admins only";
    body = <>Managing users in {target ?? "this department"} needs the <strong>Department admin</strong> role.</>;
  } else if (!user.dept) {
    body = <>Platform admins manage departments but can&apos;t open their documents or chats.</>;
  }

  return (
    <div className="full-center">
      <div className="panel" style={{ maxWidth: 560 }}>
        <span className="lock-icon"><LockIcon size={28} /></span>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 28 }}>{title}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>{body}</p>
        </div>
        <dl className="facts">
          <div><dt>Your department</dt><dd>{user.dept ? departmentName(user.dept) : "None"}</dd></div>
          <div><dt>Requested tenant</dt><dd className="mono">{tenant || "admin"}</dd></div>
          <div><dt>Your role</dt><dd>{ROLE_LABEL[user.role]}</dd></div>
          <div><dt>Logged</dt><dd>Yes, in the audit log</dd></div>
        </dl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link className="btn" href={homePath(user)}>Back to my workspace</Link>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Access is checked on every request using your login token&apos;s department and role.</p>
      </div>
    </div>
  );
}
