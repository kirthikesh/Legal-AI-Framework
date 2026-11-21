import { NextResponse } from "next/server";
import { bedrockEnabled } from "@/lib/bedrock.ts";

export const dynamic = "force-dynamic";

// Used by Docker HEALTHCHECK and the load balancer
export function GET() {
  return NextResponse.json({ status: "ok", bedrock: bedrockEnabled() ? "enabled" : "demo" });
}
