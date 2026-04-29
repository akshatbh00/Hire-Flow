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
    const dest = role === "company_admin" ? "/company/dashboard" : role === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Job seekers trying to access recruiter routes
  // Company admins trying to access recruiter dashboard → redirect to company dashboard
  if (token && role === "company_admin" && pathname.startsWith("/recruiter-dashboard")) {
    return NextResponse.redirect(new URL("/company/dashboard", request.url));
  }

  // Recruiters trying to access job seeker-only routes
  if (token && role === "recruiter" && (
    pathname.startsWith("/applications") ||
    pathname.startsWith("/resume")
  )) {
    return NextResponse.redirect(new URL("/recruiter-dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};