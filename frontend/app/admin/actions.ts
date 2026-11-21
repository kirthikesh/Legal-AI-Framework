"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth.ts";
import { isDepartmentId, isModelId, modelLabel } from "@/lib/data.ts";
import { audit, toggleApproval } from "@/lib/store.ts";

export async function toggleModel(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const dept = String(formData.get("dept") ?? "");
  const model = String(formData.get("model") ?? "");
  if (!isDepartmentId(dept) || !isModelId(model)) return;
  const nowOn = toggleApproval(dept, model);
  audit({ user: admin.name, dept, event: `${nowOn ? "Approved" : "Blocked"} ${modelLabel(model)}`, model: modelLabel(model), kind: "ok" });
  revalidatePath("/admin");
}
