"use client";
// frontend/app/candidates/page.tsx
import { useEffect, useState } from "react";
import { companyApi, jobsApi, CandidateOut, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── shared icon + sidebar (same pattern as all recruiter pages) ─ */
function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "close")    return <svg {...s} {...p}><path d="M2 2l12 12M14 2L2 14"/></svg>;
  return null;
}

function SbLink({ href, icon, label, active, badge, onClick }: {
  href: string; icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
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

/* ─── main page ───────────────────────────────────────── */
export default function CandidatesPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();

  const [company,     setCompany]     = useState<any>(null);
  const [jobs,        setJobs]        = useState<JobOut[]>([]);
  const [candidates,  setCandidates]  = useState<CandidateOut[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.myJobs().catch(() => []),
    ]).then(([c, j]) => {
      setCompany(c);
      setJobs(j as JobOut[]);
    }).finally(() => setLoadingJobs(false));
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function loadCandidates(jobId: string) {
    setSelectedJob(jobId);
    setLoading(true);
    try {
      const res = await jobsApi.candidates(jobId);
      setCandidates(res);
    } catch { setCandidates([]); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sb-lnk{transition:background 0.1s,color 0.1s}
        .sb-lnk:hover{background:#F8FAFC!important;color:#0F172A!important}
        .job-btn{transition:all 0.12s}
        .job-btn:hover{border-color:#C7D7FE!important;background:#EEF2FF!important;color:#4338CA!important}
        .cand-card{transition:border-color 0.12s,transform 0.12s}
        .cand-card:hover{border-color:#C7D7FE!important;transform:translateY(-1px)}
        .post-btn{transition:background 0.12s}
        .post-btn:hover{background:#4338CA!important}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:2px}

        @media (max-width: 768px) {
          .cn-sidebar {
            position: fixed !important;
            top: 0; left: 0;
            height: 100% !important;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .cn-sidebar.open {
            transform: translateX(0);
          }
          .cn-mobile-topbar { display: flex !important; }
          .cn-desktop-topbar { display: none !important; }
          .cn-backdrop { display: block !important; }
          .cn-content { padding: 16px !important; }
          .cn-job-chips { gap: 6px !important; }
          .cand-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Mobile Backdrop ── */}
      <div
        className="cn-backdrop"
        onClick={() => setSidebarOpen(false)}
        style={{ display: "none", position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,0.3)" }}
      />

      {/* ── Sidebar ── */}
      <aside
        className={`cn-sidebar${sidebarOpen ? " open" : ""}`}
        style={{
          width: 210, background: "#fff", borderRight: "0.5px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0,
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        }}
      >
        <div style={{ padding: "18px 16px 12px", borderBottom: "0.5px solid #F1F5F9" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </div>
        {company && (
          <div style={{ margin: "10px 10px 4px", padding: "7px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#15803D" }}>
            {company.name}
          </div>
        )}
        <div style={{ padding: "14px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
          <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard"  onClick={() => setSidebarOpen(false)} />
          <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"        badge={jobs.length} onClick={() => setSidebarOpen(false)} />
          <SbLink href="/candidates"          icon="cands" label="Candidates"  active onClick={() => setSidebarOpen(false)} />
          <SbLink href="/candidates"          icon="pipe"  label="Pipeline"    onClick={() => setSidebarOpen(false)} />
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

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile Topbar */}
        <div
          className="cn-mobile-topbar"
          style={{
            display: "none", background: "#fff", borderBottom: "0.5px solid #E2E8F0",
            padding: "0 16px", height: 52, alignItems: "center",
            justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", cursor: "pointer", color: "#64748B" }}
          >
            <Icon t="menu" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Candidates</span>
          <Link href="/jobs/create" className="post-btn" style={{ background: "#4F46E5", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + Post
          </Link>
        </div>

        {/* Desktop Topbar */}
        <div
          className="cn-desktop-topbar"
          style={{
            background: "#fff", borderBottom: "0.5px solid #E2E8F0",
            padding: "0 24px", height: 52, display: "flex",
            alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 20,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Candidates</p>
          <Link href="/jobs/create" className="post-btn" style={{ background: "#4F46E5", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + Post Job
          </Link>
        </div>

        <div className="cn-content" style={{ padding: "20px 24px", flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Candidates</h1>
            <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 3 }}>Browse applicants by your posted roles</p>
          </div>

          {/* Job selector */}
          {loadingJobs ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ width: 120, height: 32, borderRadius: 9, background: "#E2E8F0" }} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: "32px 24px", border: "2px dashed #E2E8F0", borderRadius: 14, background: "#fff", marginBottom: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 10 }}>No jobs posted yet for your company.</p>
              <Link href="/jobs/create" style={{ fontSize: 12, color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>
                + Post your first job →
              </Link>
            </div>
          ) : (
            <div className="cn-job-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => loadCandidates(job.id)}
                  className="job-btn"
                  style={{
                    padding: "6px 13px", borderRadius: 9,
                    border: `1px solid ${selectedJob === job.id ? "#C7D7FE" : "#E2E8F0"}`,
                    background: selectedJob === job.id ? "#EEF2FF" : "#fff",
                    color: selectedJob === job.id ? "#4338CA" : "#374151",
                    fontSize: 12, fontWeight: selectedJob === job.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {job.title}
                </button>
              ))}
            </div>
          )}

          {/* Candidates panel */}
          {!selectedJob ? (
            <div style={{ textAlign: "center", padding: "60px 24px", border: "2px dashed #E2E8F0", borderRadius: 14, background: "#fff" }}>
              <p style={{ color: "#94A3B8", fontSize: 13 }}>Select a job above to view its candidates</p>
            </div>

          ) : loading ? (
            <div className="cand-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: "#E2E8F0", borderRadius: 12, height: 120 }} />
              ))}
            </div>

          ) : candidates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", border: "2px dashed #E2E8F0", borderRadius: 14, background: "#fff" }}>
              <p style={{ color: "#94A3B8", fontSize: 13 }}>No candidates for this role yet</p>
            </div>

          ) : (
            <>
              <p style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{candidates.length}</span> candidate{candidates.length !== 1 ? "s" : ""}
              </p>
              <div className="cand-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {candidates.map((c) => (
                  <Link key={c.user_id} href={`/candidates/${c.user_id}?job=${selectedJob}`} style={{ textDecoration: "none" }}>
                    <div className="cand-card" style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "15px 16px", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", color: "#4338CA", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {c.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.full_name ?? "Unknown"}
                          </p>
                          <p style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.email}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                          <p style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3, fontWeight: 600 }}>Match</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: c.match_score >= 70 ? "#15803D" : "#D97706" }}>
                            {Math.round(c.match_score)}%
                          </p>
                        </div>
                        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                          <p style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3, fontWeight: 600 }}>ATS</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#4F46E5" }}>
                            {Math.round(c.ats_score)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}