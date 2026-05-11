// frontend/app/(company)/recruiter-jobs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { companyApi, jobsApi, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4338CA" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#EFF6FF", text: "#1D4ED8" },
];
function pickColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "clock")    return <svg {...s} {...p}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
  if (t === "salary")   return <svg {...s} {...p}><path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "close")    return <svg {...s} {...p}><path d="M2 2l12 12M14 2L2 14"/></svg>;
  return null;
}

function SbLink({ href, icon, label, active, badge, onClick }: { href: string; icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="sb-lnk" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 14px", fontSize: 12, textDecoration: "none",
      color: active ? "#4F46E5" : "#64748B",
      background: active ? "#EEF2FF" : "transparent",
      fontWeight: active ? 600 : 400,
      margin: "1px 6px", borderRadius: 8,
    }}>
      <Icon t={icon} />
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: "auto", background: "#EEF2FF", color: "#4F46E5", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function RecruiterJobsPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();

  const [company,     setCompany]     = useState<any>(null);
  const [jobs,        setJobs]        = useState<JobOut[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [closing,     setClosing]     = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.myJobs().catch(() => []),
    ]).then(([c, j]) => {
      setCompany(c);
      setJobs(j as JobOut[]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleClose(jobId: string) {
    setClosing(jobId);
    try {
      await fetch(`http://localhost:8001/api/v1/jobs/${jobId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("hf_token")}` },
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {}
    finally { setClosing(null); }
  }

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sb-lnk{transition:background 0.1s,color 0.1s}
        .sb-lnk:hover{background:#F8FAFC!important;color:#0F172A!important}
        .jr:hover{background:#F8FAFC!important}
        .post-btn{transition:background 0.12s}
        .post-btn:hover{background:#4338CA!important}
        .close-btn:hover{background:#FEF2F2!important;color:#DC2626!important;border-color:#FECACA!important}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:2px}

        @media (max-width: 768px) {
          .rj-sidebar { display: none !important; }
          .rj-sidebar.open { display: flex !important; }
          .rj-mobile-topbar { display: flex !important; }
          .rj-desktop-topbar-title { display: none; }

          .rj-content-area {
            padding: 16px !important;
          }

          .rj-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .rj-header-row input {
            width: 100% !important;
          }

          .rj-table-header { display: none !important; }

          .jr {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 12px 14px !important;
          }

          .jr-location, .jr-type { display: none !important; }

          .jr-actions {
            display: flex !important;
            gap: 8px !important;
          }

          .rj-backdrop {
            display: block !important;
          }
        }
      `}</style>

      {/* Mobile backdrop */}
      <div
        className="rj-backdrop"
        onClick={() => setSidebarOpen(false)}
        style={{ display: "none", position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.3)" }}
      />

      {/* Sidebar */}
      <aside
        className={`rj-sidebar${sidebarOpen ? " open" : ""}`}
        style={{
          width: 210, background: "#fff", borderRight: "0.5px solid #E2E8F0",
          flexDirection: "column", flexShrink: 0,
          position: sidebarOpen ? "fixed" : "sticky",
          top: 0, height: "100vh", overflowY: "auto", zIndex: 40,
          display: "flex",
        }}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ display: "none", position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
          className="rj-close-btn"
        >
          <Icon t="close" />
        </button>
        <style>{`.rj-close-btn { display: none !important; } @media (max-width: 768px) { .rj-close-btn { display: block !important; } }`}</style>

        <div style={{ padding: "18px 16px 12px", borderBottom: "0.5px solid #F1F5F9" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>Hire<span style={{ color: "#4F46E5" }}>Flow</span></span>
        </div>
        {company && (
          <div style={{ margin: "10px 10px 4px", padding: "7px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#15803D" }}>
            {company.name}
          </div>
        )}
        <div style={{ padding: "14px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
          <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard" onClick={() => setSidebarOpen(false)} />
          <SbLink href="/recruiter-jobs" icon="jobs" label="Jobs" active badge={jobs.length} onClick={() => setSidebarOpen(false)} />
          <SbLink href="/candidates" icon="cands" label="Candidates" onClick={() => setSidebarOpen(false)} />
          <SbLink href="/candidates" icon="pipe"  label="Pipeline" onClick={() => setSidebarOpen(false)} />
        </div>
        <div style={{ padding: "10px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tools</div>
          <SbLink href="/referrals" icon="ref" label="Referrals" onClick={() => setSidebarOpen(false)} />
        </div>
        <div style={{ marginTop: "auto", padding: "12px 6px", borderTop: "0.5px solid #F1F5F9" }}>
          <SbLink href="/settings" icon="settings" label="Settings" onClick={() => setSidebarOpen(false)} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", marginTop: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name ?? "Recruiter"}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? ""}</p>
            </div>
            <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 10, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Out</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile topbar */}
        <div
          className="rj-mobile-topbar"
          style={{ display: "none", background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 16px", height: 52, alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", cursor: "pointer", color: "#64748B" }}
          >
            <Icon t="menu" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Jobs</span>
          <Link href="/jobs/create" className="post-btn" style={{ background: "#4F46E5", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + Post
          </Link>
        </div>

        {/* Desktop Topbar */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}
          className="rj-desktop-topbar-title">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Jobs</p>
          <Link href="/jobs/create" className="post-btn" style={{ background: "#4F46E5", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + Post Job
          </Link>
        </div>

        <div className="rj-content-area" style={{ padding: "20px 24px", flex: 1 }}>

          {/* Header + search */}
          <div className="rj-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Your Jobs</h1>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
                {jobs.length} role{jobs.length !== 1 ? "s" : ""} posted · {company?.name ?? ""}
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              style={{ padding: "8px 14px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#0F172A", background: "#fff", width: 220 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#4F46E5"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
            />
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 72, borderRadius: 12, background: "#E2E8F0", animation: "pulse 1.4s infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", border: "2px dashed #E2E8F0", borderRadius: 14, background: "#fff" }}>
              {jobs.length === 0 ? (
                <>
                  <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 14 }}>No jobs posted yet</p>
                  <Link href="/jobs/create" style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5", textDecoration: "none" }}>
                    + Post your first job →
                  </Link>
                </>
              ) : (
                <p style={{ fontSize: 14, color: "#94A3B8" }}>No jobs match "{search}"</p>
              )}
            </div>
          ) : (
            <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              {/* Table header — hidden on mobile */}
              <div className="rj-table-header" style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 120px", gap: 12, padding: "10px 20px", borderBottom: "0.5px solid #F1F5F9", background: "#F8FAFC" }}>
                {["Role", "Location", "Type", "Status", "Actions"].map((h) => (
                  <p key={h} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
                ))}
              </div>
              {filtered.map((job, i) => {
                const col = pickColor(job.company_name || "Co");
                return (
                  <div key={job.id} className="jr" style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 120px", gap: 12, padding: "13px 20px", borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none", alignItems: "center", transition: "background 0.1s" }}>
                    {/* Role */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: col.bg, color: col.text, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {getInitials(job.company_name || "Co")}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</p>
                        <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{job.company_name}</p>
                      </div>
                    </div>
                    {/* Location — hidden on mobile */}
                    <p className="jr-location" style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.location || "Remote"}</p>
                    {/* Type — hidden on mobile */}
                    <span className="jr-type" style={{ fontSize: 10, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: "#EEF2FF", color: "#4338CA", whiteSpace: "nowrap", width: "fit-content" }}>
                      {job.job_type}
                    </span>
                    {/* Status */}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#F0FDF4", color: "#15803D", whiteSpace: "nowrap", width: "fit-content" }}>
                      Live
                    </span>
                    {/* Actions */}
                    <div className="jr-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Link href={`/jobs/${job.id}/pipeline`} style={{ fontSize: 11, color: "#4F46E5", fontWeight: 600, textDecoration: "none", padding: "4px 10px", borderRadius: 7, background: "#EEF2FF" }}>
                        Pipeline
                      </Link>
                      <button
                        onClick={() => handleClose(job.id)}
                        disabled={closing === job.id}
                        className="close-btn"
                        style={{ fontSize: 11, color: "#64748B", fontWeight: 500, padding: "4px 10px", borderRadius: 7, background: "#F8FAFC", border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}
                      >
                        {closing === job.id ? "..." : "Close"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}