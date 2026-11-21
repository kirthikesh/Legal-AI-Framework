import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session.ts";

// POST only, so a link or image on another site can't sign people out
export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
