import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, LockIcon } from "@/components/Icons.tsx";
import { SignOut } from "@/components/SignOut.tsx";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar.tsx";
import { requireDepartment } from "@/lib/auth.ts";
import { DEPARTMENTS, MODELS, ROLE_LABEL, departmentName, documentsFor, type DepartmentId } from "@/lib/data.ts";
import { getApprovals } from "@/lib/store.ts";
import { Chat } from "./Chat.tsx";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }): Promise<Metadata> {
  const { dept } = await params;
  return { title: `${departmentName(dept)} workspace` };
}

export default async function WorkspacePage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const user = await requireDepartment(dept);
  const deptId = dept as DepartmentId;
  const name = departmentName(deptId);

  const approvedIds = getApprovals()[deptId];
  const approved = MODELS.filter((m) => approvedIds.includes(m.id)).map(({ id, label }) => ({ id, label }));
  const locked = MODELS.filter((m) => !approvedIds.includes(m.id)).map(({ id, label }) => ({ id, label }));
  const docs = documentsFor(deptId);
  // A document from another tenant, to demo the isolation check
  const otherDoc = { id: deptId === "finance" ? "hr-handbook" : "fin-q3-vendor", dept: deptId === "finance" ? "HR" : "Finance" };

  return (
    <div className="shell">
      <WorkspaceSidebar user={user} active="assistant" />
      <main className="main">
        <header className="page-head">
          <div>
            <h1>{name} workspace</h1>
            <p>Everything here is visible to the {name} team only.</p>
          </div>
          <div className="head-actions">
            <span className="badge warn">Sample data</span>
            <SignOut />
          </div>
        </header>

        <div className="row">
          <Chat deptName={name} approved={approved} locked={locked} />

          <div className="col-1">
            <section className="card" aria-labelledby="access-title">
              <h2 id="access-title">Your access</h2>
              <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Role: {ROLE_LABEL[user.role]}. You can use {name}&apos;s documents and approved models. Other departments are isolated.
              </p>
              <div className="access-grid">
                {DEPARTMENTS.map((d) =>
                  d.id === deptId ? (
                    <span key={d.id} className="mine"><CheckIcon /> {d.name}</span>
                  ) : (
                    <span key={d.id}><LockIcon /> {d.name}</span>
                  ),
                )}
              </div>
              <Link href={`/docs/${otherDoc.id}`} style={{ fontSize: 13 }}>Try opening {otherDoc.dept === "HR" ? "an" : "a"} {otherDoc.dept} document</Link>
            </section>

            <section className="card" aria-labelledby="docs-title">
              <h2 id="docs-title">Recent {name} documents</h2>
              <ul className="doc-list">
                {docs.map((d) => (
                  <li key={d.id}>
                    <Link href={`/docs/${d.id}`}>{d.title}</Link>
                    <span className="muted" style={{ fontSize: 13 }}>{d.updated}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card" aria-labelledby="usage-title">
              <h2 id="usage-title">{name} AI budget this month</h2>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>[USED] of [BUDGET]</span>
                <span className="muted">set by admin</span>
              </div>
              <div className="bar" role="img" aria-label="Budget used, placeholder"><div style={{ width: "40%" }} /></div>
              <p className="small muted" style={{ margin: 0 }}>Billed per request through AWS Bedrock; no per-seat licences.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
