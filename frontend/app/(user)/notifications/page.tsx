"use client";
// frontend/app/(user)/notifications/page.tsx
import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    usersApi.dashboard()
      .then((d) => {
        setNotifications(d.notifications ?? []);
        usersApi.markNotifsRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TYPE_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
    stage_change:  { bg: "#eff6ff", color: "#2563eb", icon: "📋" },
    match:         { bg: "#f0fdf4", color: "#16a34a", icon: "✨" },
    offer:         { bg: "#f0fdf4", color: "#16a34a", icon: "🎉" },
    rejected:      { bg: "#fef2f2", color: "#dc2626", icon: "❌" },
    referral:      { bg: "#fffbeb", color: "#b45309", icon: "🤝" },
    default:       { bg: "#f8fafc", color: "#64748b", icon: "🔔" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @media (max-width: 768px) {
          .desktop-nav-bar    { display: none !important; }
          .mobile-topbar      { display: flex !important; }
          .mobile-bottom-nav  { display: flex !important; }
          .notif-main         { padding: 16px 14px 88px !important; }
          .notif-header h1    { font-size: 20px !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar      { display: none !important; }
          .mobile-bottom-nav  { display: none !important; }
        }
      `}</style>

      {/* Mobile Top Bar */}
      <MobileTopBar />

      {/* Desktop Nav */}
      <nav className="desktop-nav-bar" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[{ href: "/dashboard", label: "Dashboard" }, { href: "/jobs", label: "Jobs" }, { href: "/notifications", label: "Notifications", active: true }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <main className="notif-main" style={{ maxWidth: 700, margin: "0 auto", padding: "32px 40px" }}>
        <div className="notif-header" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Notifications</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{notifications.length} total</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 72 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No notifications yet</p>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>Apply to jobs to start getting updates</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map((n: any, i: number) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
              return (
                <div key={n.id ?? i} style={{ background: "#fff", border: `1px solid ${n.is_read ? "#e2e8f0" : "#bfdbfe"}`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginBottom: 4, fontWeight: n.is_read ? 400 : 600 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#94a3b8" }}>
                      {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 6, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav active="home" />
    </div>
  );
}