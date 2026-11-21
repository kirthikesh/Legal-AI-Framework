import { NextResponse } from "next/server";
import { canUseDepartment } from "@/lib/access.ts";
import { getSession } from "@/lib/auth.ts";
import { askModel } from "@/lib/bedrock.ts";
import { isModelId, modelLabel } from "@/lib/data.ts";
import { checkPrompt } from "@/lib/guardrails.ts";
import { audit, getApprovals } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  // The department always comes from the signed session, never from the request body
  if (!user.dept || !canUseDepartment(user, user.dept)) {
    return NextResponse.json({ error: "No department workspace for this account" }, { status: 403 });
  }
  const dept = user.dept;

  let body: { model?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const model = typeof body.model === "string" ? body.model : "";
  const message = typeof body.message === "string" ? body.message : "";

  if (!isModelId(model) || !getApprovals()[dept].includes(model)) {
    audit({ user: user.name, dept, event: `Used a model not approved for ${dept}: denied`, model: modelLabel(model), kind: "denied" });
    return NextResponse.json({ error: "That model is not approved for your department" }, { status: 403 });
  }

  const guard = checkPrompt(message);
  if (!guard.allowed) {
    audit({ user: user.name, dept, event: `Prompt blocked by guardrail: ${guard.reason}`, model: modelLabel(model), kind: "blocked" });
    return NextResponse.json({ error: `Not sent: ${guard.reason}. Remove it and try again.` }, { status: 422 });
  }

  try {
    const reply = await askModel(model, dept, message);
    // Prompt text is deliberately not stored in the audit log
    audit({ user: user.name, dept, event: "Asked assistant", model: modelLabel(model), kind: "ok" });
    return NextResponse.json({ reply, model, modelLabel: modelLabel(model) });
  } catch (err) {
    console.error("bedrock error", err);
    return NextResponse.json({ error: "The AI service is unavailable right now" }, { status: 502 });
  }
}
