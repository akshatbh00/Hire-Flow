// "use client";
// //frontend/app/admin/page.tsx

// import { useEffect, useState } from "react";
// import { companyApi } from "@/lib/api";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useUserStore } from "@/store/user.store";
// export default function AdminDashboardPage() {
//   const router = useRouter();
//   const [company,    setCompany]    = useState<any>(null);
//   const [stats,      setStats]      = useState<any>(null);
//   const [recruiters, setRecruiters] = useState<any[]>([]);
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [inviting,   setInviting]   = useState(false);
//   const [inviteMsg,  setInviteMsg]  = useState("");
//   const [loading,    setLoading]    = useState(true);

//   useEffect(() => {
//     Promise.all([
//       companyApi.me().catch(() => null),
//       companyApi.stats().catch(() => null),
//     ]).then(([c, s]) => {
//       setCompany(c);
//       setStats(s);
//     }).finally(() => setLoading(false));
//   }, []);

//   async function handleInvite() {
//     if (!inviteEmail.trim() || !company) return;
//     setInviting(true); setInviteMsg("");
//     try {
//       await companyApi.invite(inviteEmail.trim(), company.id);
//       setInviteMsg("✓ Recruiter invited successfully");
//       setInviteEmail("");
//     } catch (e: any) {
//       setInviteMsg("✗ " + (e.message ?? "Failed to invite"));
//     } finally {
//       setInviting(false);
//     }
//   }

//   if (loading) return (
//     <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
//       <p style={{ color: "#94a3b8" }}>Loading...</p>
//     </div>
//   );

//   const breakdown = stats?.pipeline_breakdown ?? {};

//   return (
//     <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
//       <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
//         <Link href="/recruiter-dashboard" style={{ textDecoration: "none" }}>
//           <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
//         </Link>
//         <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
//           <Link href="/admin"       style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Overview</Link>
//           <Link href="/admin/audit" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Audit Trail</Link>
//           <Link href="/recruiter-dashboard" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
//           <button onClick={() => { useUserStore.getState().logout(); router.push("/login"); }}
//             style={{ background: "none", border: "none", fontSize: 14, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
//             Sign out
//           </button>
//           <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>ADMIN</span>
//         </div>
//       </nav>

//       <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

//         {/* Header */}
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
//           <div>
//             <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Company Admin</h1>
//             <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{company?.name ?? "Your Company"} · Management Portal</p>
//           </div>
//           <Link href="/jobs/create"
//             style={{ background: "#2563eb", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
//             + Post New Job
//           </Link>
//         </div>

//         {/* Stats */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
//           {[
//             { label: "Active Jobs",      value: stats?.active_jobs ?? 0,      color: "#2563eb", icon: "📋" },
//             { label: "Total Applicants", value: stats?.total_applicants ?? 0, color: "#7c3aed", icon: "👥" },
//             { label: "In Pipeline",      value: Object.entries(breakdown).filter(([s]) => !["applied","ats_rejected","withdrawn"].includes(s)).reduce((a,[,v]) => a + (v as number), 0), color: "#0891b2", icon: "📊" },
//             { label: "Selected",         value: breakdown["selected"] ?? 0,   color: "#16a34a", icon: "🎉" },
//           ].map(({ label, value, color, icon }) => (
//             <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//                 <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
//                 <span style={{ fontSize: 20 }}>{icon}</span>
//               </div>
//               <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
//             </div>
//           ))}
//         </div>

//         {/* Quick Actions */}
//         <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
//           <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Quick Actions</h2>
//           <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//             {[
//               { label: "📋 Post a Job",          href: "/jobs/create",          color: "#2563eb" },
//               { label: "👥 View Candidates",      href: "/candidates",           color: "#7c3aed" },
//               { label: "📊 Pipeline View",        href: "/recruiter-dashboard",  color: "#0891b2" },
//               { label: "💰 Salary Benchmarks",    href: "/salary",               color: "#16a34a" },
//               { label: "🔐 Audit Trail",          href: "/admin/audit",          color: "#b45309" },
//               { label: "🏢 Company Profile",      href: "/company/profile",      color: "#dc2626" },
//             ].map(({ label, href, color }) => (
//               <Link key={label} href={href}
//                 style={{ padding: "9px 18px", border: `1px solid ${color}30`, background: color + "10", color, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
//                 {label}
//               </Link>
//             ))}
//           </div>
//         </div>

//         {/* HR Management */}
//         <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
//           <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>HR Management</h2>
//           <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Invite recruiters to join your company</p>

//           {/* Invite form */}
//           <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
//             <input
//               value={inviteEmail}
//               onChange={e => setInviteEmail(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && handleInvite()}
//               placeholder="recruiter@company.com"
//               style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a" }}
//               onFocus={e => e.currentTarget.style.borderColor = "#2563eb"}
//               onBlur={e  => e.currentTarget.style.borderColor = "#e2e8f0"}
//             />
//             <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
//               style={{ padding: "10px 22px", background: inviting ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: inviting ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
//               {inviting ? "Inviting..." : "Send Invite →"}
//             </button>
//           </div>

//           {inviteMsg && (
//             <p style={{ fontSize: 13, color: inviteMsg.startsWith("✓") ? "#16a34a" : "#dc2626", marginBottom: 12 }}>
//               {inviteMsg}
//             </p>
//           )}

//           <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
//             <p style={{ fontSize: 13, color: "#94a3b8" }}>
//               📌 The invited user must already have a HireFlow account. They will be linked to <strong>{company?.name}</strong> as a recruiter immediately.
//             </p>
//             <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>
//               Accept/reject invite flow coming soon.
//             </p>
//           </div>
//         </div>

//         {/* Audit Trail Categories */}
//         <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
//           <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Audit Trail</h2>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
//             {[
//               { icon: "🔐", label: "Auth Events",     href: "/admin/audit?type=auth"     },
//               { icon: "📋", label: "Job Events",      href: "/admin/audit?type=jobs"     },
//               { icon: "📊", label: "Pipeline Events", href: "/admin/audit?type=pipeline" },
//               { icon: "📄", label: "Resume Events",   href: "/admin/audit?type=resume"   },
//               { icon: "🤖", label: "AI Usage",        href: "/admin/audit?type=ai"       },
//               { icon: "💰", label: "Payment Events",  href: "/admin/audit?type=payments" },
//             ].map(({ icon, label, href }) => (
//               <Link key={label} href={href}
//                 style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, textDecoration: "none", border: "1px solid #f1f5f9", transition: "all 0.15s" }}
//                 onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.background = "#eff6ff"; }}
//                 onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}>
//                 <span style={{ fontSize: 22 }}>{icon}</span>
//                 <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</p>
//               </Link>
//             ))}
//           </div>
//         </div>

//       </main>
//     </div>
//   );
// }

"use client";
// frontend/app/admin/page.tsx

import { useEffect, useState } from "react";
import { companyApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/user.store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [company,     setCompany]     = useState<any>(null);
  const [stats,       setStats]       = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting,    setInviting]    = useState(false);
  const [inviteMsg,   setInviteMsg]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.stats().catch(() => null),
    ]).then(([c, s]) => {
      setCompany(c);
      setStats(s);
    }).finally(() => setLoading(false));
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim() || !company) return;
    setInviting(true); setInviteMsg("");
    try {
      await companyApi.invite(inviteEmail.trim(), company.id);
      setInviteMsg("✓ Recruiter invited successfully");
      setInviteEmail("");
    } catch (e: any) {
      setInviteMsg("✗ " + (e.message ?? "Failed to invite"));
    } finally {
      setInviting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: "#94a3b8" }}>Loading...</p>
    </div>
  );

  const breakdown = stats?.pipeline_breakdown ?? {};

  const NAV_LINKS = [
    { href: "/admin",       label: "Overview",   active: true },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/jobs",  label: "Jobs" },
    { href: "/admin/audit", label: "Audit Trail" },
    { href: "/recruiter-dashboard", label: "Dashboard" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-nav-links { display: flex; gap: 24px; align-items: center; }
        .adm-hamburger { display: none; }
        .adm-mobile-menu { display: none; }
        .adm-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .adm-actions-grid { grid-template-columns: repeat(3, 1fr) !important; }
        @media (max-width: 768px) {
          .adm-nav-links { display: none !important; }
          .adm-hamburger { display: flex !important; }
          .adm-mobile-menu { display: flex !important; }
          .adm-main { padding: 16px !important; }
          .adm-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-actions-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-audit-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-invite-row { flex-direction: column !important; }
          .adm-invite-row button { width: 100% !important; }
          .adm-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/recruiter-dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>

        {/* Desktop links */}
        <div className="adm-nav-links">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: l.active ? 600 : 400, color: l.active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <button onClick={() => { useUserStore.getState().logout(); router.push("/login"); }}
            style={{ background: "none", border: "none", fontSize: 14, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>ADMIN</span>
        </div>

        {/* Mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="adm-hamburger" style={{ display: "none", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>ADMIN</span>
          <button
            className="adm-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{ display: "none", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <span style={{ display: "block", width: 22, height: 2, background: "#64748b", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#64748b", borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: "all 0.2s" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#64748b", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="adm-mobile-menu" style={{ display: "none", flexDirection: "column", gap: 16, background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: 14, fontWeight: l.active ? 600 : 400, color: l.active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <button onClick={() => { useUserStore.getState().logout(); router.push("/login"); }}
            style={{ background: "none", border: "none", fontSize: 14, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0 }}>
            Sign out
          </button>
        </div>
      )}

      <main className="adm-main" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div className="adm-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Company Admin</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{company?.name ?? "Your Company"} · Management Portal</p>
          </div>
          <Link href="/jobs/create"
            style={{ background: "#2563eb", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            + Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="adm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Active Jobs",      value: stats?.active_jobs ?? 0,      color: "#2563eb", icon: "📋" },
            { label: "Total Applicants", value: stats?.total_applicants ?? 0, color: "#7c3aed", icon: "👥" },
            { label: "In Pipeline",      value: Object.entries(breakdown).filter(([s]) => !["applied","ats_rejected","withdrawn"].includes(s)).reduce((a,[,v]) => a + (v as number), 0), color: "#0891b2", icon: "📊" },
            { label: "Selected",         value: breakdown["selected"] ?? 0,   color: "#16a34a", icon: "🎉" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                <span style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Quick Actions</h2>
          <div className="adm-actions-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "📋 Post a Job",       href: "/jobs/create",         color: "#2563eb" },
              { label: "👥 View Candidates",   href: "/candidates",          color: "#7c3aed" },
              { label: "📊 Pipeline View",     href: "/recruiter-dashboard", color: "#0891b2" },
              { label: "💰 Salary Benchmarks", href: "/salary",              color: "#16a34a" },
              { label: "🔐 Audit Trail",       href: "/admin/audit",         color: "#b45309" },
              { label: "🏢 Company Profile",   href: "/company/profile",     color: "#dc2626" },
            ].map(({ label, href, color }) => (
              <Link key={label} href={href}
                style={{ padding: "12px 16px", border: `1px solid ${color}30`, background: color + "10", color, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "block" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* HR Management */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>HR Management</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Invite recruiters to join your company</p>
          <div className="adm-invite-row" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              placeholder="recruiter@company.com"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a", width: "100%" }}
              onFocus={e => e.currentTarget.style.borderColor = "#2563eb"}
              onBlur={e  => e.currentTarget.style.borderColor = "#e2e8f0"}
            />
            <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
              style={{ padding: "10px 22px", background: inviting ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: inviting ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {inviting ? "Inviting..." : "Send Invite →"}
            </button>
          </div>
          {inviteMsg && (
            <p style={{ fontSize: 13, color: inviteMsg.startsWith("✓") ? "#16a34a" : "#dc2626", marginBottom: 12 }}>
              {inviteMsg}
            </p>
          )}
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              📌 The invited user must already have a HireFlow account. They will be linked to <strong>{company?.name}</strong> as a recruiter immediately.
            </p>
            <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>Accept/reject invite flow coming soon.</p>
          </div>
        </div>

        {/* Audit Trail Categories */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Audit Trail</h2>
          <div className="adm-audit-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { icon: "🔐", label: "Auth Events",     href: "/admin/audit?type=auth"     },
              { icon: "📋", label: "Job Events",      href: "/admin/audit?type=jobs"     },
              { icon: "📊", label: "Pipeline Events", href: "/admin/audit?type=pipeline" },
              { icon: "📄", label: "Resume Events",   href: "/admin/audit?type=resume"   },
              { icon: "🤖", label: "AI Usage",        href: "/admin/audit?type=ai"       },
              { icon: "💰", label: "Payment Events",  href: "/admin/audit?type=payments" },
            ].map(({ icon, label, href }) => (
              <Link key={label} href={href}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, textDecoration: "none", border: "1px solid #f1f5f9" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.background = "#eff6ff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}