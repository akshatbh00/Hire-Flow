"use client";
// PATH: frontend/app/(user)/dashboard/page.tsx
// ✅ Desktop layout: UNCHANGED
// ✅ Mobile layout: Naukri-style — top bar + cards + bottom nav

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersApi, resumeApi, DashboardOut, ResumeOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

const STAGE_ORDER = ["applied", "ats_screening", "round_1", "round_2", "round_3", "hr_round", "offer", "selected"];
const STAGE_LABELS: Record<string, string> = {
  applied: "Applied", ats_screening: "ATS", ats_rejected: "Rejected",
  round_1: "Round 1", round_2: "Round 2", round_3: "Round 3",
  hr_round: "HR", offer: "Offer", selected: "Selected", withdrawn: "Withdrawn",
};
const STAGE_COLORS: Record<string, string> = {
  selected: "#10b981", offer: "#10b981", hr_round: "#3b82f6",
  round_1: "#3b82f6", round_2: "#3b82f6", round_3: "#3b82f6",
  ats_rejected: "#ef4444", ats_screening: "#f59e0b", applied: "#94a3b8",
};

function profileCompleteness(user: any, resume: any): { score: number; missing: string[] } {
  const checks = [
    { key: "name",    done: !!user?.full_name,                                  label: "Full name" },
    { key: "resume",  done: !!resume,                                            label: "Upload resume" },
    { key: "skills",  done: (resume?.parsed_data?.skills?.length ?? 0) > 0,     label: "Skills on resume" },
    { key: "exp",     done: (resume?.parsed_data?.experience?.length ?? 0) > 0, label: "Work experience" },
    { key: "edu",     done: (resume?.parsed_data?.education?.length ?? 0) > 0,  label: "Education" },
    { key: "ats",     done: (resume?.ats_score ?? 0) >= 60,                     label: "ATS score ≥ 60" },
    { key: "applied", done: false,                                               label: "Apply to 3+ jobs" },
  ];
  const done    = checks.filter(c => c.done).length;
  const missing = checks.filter(c => !c.done).map(c => c.label);
  return { score: Math.round((done / checks.length) * 100), missing };
}

export default function DashboardPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();
  const [data,   setData]   = useState<DashboardOut | null>(null);
  const [resume, setResume] = useState<ResumeOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.dashboard(),
      resumeApi.me().catch(() => null),
    ]).then(([d, r]) => {
      setData(d);
      setResume(r);
    }).catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data)   return null;

  const topApp  = data.active_pipeline?.[0];
  const parsed  = resume?.parsed_data;
  const profile = profileCompleteness(user, resume);
  const unread  = data.notifications?.filter((n: any) => !n.is_read).length ?? 0;
  const firstName = data.full_name?.split(" ")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .desktop-nav-bar   { display: none !important; }
          .mobile-topbar     { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .page-content      { padding: 16px 16px 88px !important; }
          .dashboard-grid-3col   { grid-template-columns: 1fr !important; }
          .metric-cards-5col     { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .dashboard-hero-row    { flex-direction: column !important; gap: 10px !important; }
          .dashboard-hero-row .hero-actions { display: flex !important; gap: 8px !important; width: 100% !important; }
          .dashboard-hero-row .hero-actions a { flex: 1 !important; text-align: center !important; font-size: 12px !important; padding: 9px 10px !important; }
          /* Mobile-specific greeting card */
          .mobile-greeting-card { display: block !important; }
          /* Hide right col desktop widgets — show in mobile section */
          .dashboard-right-col { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .dashboard-right-col > *:last-child { display: none !important; }
          /* Pipeline dots: smaller on mobile */
          .pipeline-dot-label { display: none !important; }
          .pipeline-stage-dot { width: 8px !important; height: 8px !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar     { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .mobile-greeting-card { display: none !important; }
        }

        /* Shared card hover */
        .dash-card { transition: box-shadow 0.15s; }
        .dash-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.07) !important; }
        .quick-link:hover { background: #f8fafc !important; }
        .job-match-row:hover { background: #f8fafc !important; }
      `}</style>

      {/* ── Mobile Top Bar ── */}
      <MobileTopBar unread={unread} />

      {/* ── Desktop Nav ── */}
      <nav className="desktop-nav-bar" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[
            { href: "/dashboard",      label: "Dashboard",   active: true },
            { href: "/jobs",           label: "Jobs" },
            { href: "/applications",   label: "Applications" },
            { href: "/resume",         label: "Resume" },
            { href: "/salary",         label: "Salary" },
            { href: "/insider",        label: "Network" },
            { href: "/interview-prep", label: "Prep" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13.5, fontWeight: l.active ? 600 : 400, color: l.active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <Link href="/notifications" style={{ position: "relative", fontSize: 18, textDecoration: "none" }}>
            🔔
            {unread > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unread}
              </span>
            )}
          </Link>
          {data.tier === "premium" && (
            <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, border: "1px solid #bfdbfe" }}>Premium</span>
          )}
          <Link href="/profile" style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            {data.full_name?.[0]?.toUpperCase() ?? "U"}
          </Link>
          <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="page-content" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── Mobile greeting card (only on mobile) ── */}
        <div className="mobile-greeting-card" style={{
          display: "none",
          background: "linear-gradient(135deg, #1e40af, #2563eb)",
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 16,
          color: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Welcome back 👋</p>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{firstName}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              {data.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <Link href="/jobs" style={{ flex: 1, background: "#fff", color: "#2563eb", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
              Browse Jobs
            </Link>
            <Link href="/resume" style={{ flex: 1, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", border: "1px solid rgba(255,255,255,0.3)" }}>
              My Resume
            </Link>
          </div>
        </div>

        {/* ── Desktop hero row ── */}
        <div className="dashboard-hero-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Hey, {firstName} 👋
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Here's your complete hiring dashboard</p>
          </div>
          <div className="hero-actions" style={{ display: "flex", gap: 10 }}>
            <Link href="/interview-prep" style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#374151", textDecoration: "none", background: "#fff" }}>
              Interview Prep →
            </Link>
            <Link href="/jobs" style={{ background: "#2563eb", color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Browse Jobs →
            </Link>
          </div>
        </div>

        {/* ── Metric cards — 5 col desktop / 2 col mobile ── */}
        <div className="metric-cards-5col" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "ATS Score",   value: resume?.ats_score ? `${Math.round(resume.ats_score)}` : "—", sub: "Resume score",      color: resume?.ats_score ? (resume.ats_score >= 70 ? "#10b981" : resume.ats_score >= 45 ? "#f59e0b" : "#ef4444") : "#94a3b8" },
            { label: "Applied",     value: String(data.total_applied),                                    sub: "Total apps",        color: "#2563eb" },
            { label: "Best Stage",  value: data.highest_stage ? STAGE_LABELS[data.highest_stage] ?? data.highest_stage : "—",       sub: "Highest reached", color: data.highest_stage ? STAGE_COLORS[data.highest_stage] ?? "#2563eb" : "#94a3b8" },
            { label: "Matches",     value: String(data.top_job_matches?.length ?? 0),                     sub: "AI matched roles",  color: "#8b5cf6" },
            { label: "Profile",     value: `${profile.score}%`,                                           sub: "Completeness",      color: profile.score >= 80 ? "#10b981" : profile.score >= 50 ? "#f59e0b" : "#ef4444" },
          ].map((m) => (
            <div key={m.label} className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
              <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── 3-column grid (desktop) / stacked (mobile) ── */}
        <div className="dashboard-grid-3col" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 18 }}>

          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Profile card */}
            <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                {data.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{data.full_name}</p>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{parsed?.current_title || "Job Seeker"}</p>
              {parsed?.email && <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>{parsed.email}</p>}

              {/* Profile ring */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                <svg width="80" height="80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  <circle cx="40" cy="40" r="34" fill="none"
                    stroke={profile.score >= 80 ? "#10b981" : profile.score >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="7"
                    strokeDasharray={`${(profile.score / 100) * 214} 214`}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                  <text x="40" y="44" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">{profile.score}%</text>
                </svg>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Profile completeness</p>

              {profile.missing.length > 0 && (
                <div style={{ textAlign: "left", background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Complete your profile:</p>
                  {profile.missing.slice(0, 3).map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                      <p style={{ fontSize: 11.5, color: "#64748b" }}>{m}</p>
                    </div>
                  ))}
                </div>
              )}

              <Link href="/profile" style={{ display: "block", padding: "8px", background: "#eff6ff", color: "#2563eb", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Edit Profile →
              </Link>
            </div>

            {/* Career snapshot */}
            <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Career Snapshot</p>
              {[
                { label: "Experience", value: `${parsed?.total_experience_years ?? 0} yrs` },
                { label: "Skills",     value: `${parsed?.skills?.length ?? 0} listed` },
                { label: "Education",  value: parsed?.education?.[0]?.degree ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Skills */}
            {parsed?.skills && parsed.skills.length > 0 && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Top Skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {parsed.skills.slice(0, 10).map((s: string) => (
                    <span key={s} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe" }}>{s}</span>
                  ))}
                  {parsed.skills.length > 10 && (
                    <span style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#64748b" }}>+{parsed.skills.length - 10}</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Quick Actions</p>
              {[
                { href: "/resume",         label: "📄 Update Resume" },
                { href: "/salary",         label: "💰 Salary Insights" },
                { href: "/insider",        label: "🤝 Find Insiders" },
                { href: "/interview-prep", label: "🎯 Interview Prep" },
                { href: "/settings",       label: "⚙️ Settings" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="quick-link" style={{ display: "block", padding: "8px 10px", borderRadius: 8, fontSize: 13, color: "#374151", textDecoration: "none", marginBottom: 2 }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── CENTER ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Pipeline tracker */}
            {topApp ? (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Latest Application</p>
                  <Link href="/applications" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{topApp.job_title}</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>{topApp.company ?? topApp.company_name}</p>

                {/* Stage pipeline */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
                  {STAGE_ORDER.map((stage, i) => {
                    const currentIdx = STAGE_ORDER.indexOf(topApp.current_stage);
                    const isPast     = i < currentIdx;
                    const isCurrent  = i === currentIdx;
                    return (
                      <div key={stage} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 36 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <div className="pipeline-stage-dot" style={{ width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10, borderRadius: "50%", background: isCurrent ? "#2563eb" : isPast ? "#bfdbfe" : "#e2e8f0", border: `2px solid ${isCurrent ? "#2563eb" : isPast ? "#93c5fd" : "#e2e8f0"}`, boxShadow: isCurrent ? "0 0 0 4px #dbeafe" : "none", transition: "all 0.3s" }} />
                          <span className="pipeline-dot-label" style={{ fontSize: 8, color: isCurrent ? "#2563eb" : isPast ? "#93c5fd" : "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: isCurrent ? 700 : 400 }}>
                            {STAGE_LABELS[stage]}
                          </span>
                        </div>
                        {i < STAGE_ORDER.length - 1 && (
                          <div style={{ flex: 1, height: 2, borderRadius: 2, background: isPast ? "#bfdbfe" : "#e2e8f0", margin: "0 2px", marginBottom: 18 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Currently at</span>
                  <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 100 }}>
                    {STAGE_LABELS[topApp.current_stage] ?? topApp.current_stage}
                  </span>
                  {topApp.match_score && (
                    <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                      {Math.round(topApp.match_score)}% match
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "36px", textAlign: "center" }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🚀</p>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>No applications yet — start your journey!</p>
                <Link href="/jobs" style={{ background: "#2563eb", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  Browse Jobs →
                </Link>
              </div>
            )}

            {/* Active pipeline list */}
            {data.active_pipeline && data.active_pipeline.length > 1 && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Pipeline ({data.active_pipeline.length})</p>
                  <Link href="/applications" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.active_pipeline.slice(0, 4).map((app: any, i: number) => {
                    const color = STAGE_COLORS[app.current_stage] ?? "#94a3b8";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: 10 }}>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0f172a" }}>{app.job_title}</p>
                          <p style={{ fontSize: 12, color: "#64748b" }}>{app.company ?? app.company_name}</p>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: color + "20", color }}>
                          {STAGE_LABELS[app.current_stage] ?? app.current_stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Matched Jobs */}
            {data.top_job_matches?.length > 0 && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Matched Jobs</p>
                  <Link href="/jobs" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>See all →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {data.top_job_matches.slice(0, 5).map((job: any, i: number) => (
                    <Link key={i} href={`/jobs/${job.id}`} className="job-match-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 10px", borderRadius: 10, textDecoration: "none" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{job.title}</p>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{job.company_name}</p>
                      </div>
                      {job.score && (
                        <span style={{ background: "#f0fdf4", color: "#10b981", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>
                          {Math.round(job.score * 100)}%
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Employment history */}
            {parsed?.experience && parsed.experience.length > 0 && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Employment History</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {parsed.experience.map((exp: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < parsed.experience.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 3 }} />
                        {i < parsed.experience.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", margin: "4px 0" }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{exp.title}</p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>{exp.company}</p>
                        {exp.duration_months && (
                          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                            {Math.round(exp.duration_months / 12 * 10) / 10} years
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="dashboard-right-col" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ATS Score ring */}
            {resume?.ats_score ? (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>ATS Score</p>
                <svg width="100" height="100" style={{ display: "block", margin: "0 auto 8px" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={resume.ats_score >= 70 ? "#10b981" : resume.ats_score >= 45 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="9"
                    strokeDasharray={`${(resume.ats_score / 100) * 264} 264`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                  <text x="50" y="46" textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="700">{Math.round(resume.ats_score)}</text>
                  <text x="50" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10">/100</text>
                </svg>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                  {resume.ats_score >= 70 ? "Strong score 💪" : resume.ats_score >= 45 ? "Needs improvement" : "Needs work"}
                </p>
                <Link href="/resume" style={{ display: "block", padding: "7px", background: "#f8fafc", color: "#2563eb", borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: "none", border: "1px solid #e2e8f0" }}>
                  Full Report →
                </Link>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>No resume yet</p>
                <Link href="/resume" style={{ background: "#2563eb", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Upload Resume →
                </Link>
              </div>
            )}

            {/* Benchmark */}
            {topApp?.benchmark_score != null && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>vs Selected Pool</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: "#2563eb", letterSpacing: "-0.03em" }}>{Math.round(topApp.benchmark_score)}%</p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                  Better than {Math.round(topApp.benchmark_score)}% of hired candidates
                </p>
              </div>
            )}

            {/* KAREN */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe", borderRadius: 16, padding: "18px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 6 }}>✦ KAREN</p>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
                Your AI career copilot is ready. Ask about resume tips, job matches, or interview prep.
              </p>
              <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 500 }}>Click ✦ below to chat →</p>
            </div>

            {/* Premium CTA */}
            {data.tier === "free" && (
              <div style={{ background: "#0f172a", borderRadius: 16, padding: "18px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>✦ Go Premium</p>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 14 }}>
                  Resume rewrites, JD tailoring, gap analysis and priority matching.
                </p>
                <button style={{ width: "100%", padding: "9px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Upgrade →
                </button>
              </div>
            )}

            {/* Recent notifications */}
            {data.notifications?.length > 0 && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Activity</p>
                  <Link href="/notifications" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>All →</Link>
                </div>
                {data.notifications.slice(0, 3).map((n: any, i: number) => (
                  <div key={n.id ?? i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.is_read ? "#e2e8f0" : "#2563eb", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileBottomNav active="home" unread={unread} />
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Hire<span style={{ color: "#2563eb" }}>Flow</span>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", opacity: 0.4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}