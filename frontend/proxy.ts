// First line of defence: runs before every page and API route.
// Pages and API routes check again (lib/auth.ts), so a gap here never exposes data.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session.ts";
import { canUseDepartment, isPlatformAdmin } from "./lib/access.ts";

const PUBLIC_PATHS = ["/login", "/api/health"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // /w/<dept>/... : only members of that department
  const ws = pathname.match(/^\/w\/([^/]+)/);
  if (ws) {
    if (isPlatformAdmin(user)) return NextResponse.redirect(new URL("/admin", request.url));
    if (!canUseDepartment(user, ws[1])) {
      const url = new URL("/denied", request.url);
      url.searchParams.set("tenant", ws[1]);
      return NextResponse.redirect(url);
    }
  }

  // /admin : platform admins only
  if (pathname.startsWith("/admin") && !isPlatformAdmin(user)) {
    return NextResponse.redirect(new URL("/denied?reason=admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
