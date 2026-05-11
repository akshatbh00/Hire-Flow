// "use client";
// //frontend/app/(admin)/audit/page.tsx
// import { Suspense } from "react";

// function AuditContent() {
//   return <div><h1>Audit Page</h1></div>;
// }

// export default function AuditPage() {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <AuditContent />
//     </Suspense>
//   );
// }

"use client";
// frontend/app/(admin)/audit/page.tsx
import { Suspense, useEffect, useState } from "react";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")      return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#DC2626"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#DC2626"/></svg>;
  if (t === "users")     return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5h2"/><circle cx="12" cy="10" r="3"/></svg>;
  if (t === "jobs")      return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "audit")     return <svg {...s} {...p}><path d="M2 2h12v12H2z"/><path d="M5 6h6M5 9h4"/><circle cx="11" cy="11" r="3"/><path d="M13 13l1.5 1.5"/></svg>;
  if (t === "companies") return <svg {...s} {...p}><rect x="2" y="6" width="12" height="8" rx="1"/><path d="M5 6V4a3 3 0 016 0v2"/><path d="M8 10v2"/></svg>;
  if (t === "settings")  return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "menu")      return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "filter")    return <svg {...s} {...p}><path d="M1 3h14M4 8h8M7 13h2"/></svg>;
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

type LogLevel = "info" | "warning" | "error" | "success";
interface AuditEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  actor: string;
  action: string;
  target: string;
  ip: string;
}

const MOCK_LOGS: AuditEntry[] = [
  { id: "1",  timestamp: "2026-05-11 14:32:01", level: "warning", actor: "admin@hireflow.io",    action: "FLAGGED_JOB",      target: "Job #4821 — Quick Money From Home",     ip: "103.21.4.5"    },
  { id: "2",  timestamp: "2026-05-11 14:18:44", level: "info",    actor: "rahul@techcorp.com",   action: "JOB_CREATED",      target: "Job #4820 — Senior Engineer @ TechCorp", ip: "49.205.12.8"   },
  { id: "3",  timestamp: "2026-05-11 13:55:22", level: "success", actor: "priya@acme.io",        action: "USER_REGISTERED",  target: "User #3841 — priya@acme.io",             ip: "117.96.4.21"   },
  { id: "4",  timestamp: "2026-05-11 13:40:10", level: "error",   actor: "unknown",              action: "LOGIN_FAILED",     target: "User admin@hireflow.io",                 ip: "45.33.12.100"  },
  { id: "5",  timestamp: "2026-05-11 13:22:05", level: "info",    actor: "admin@hireflow.io",    action: "COMPANY_APPROVED", target: "Company #286 — Nexus Solutions Pvt Ltd", ip: "103.21.4.5"    },
  { id: "6",  timestamp: "2026-05-11 12:58:33", level: "warning", actor: "system",               action: "RATE_LIMIT_HIT",   target: "IP 45.33.12.100 — /api/v1/auth/login",  ip: "45.33.12.100"  },
  { id: "7",  timestamp: "2026-05-11 12:34:17", level: "success", actor: "sneha@gmail.com",      action: "RESUME_UPLOADED",  target: "User #3839 — sneha@gmail.com",           ip: "59.178.22.14"  },
  { id: "8",  timestamp: "2026-05-11 12:10:02", level: "info",    actor: "arjun@hireme.in",      action: "JOB_CLOSED",       target: "Job #4801 — Data Analyst @ HireMe",      ip: "106.51.8.9"    },
  { id: "9",  timestamp: "2026-05-11 11:45:50", level: "error",   actor: "system",               action: "EMAIL_FAILED",     target: "Notification to divya@startup.io",       ip: "—"             },
  { id: "10", timestamp: "2026-05-11 11:20:38", level: "info",    actor: "admin@hireflow.io",    action: "USER_SUSPENDED",   target: "User #3820 — spam@badactor.com",          ip: "103.21.4.5"    },
];

const LEVEL_STYLES: Record<LogLevel, { bg: string; color: string; label: string }> = {
  info:    { bg: "#EFF6FF", color: "#2563EB", label: "INFO"    },
  warning: { bg: "#FFFBEB", color: "#D97706", label: "WARN"    },
  error:   { bg: "#FEF2F2", color: "#DC2626", label: "ERROR"   },
  success: { bg: "#F0FDF4", color: "#16A34A", label: "SUCCESS" },
};

function AuditContent() {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = MOCK_LOGS.filter((log) => {
    const matchLevel  = filter === "all" || log.level === filter;
    const matchSearch = search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sb-lnk { transition: background 0.1s, color 0.1s; }
        .sb-lnk:hover { background: #F8FAFC !important; color: #0F172A !important; }
        .log-row:hover { background: #F8FAFC !important; }
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
          .audit-filter-row { flex-direction: column !important; align-items: flex-start !important; }
          .audit-filter-row input { width: 100% !important; }
          .audit-table-header { display: none !important; }
          .audit-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; padding: 12px 14px !important; }
          .audit-row-meta { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .audit-ip { display: none !important; }
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
          <SbLink href="/admin/dashboard"  icon="grid"      label="Dashboard"  onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/users"      icon="users"     label="Users"      onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/companies"  icon="companies" label="Companies"  onClick={() => setSidebarOpen(false)} />
          <SbLink href="/admin/jobs"       icon="jobs"      label="Jobs"       onClick={() => setSidebarOpen(false)} />
        </div>
        <div style={{ padding: "10px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>System</div>
          <SbLink href="/admin/audit"    icon="audit"    label="Audit Log"  active badge={7} onClick={() => setSidebarOpen(false)} />
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
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Audit Log</span>
          <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Admin
          </span>
        </div>

        {/* Desktop Topbar */}
        <div
          className="adm-desktop-topbar"
          style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Audit Log</p>
          <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Admin Panel
          </span>
        </div>

        {/* Content */}
        <div className="adm-content" style={{ padding: "20px 24px", flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Audit Log</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>All platform actions and system events</p>
          </div>

          {/* Filter row */}
          <div className="audit-filter-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {/* Level chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["all", "info", "warning", "error", "success"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", border: "1px solid",
                    borderColor: filter === lvl ? (lvl === "all" ? "#DC2626" : LEVEL_STYLES[lvl]?.color ?? "#DC2626") : "#E2E8F0",
                    background: filter === lvl ? (lvl === "all" ? "#FEF2F2" : LEVEL_STYLES[lvl]?.bg ?? "#FEF2F2") : "#fff",
                    color: filter === lvl ? (lvl === "all" ? "#DC2626" : LEVEL_STYLES[lvl]?.color ?? "#DC2626") : "#64748B",
                  }}
                >
                  {lvl === "all" ? "All" : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, actors..."
              style={{ padding: "7px 13px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 12, fontFamily: "inherit", outline: "none", color: "#0F172A", background: "#fff", width: 220 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#DC2626"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
            />
          </div>

          {/* Log table */}
          <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>

            {/* Table header — hidden on mobile */}
            <div className="audit-table-header" style={{ display: "grid", gridTemplateColumns: "140px 70px 1fr 160px 100px", gap: 12, padding: "10px 20px", borderBottom: "0.5px solid #F1F5F9", background: "#F8FAFC" }}>
              {["Timestamp", "Level", "Action / Target", "Actor", "IP"].map((h) => (
                <p key={h} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>No log entries match your filters</p>
              </div>
            ) : (
              filtered.map((log, i) => {
                const ls = LEVEL_STYLES[log.level];
                return (
                  <div
                    key={log.id}
                    className="log-row audit-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 70px 1fr 160px 100px",
                      gap: 12,
                      padding: "12px 20px",
                      borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none",
                      alignItems: "center",
                      transition: "background 0.1s",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>{log.timestamp}</p>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6, background: ls.bg, color: ls.color, width: "fit-content" }}>
                      {ls.label}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{log.action.replace(/_/g, " ")}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.target}</p>
                    </div>
                    <p style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.actor}</p>
                    <p className="audit-ip" style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{log.ip}</p>
                  </div>
                );
              })
            )}
          </div>

          <p style={{ fontSize: 11, color: "#CBD5E1", marginTop: 12 }}>
            Showing {filtered.length} of {MOCK_LOGS.length} entries · Connect your backend to load live logs
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>Loading audit log...</p>
      </div>
    }>
      <AuditContent />
    </Suspense>
  );
}