import Link from "next/link";
import type { SessionUser } from "@/lib/access.ts";
import { ROLE_LABEL, departmentName } from "@/lib/data.ts";
import { ChatIcon, Logo, UsersIcon } from "./Icons.tsx";

export function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function WorkspaceSidebar({ user, active }: { user: SessionUser; active: "assistant" | "users" }) {
  const dept = user.dept!;
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo />
        <span>Legal AI<br />Framework</span>
      </div>

      <div className="tenant-box">
        <span className="small muted">Department</span>
        <strong>{departmentName(dept)}</strong>
        <span className="small muted">Tenant ID: {dept}</span>
      </div>

      <nav className="nav" aria-label="Workspace">
        <Link href={`/w/${dept}`} aria-current={active === "assistant" ? "page" : undefined}>
          <ChatIcon /> AI assistant
        </Link>
        {user.role === "dept_admin" && (
          <Link href={`/w/${dept}/users`} aria-current={active === "users" ? "page" : undefined}>
            <UsersIcon /> Users and roles
          </Link>
        )}
      </nav>

      <div className="side-foot">
        <div className="me">
          <span className="avatar">{initials(user.name)}</span>
          <span>
            <span>{user.name}</span>
            <span className="small muted">{ROLE_LABEL[user.role]} · {departmentName(dept)}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
