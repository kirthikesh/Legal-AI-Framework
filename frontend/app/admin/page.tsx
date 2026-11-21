import type { Metadata } from "next";
import Link from "next/link";
import { BuildingIcon, ListIcon, Logo, ShieldIcon } from "@/components/Icons.tsx";
import { SignOut } from "@/components/SignOut.tsx";
import { requirePlatformAdmin } from "@/lib/auth.ts";
import { DEPARTMENTS, MODELS, departmentName, isDepartmentId } from "@/lib/data.ts";
import { getApprovals, listAudit, listUsers } from "@/lib/store.ts";
import { toggleModel } from "./actions.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin console" };

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" });
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; dept?: string }> }) {
  await requirePlatformAdmin();
  const { tab, dept } = await searchParams;
  const showAudit = tab === "audit";
  const selected = dept && isDepartmentId(dept) ? dept : "finance";
  const approvals = getApprovals();

  return (
    <div className="shell">
      <aside className="sidebar dark">
        <div className="brand">
          <Logo color="#5EEAD4" />
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 15 }}>Legal AI Framework</span>
            <span className="small muted" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>Admin console</span>
          </span>
        </div>
        <nav className="nav" aria-label="Admin">
          <Link href="/admin" aria-current={!showAudit ? "page" : undefined}><BuildingIcon /> Departments and models</Link>
          <Link href="/admin?tab=audit" aria-current={showAudit ? "page" : undefined}><ListIcon /> Audit log</Link>
        </nav>
        <div className="side-foot">
          <span style={{ fontWeight: 500 }}>Platform admin</span>
          <span className="small muted">Manages access, never reads department data</span>
        </div>
      </aside>

      <main className="main">
        <header className="page-head">
          <div>
            <h1>{showAudit ? "Audit log" : "Departments and models"}</h1>
            <p>{showAudit ? "Every AI request and access check, per department." : "6 isolated tenants. Pick a department to set which Bedrock models it may use."}</p>
          </div>
          <div className="head-actions">
            <span className="badge warn">Sample data</span>
            <SignOut />
          </div>
        </header>

        <div className="notice">
          <ShieldIcon size={18} />
          Admins manage tenants, roles and models. Document contents and chats stay inside each department.
        </div>

        {!showAudit ? (
          <div className="row">
            <section className="card flush col-2" aria-labelledby="dept-title">
              <div className="card-head"><h2 id="dept-title" style={{ fontSize: 18 }}>Departments (tenants)</h2></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th scope="col">Department</th><th scope="col">Tenant ID</th><th scope="col">Users</th><th scope="col">Approved models</th><th scope="col"><span className="sr-only">Manage</span></th></tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map((d) => (
                      <tr key={d.id} className={d.id === selected ? "selected" : undefined}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td className="mono muted">{d.id}</td>
                        <td>{listUsers(d.id).length}</td>
                        <td>{approvals[d.id].length} of {MODELS.length}</td>
                        <td style={{ textAlign: "right" }}>
                          <Link className="btn small ghost" href={`/admin?dept=${d.id}`} aria-label={`Manage ${d.name}`}>Manage</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card col-1" aria-labelledby="models-title" style={{ gap: 16 }}>
              <div>
                <h2 id="models-title">{departmentName(selected)}: approved models</h2>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Enforced on every request. In AWS, also by an IAM policy per department on Bedrock.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MODELS.map((m) => {
                  const on = approvals[selected].includes(m.id);
                  return (
                    <form key={m.id} action={toggleModel}>
                      <input type="hidden" name="dept" value={selected} />
                      <input type="hidden" name="model" value={m.id} />
                      <button type="submit" className="model-toggle" aria-pressed={on}>
                        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <strong>{m.label}</strong>
                          <span className="small muted">{m.vendor}</span>
                        </span>
                        <span className="state">{on ? "Approved" : "Blocked"}</span>
                      </button>
                    </form>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 13 }}>Guardrails</strong>
                <span className="muted" style={{ fontSize: 13 }}>Card numbers and Irish PPS numbers are blocked before a prompt leaves the app.</span>
              </div>
            </section>
          </div>
        ) : (
          <section className="card flush" aria-labelledby="audit-title">
            <div className="card-head">
              <h2 id="audit-title" style={{ fontSize: 18 }}>Audit log</h2>
              <span className="muted" style={{ fontSize: 13 }}>Who used which model, when. Prompt text is never stored here.</span>
            </div>
            <AuditTable />
          </section>
        )}
      </main>
    </div>
  );
}

function AuditTable() {
  const rows = listAudit();
  if (!rows.length) {
    return <p className="muted" style={{ padding: "8px 24px 16px", margin: 0 }}>No events yet. Sign in as a department user and use the assistant.</p>;
  }
  return (
    <div className="table-wrap">
      <table style={{ minWidth: 640 }}>
        <thead>
          <tr><th scope="col">Time</th><th scope="col">User</th><th scope="col">Department</th><th scope="col">Event</th><th scope="col">Model</th></tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <tr key={`${a.at}-${i}`}>
              <td className="mono muted">{time(a.at)}</td>
              <td>{a.user}</td>
              <td>{isDepartmentId(a.dept) ? departmentName(a.dept) : a.dept}</td>
              <td><span className={a.kind === "ok" ? undefined : `tag ${a.kind === "denied" ? "bad" : "warn"}`}>{a.event}</span></td>
              <td className="muted">{a.model ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
