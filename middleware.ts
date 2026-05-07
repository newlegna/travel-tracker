import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, isValidSessionCookie } from "@/app/lib/auth";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(authCookieName)?.value;
  if (await isValidSessionCookie(cookieValue)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
