// frontend/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hf_token")?.value;
  const role  = request.cookies.get("hf_role")?.value;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Not logged in → redirect to login
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in → trying to access login/register → redirect to correct dashboard
  if (token && (pathname === "/login" || pathname === "/register")) {
    let dest = "/dashboard";
    if (role === "recruiter")              dest = "/recruiter-dashboard";
    else if (role === "admin")             dest = "/admin";
    else if (role === "company_admin")     dest = "/admin";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Block jobseekers from recruiter routes
  if (token && role === "jobseeker" && pathname.startsWith("/recruiter-dashboard")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Block recruiters/admins from jobseeker-only routes
  if (token && (role === "recruiter" || role === "admin") && (
    pathname.startsWith("/applications") ||
    pathname.startsWith("/resume")
  )) {
    const dest = role === "admin" ? "/admin" : "/recruiter-dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Block non-admins from /admin routes
  if (token && pathname.startsWith("/admin") && role !== "admin") {
    const dest = role === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};