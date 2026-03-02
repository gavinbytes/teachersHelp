import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register", "/api/auth", "/api/register"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session token cookie (set by NextAuth)
  const token =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (token) {
    return NextResponse.next();
  }

  // Check for bot API key on /api/* routes
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const botApiKey = process.env.BOT_API_KEY;

    if (botApiKey && authHeader === `Bearer ${botApiKey}`) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect to login for page routes
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
