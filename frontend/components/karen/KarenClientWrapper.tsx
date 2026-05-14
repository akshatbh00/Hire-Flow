"use client";

import { usePathname } from "next/navigation";
import KarenWidget from "./karen-widget";

const AUTH_ROUTES = ["/login", "/register", "/onboarding"];

export default function KarenClientWrapper() {
  const pathname = usePathname();
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuth) return null;
  return <KarenWidget />;
}