import type { Metadata } from "next";
import { SignOut } from "@/components/SignOut.tsx";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar.tsx";
import { requireDeptAdmin } from "@/lib/auth.ts";
import { ROLE_LABEL, departmentName, type DepartmentId } from "@/lib/data.ts";
import { listUsers } from "@/lib/store.ts";
import { invite, remove } from "./actions.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users and roles" };

const ERRORS: Record<string, string> = {
  email: "Enter a valid work email.",
  self: "You can't remove yourself.",
};

export default async function UsersPage({ params, searchParams }: { params: Promise<{ dept: string }>; searchParams: Promise<{ error?: string }> }) {
  const { dept } = await params;
  const { error } = await searchParams;
  const admin = await requireDeptAdmin(dept);
  const name = departmentName(dept);
  const users = listUsers(dept as DepartmentId);

  return (
    <div className="shell">
      <WorkspaceSidebar user={admin} active="users" />
      <main className="main">
        <header className="page-head">
          <div>
            <h1>{name} users</h1>
            <p>You can add and remove people in {name} only. Other departments are managed by their own admins.</p>
          </div>
          <div className="head-actions">
            <span className="badge warn">Sample data</span>
            <SignOut />
          </div>
        </header>

        <section className="card" aria-labelledby="invite-title">
          <h2 id="invite-title">Invite to {name}</h2>
          {error && ERRORS[error] && <p className="tag bad" role="alert" style={{ margin: 0, alignSelf: "flex-start" }}>{ERRORS[error]}</p>}
          <form action={invite.bind(null, dept)} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "2 1 260px" }}>
              <label htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="name@company.com" />
            </div>
            <div className="field" style={{ flex: "1 1 160px" }}>
              <label htmlFor="role">Role</label>
              <select id="role" name="role" className="input" defaultValue="member">
                <option value="member">Member</option>
                <option value="dept_admin">Department admin</option>
              </select>
            </div>
            <button type="submit" className="btn">Send invite</button>
          </form>
          <p className="small muted" style={{ margin: 0 }}>People sign in with the company IdP. The invite adds them to the {name} tenant with this role.</p>
        </section>

        <section className="card flush" aria-labelledby="list-title">
          <div className="card-head"><h2 id="list-title">{users.length} people in {name}</h2></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="muted">{u.email}</td>
                    <td>{ROLE_LABEL[u.role]}</td>
                    <td><span className={`tag ${u.status === "Active" ? "ok" : "warn"}`}>{u.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {u.id !== admin.sub && (
                        <form action={remove.bind(null, dept)}>
                          <input type="hidden" name="id" value={u.id} />
                          <button type="submit" className="btn small danger" aria-label={`Remove ${u.email}`}>Remove</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
