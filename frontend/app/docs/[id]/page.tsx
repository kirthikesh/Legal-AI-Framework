import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canUseDepartment } from "@/lib/access.ts";
import { requireSession } from "@/lib/auth.ts";
import { departmentName, findDocument } from "@/lib/data.ts";
import { audit } from "@/lib/store.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  const doc = findDocument(id);
  if (!doc) notFound();

  // Tenant check on every document request
  if (!canUseDepartment(user, doc.dept)) {
    audit({ user: user.name, dept: user.dept ?? "platform", event: `Tried to open a ${departmentName(doc.dept)} document: denied`, kind: "denied" });
    redirect(`/denied?tenant=${doc.dept}`);
  }

  return (
    <div className="full-center">
      <div className="panel" style={{ maxWidth: 640 }}>
        <span className="badge ok" style={{ alignSelf: "flex-start" }}>{departmentName(doc.dept)} · tenant {doc.dept}</span>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26 }}>{doc.title}</h1>
        <p className="muted" style={{ margin: 0 }}>Updated {doc.updated}. In the full build the document preview and its AI summary appear here, served from the {departmentName(doc.dept)} storage bucket only.</p>
        <Link className="btn" href={`/w/${doc.dept}`} style={{ alignSelf: "flex-start" }}>Back to workspace</Link>
      </div>
    </div>
  );
}
