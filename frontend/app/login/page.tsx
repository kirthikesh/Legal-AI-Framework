import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckIcon, Logo } from "@/components/Icons.tsx";
import { initials } from "@/components/WorkspaceSidebar.tsx";
import { getSession } from "@/lib/auth.ts";
import { homePath } from "@/lib/access.ts";
import { DEMO_USERS, ROLE_LABEL, departmentName } from "@/lib/data.ts";
import { signInAsDemoUser } from "./actions.ts";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const user = await getSession();
  if (user) redirect(homePath(user));
  const { next = "", error } = await searchParams;
  const demo = (process.env.AUTH_MODE ?? "demo") === "demo";

  return (
    <div className="split">
      <section className="hero">
        <div className="brand" style={{ fontSize: 20, padding: 0 }}>
          <Logo size={36} color="#5EEAD4" />
          <span>Legal AI Framework</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h1>One secure place for every team to use AI.</h1>
          <p style={{ margin: 0 }}>Each department works in its own isolated workspace. Your documents and AI history never reach another team.</p>
          <ul>
            <li><CheckIcon size={18} /> Sign in once with your company account</li>
            <li><CheckIcon size={18} /> Access set by your role and department</li>
            <li><CheckIcon size={18} /> AI through AWS Bedrock: prompts are not used for training</li>
          </ul>
        </div>
        <p className="small" style={{ margin: 0, color: "#A7C9C5" }}>Internal use only</p>
      </section>

      <section className="center">
        <div className="panel">
          <div>
            <h2>Sign in</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>Use your work account. Your department is picked up automatically.</p>
          </div>

          {error && <p className="tag bad" role="alert">Sign-in failed. Try again.</p>}

          {demo ? (
            <>
              <span className="badge warn" style={{ alignSelf: "flex-start" }}>Demo mode: choose a sample user</span>
              <div className="demo-users">
                {DEMO_USERS.map((u) => (
                  <form key={u.id} action={signInAsDemoUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="next" value={next} />
                    <button type="submit" className="demo-user">
                      <span className="avatar">{initials(u.name)}</span>
                      <span>
                        <strong>{u.name}</strong>
                        <span className="small muted">
                          {ROLE_LABEL[u.role]}{u.dept ? ` · ${departmentName(u.dept)}` : " · manages all departments"}
                        </span>
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            </>
          ) : (
            <p className="tag warn" role="status" style={{ margin: 0 }}>
              Company SSO is not connected yet. Set AUTH_MODE=demo, or add the Cognito sign-in route (see README).
            </p>
          )}

          <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>
            In production, sign-in goes through the company identity provider via Amazon Cognito.
          </p>
        </div>
      </section>
    </div>
  );
}
