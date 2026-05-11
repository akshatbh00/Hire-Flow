// frontend/components/mobile/MobileNav.tsx
"use client";
import Link from "next/link";

// ── Mobile Top Bar ───────────────────────────────────────────────
// Hidden by default. Shown via @media (max-width: 768px) in each page's <style>
export default function MobileTopBar({ unread = 0 }: { unread?: number }) {
  return (
    <div
      className="mobile-topbar"
      style={{
        display: "none",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 54,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
          Hire<span style={{ color: "#2563eb" }}>Flow</span>
        </span>
      </Link>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Link
          href="/notifications"
          style={{ position: "relative", textDecoration: "none", fontSize: 18, lineHeight: 1 }}
        >
          🔔
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -5,
              minWidth: 16, height: 16, borderRadius: 99,
              background: "#2563eb", color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px",
            }}>
              {unread}
            </span>
          )}
        </Link>
        <Link
          href="/profile"
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#2563eb", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}
        >
          A
        </Link>
      </div>
    </div>
  );
}

// ── Mobile Bottom Nav ────────────────────────────────────────────
// Hidden by default. Shown via @media (max-width: 768px) in each page's <style>

type ActiveTab = "home" | "jobs" | "applications" | "profile";

const TABS: {
  key: ActiveTab;
  href: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}[] = [
  {
    key: "home",
    href: "/dashboard",
    label: "Feed",
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="8" rx="2"
          fill={active ? "#2563eb" : "none"}
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
        <rect x="13" y="3" width="8" height="8" rx="2"
          fill="none"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
        <rect x="3" y="13" width="8" height="8" rx="2"
          fill="none"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
        <rect x="13" y="13" width="8" height="8" rx="2"
          fill="none"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: "jobs",
    href: "/jobs",
    label: "Apply",
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="14" rx="2"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
        <path d="M8 7V5a4 4 0 018 0v2"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 12v4M10 14h4"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "applications",
    href: "/applications",
    label: "Matches",
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3l2.09 5.26L20 9.27l-4 3.9.94 5.48L12 16l-4.94 2.65.94-5.48-4-3.9 5.91-.01L12 3z"
          fill={active ? "#2563eb" : "none"}
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8"
          strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "profile",
    href: "/resume",
    label: "Profile",
    icon: (active) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"
          fill={active ? "#2563eb" : "none"}
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" />
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
          stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function MobileBottomNav({
  active,
  unread = 0,
}: {
  active: ActiveTab;
  unread?: number;
}) {
  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        display: "none",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              textDecoration: "none",
              padding: "6px 16px",
              position: "relative",
            }}
          >
            {tab.icon(isActive)}
            {/* Notification dot on Matches tab */}
            {tab.key === "applications" && unread > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 10,
                width: 7, height: 7, borderRadius: "50%",
                background: "#2563eb",
              }} />
            )}
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#2563eb" : "#94a3b8",
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}