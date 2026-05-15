import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === "/login";
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isTraefikProvider = nextUrl.pathname.startsWith("/api/traefik");

  if (isApiAuth || isTraefikProvider) return NextResponse.next();
  if (isLoginPage) {
    return isLoggedIn
      ? NextResponse.redirect(new URL("/", nextUrl))
      : NextResponse.next();
  }
  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    if (nextUrl.pathname !== "/")
      url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
