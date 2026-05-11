"use client";
// frontend/app/(admin)/dashboard/page.tsx
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#DC2626"/></svg>;
  if (t === "users")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5h2"/><circle cx="12" cy="10" r="3"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "audit")    return <svg {...s} {...p}><path d="M2 2h12v12H2z"/><path d="M5 6h6M5 9h4"/><circle cx="11" cy="11" r="3"/><path d="M13 13l1.5 1.5"/></svg>;
  if (t === "companies")return <svg {...s} {...p}><rect x="2" y="6" width="12" height="8" rx="1"/><path d="M5 6V4a3 3 0 016 0v2"/><path d="M8 10v2"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  return null;
}

function SbLink({ href, icon, label, active, badge, onClick }: {
  href: string; icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="sb-lnk" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 14px", fontSize: 12, textDecoration: "none",
      color: active ? "#DC2626" : "#64748B",
      background: active ? "#FEF2F2" : "transparent",
      fontWeight: active ? 600 : 400,
      margin: "1px 6px", borderRadius: 8,
    }}>
      <Icon t={icon} />
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#DC2626", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

const MOCK_STATS = [
  { label: "Total Users",     value: "3,842", delta: "+124 this week",  up: true  },
  { label: "Active Companies",value: "286",   delta: "+12 this month",  up: true  },
  { label: "Jobs Posted",     value: "1,209", delta: "+48 this week",   up: true  },
  { label: "Flagged Items",   value: "7",     delta: "Needs review",    up: false },
];

const MOCK_RECENT_USERS = [
  { name: "Priya Sharma",   email: "priya@acme.io",      role: "jobseeker",  joined: "2m ago"  },
  { name: "Rahul Mehta",    email: "rahul@techcorp.com", role: "recruiter",  joined: "14m ago" },
  { name: "Sneha Kapoor",   email: "sneha@gmail.com",    role: "jobseeker",  joined: "1h ago"  },
  { name: "Arjun Nair",     email: "arjun@hireme.in",    role: "recruiter",  joined: "3h ago"  },
  { name: "Divya Reddy",    email: "divya@startup.io",   role: "jobseeker",  joined: "5h ago"  },
];

const MOCK_ACTIVITY = [
  { type: "user_signup",   msg: "New jobseeker registered: priya@acme.io",        time: "2m ago"  },
  { type: "job_posted",    msg: "New job posted: Senior Engineer @ TechCorp",      time: "18m ago" },
  { type: "flag",          msg: "Job flagged for review: 'Quick Money from Home'", time: "45m ago" },
  { type: "company",       msg: "New company registered: Nexus Solutions Pvt Ltd", time: "1h ago"  },
  { type: "user_signup",   msg: "New recruiter registered: rahul@techcorp.com",    time: "2h ago"  },
  { type: "job_posted",    msg: "New job posted: Product Manager @ StartupXYZ",    time: "3h ago"  },
];

export default function AdminDashboardPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sb-lnk { transition: background 0.1s, color 0.1s; }
        .sb-lnk:hover { background: #F8FAFC !important; color: #0F172A !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 2px; }

        @media (max-width: 768px) {
          .adm-sidebar {
            position: fixed !important;
            top: 0; left: 0;
            height: 100% !important;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-mobile-topbar { display: flex !important; }
          .adm-desktop-topbar { display: none !important; }
          .adm-backdrop { display: block !important; }
          .adm-content { padding: 16px !important; }
          .adm-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="adm-backdrop"
        onClick={() => setSidebarOpen(false)}
        style={{ display: "none", position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,0.3)" }}
      />

      {/* Sidebar */}
      <aside
        className={`adm-sidebar${sidebarOpen ? " open" : ""}`}
        style={{
          width: 210, background: "#fff", borderRight: "0.5px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0,
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        }}
      >
        <div style={{ padding: "18px 16px 12px", borderBottom: "0.5px solid #F1F5F9" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#DC2626" }}>Flow</span>
          </span>
          <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Admin
          </span>
        </div>

        <div style={{ padding: "14px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
          <SbLink href="/admin/dashboard"  icon="grid"      label="Dashboard"  active onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/users"      icon="users"     label="Users"      onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/companies"  icon="companies" label="Companies"  onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/jobs"       icon="jobs"      label="Jobs"       onClick={() => setSidebarOpen(false)} />
        </div>
        <div style={{ padding: "10px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>System</div>
          <SbLink href="/admin/audit"    icon="audit"    label="Audit Log"  badge={7} onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/settings" icon="settings" label="Settings"   onClick={() => setSidebarOpen(false)} />
        </div>

        <div style={{ marginTop: "auto", padding: "12px 6px", borderTop: "0.5px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name ?? "Admin"}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? ""}</p>
            </div>
            <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 10, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Out</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile Topbar */}
        <div
          className="adm-mobile-topbar"
          style={{ display: "none", background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 16px", height: 52, alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", cursor: "pointer" }}
          >
            <Icon t="menu" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Admin Dashboard</span>
          <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Admin
          </span>
        </div>

        {/* Desktop Topbar */}
        <div
          className="adm-desktop-topbar"
          style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Dashboard</p>
          <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Admin Panel
          </span>
        </div>

        {/* Content */}
        <div className="adm-content" style={{ padding: "20px 24px", flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Overview</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Platform-wide stats and activity</p>
          </div>

          {/* Stats grid */}
          <div className="adm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {MOCK_STATS.map((stat) => (
              <div key={stat.label} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 11, color: stat.up ? "#16A34A" : "#DC2626", marginTop: 4 }}>
                  {stat.delta}
                </p>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="adm-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Recent signups */}
            <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Recent Signups</h2>
                <Link href="/admin/users" style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MOCK_RECENT_USERS.map((u) => (
                  <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.role === "recruiter" ? "#FEF2F2" : "#EFF6FF", color: u.role === "recruiter" ? "#DC2626" : "#2563EB", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {u.name[0]}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: u.role === "recruiter" ? "#FEF2F2" : "#EFF6FF", color: u.role === "recruiter" ? "#DC2626" : "#2563EB" }}>
                        {u.role}
                      </span>
                      <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2 }}>{u.joined}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Activity Feed</h2>
                <Link href="/admin/audit" style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, textDecoration: "none" }}>Audit log →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: a.type === "flag" ? "#DC2626" : a.type === "company" ? "#16A34A" : "#2563EB" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>{a.msg}</p>
                      <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2 }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}