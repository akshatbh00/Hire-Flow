"use client";
// PATH: frontend/app/(user)/jobs/page.tsx
// ✅ Desktop layout: UNCHANGED (2-col grid, top filter bar)
// ✅ Mobile layout: Naukri-style — sticky search, full-width cards, bottom nav

import { useEffect, useState } from "react";
import { jobsApi, applicationsApi, JobOut } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

const JOB_TYPES = ["", "fulltime", "parttime", "contract", "internship", "remote"];

function toL(val: number) {
  const l = val / 100000;
  return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4338CA" },
  { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#ECFDF5", text: "#065F46" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#EFF6FF", text: "#1D4ED8" },
  { bg: "#FDF4FF", text: "#7E22CE" },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function matchColor(score: number) {
  if (score >= 80) return { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" };
  if (score >= 60) return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
  return { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };
}

export default function JobsPage() {
  const [jobs,       setJobs]       = useState<JobOut[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [applying,   setApplying]   = useState<string | null>(null);
  const [applied,    setApplied]    = useState<Set<string>>(new Set());
  const [applyError, setApplyError] = useState("");
  const [search,     setSearch]     = useState("");
  const [jobType,    setJobType]    = useState("");
  const [location,   setLocation]   = useState("");
  const [showAll,    setShowAll]    = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch   = useDebouncedValue(search, 400);
  const debouncedLocation = useDebouncedValue(location, 400);

  useEffect(() => {
    applicationsApi.list()
      .then((apps) => setApplied(new Set(apps.map((a) => a.job_id))))
      .catch(() => {});
  }, []);

  useEffect(() => { loadJobs(); }, [debouncedSearch, jobType, debouncedLocation, showAll]);

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await jobsApi.list({
        search: debouncedSearch || undefined,
        job_type: jobType || undefined,
        location: debouncedLocation || undefined,
        limit: 50,
      });
      setJobs(showAll ? res : res.filter((j: any) => j.status !== "live"));
    } catch { setJobs([]); }
    finally  { setLoading(false); }
  }

  async function handleApply(jobId: string) {
    setApplying(jobId);
    setApplyError("");
    try {
      await applicationsApi.apply(jobId);
      setApplied((s) => new Set([...s, jobId]));
    } catch (e: any) {
      if (e.message?.includes("Already applied")) {
        setApplied((s) => new Set([...s, jobId]));
      } else {
        setApplyError("Failed to apply. Please try again.");
      }
    } finally { setApplying(null); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .job-card { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .job-card:hover { border-color: #C7D7FE !important; box-shadow: 0 4px 20px rgba(37,99,235,0.07) !important; transform: translateY(-1px); }
        .apply-btn { transition: background 0.12s, transform 0.1s; }
        .apply-btn:hover:not(:disabled) { background: #4338CA !important; }
        .apply-btn:active:not(:disabled) { transform: scale(0.98); }
        .filter-input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; outline: none; }
        .skeleton { background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .nav-link:hover { color: #0F172A !important; }

        /* ── Desktop grid ── */
        .jobs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

        /* ── Desktop filter bar ── */
        .desktop-filter-bar { display: flex; }
        .mobile-filter-panel { display: none; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .desktop-nav-bar   { display: none !important; }
          .mobile-topbar     { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }

          /* Single column on mobile */
          .jobs-grid { grid-template-columns: 1fr !important; gap: 8px !important; }

          /* Hide desktop filter, show mobile panel */
          .desktop-filter-bar  { display: none !important; }
          .mobile-filter-panel { display: flex !important; }

          /* Main padding */
          .jobs-main { padding: 12px 14px 88px !important; }

          /* Job header */
          .jobs-header h1 { font-size: 20px !important; }

          /* Job cards: slightly more compact on mobile */
          .job-card { padding: 14px 16px !important; gap: 10px !important; }
        }

        /* ── Mobile filter panel ── */
        .mobile-filter-panel {
          flex-direction: column;
          gap: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 14px;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        /* ── Mobile search row ── */
        .mobile-search-row {
          display: none;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }
        @media (max-width: 768px) {
          .mobile-search-row { display: flex !important; }
        }
      `}</style>

      {/* ── Mobile Top Bar (with search) ── */}
      <MobileTopBar
        showSearch
        searchPlaceholder="Search jobs, companies..."
        onSearch={setSearch}
      />

      {/* ── Desktop Nav ── */}
      <nav className="desktop-nav-bar" style={{
        background: "#fff", borderBottom: "1px solid #E2E8F0",
        padding: "0 16px", height: 54,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            { href: "/dashboard",   label: "Dashboard" },
            { href: "/jobs",        label: "Jobs", active: true },
            { href: "/applications",label: "Applications" },
            { href: "/resume",      label: "Resume" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" style={{
              fontSize: 13, fontWeight: l.active ? 600 : 400,
              color: l.active ? "#4F46E5" : "#64748B",
              textDecoration: "none", padding: "6px 12px",
              borderRadius: 8, background: l.active ? "#EEF2FF" : "transparent",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="jobs-main" style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px", width: "100%" }}>

        {/* ── Header ── */}
        <div className="jobs-header" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>
                Job Board
              </h1>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4F46E5", background: "#EEF2FF", padding: "3px 10px", borderRadius: 20 }}>
                AI-ranked
              </span>
            </div>
            {/* Mobile filter toggle button */}
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                display: "none", // shown via @media in <style>
                padding: "7px 14px", borderRadius: 9,
                border: `1px solid ${showFilters ? "#4F46E5" : "#e2e8f0"}`,
                background: showFilters ? "#EEF2FF" : "#fff",
                color: showFilters ? "#4F46E5" : "#64748b",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
              className="mobile-filter-toggle"
            >
              ⚙ Filters
            </button>
          </div>
          <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 5 }}>
            {jobs.length} roles matched to your profile
          </p>
        </div>

        {/* ── Desktop Filter Bar ── */}
        <div className="desktop-filter-bar" style={{
          marginBottom: 20, background: "#fff", padding: "10px 14px",
          borderRadius: 12, border: "1px solid #E2E8F0", gap: 8, flexWrap: "wrap",
        }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="filter-input"
            style={{ padding: "8px 14px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", width: 220, background: "#F8FAFC", color: "#0F172A" }}
          />
          <select
            value={jobType} onChange={(e) => setJobType(e.target.value)}
            className="filter-input"
            style={{ padding: "8px 14px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", background: "#F8FAFC", color: "#374151", cursor: "pointer" }}
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : "All Types"}</option>
            ))}
          </select>
          <input
            value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="Location..."
            className="filter-input"
            style={{ padding: "8px 14px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", width: 150, background: "#F8FAFC", color: "#0F172A" }}
          />
          <button
            onClick={() => setShowAll(s => !s)}
            style={{ padding: "8px 16px", borderRadius: 9, border: `1px solid ${showAll ? "#E2E8F0" : "#C7D7FE"}`, background: showAll ? "#F8FAFC" : "#EEF2FF", color: showAll ? "#64748B" : "#4F46E5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {showAll ? "All Jobs" : "New Jobs"}
          </button>
        </div>

        {/* ── Mobile Filter Panel ── */}
        {showFilters && (
          <div className="mobile-filter-panel">
            <select
              value={jobType} onChange={(e) => setJobType(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: "#374151", width: "100%" }}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : "All Job Types"}</option>
              ))}
            </select>
            <input
              value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by location..."
              style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: "#0f172a", width: "100%", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowAll(true)}
                style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${showAll ? "#4F46E5" : "#e2e8f0"}`, background: showAll ? "#EEF2FF" : "#f8fafc", color: showAll ? "#4F46E5" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                All Jobs
              </button>
              <button
                onClick={() => setShowAll(false)}
                style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${!showAll ? "#4F46E5" : "#e2e8f0"}`, background: !showAll ? "#EEF2FF" : "#f8fafc", color: !showAll ? "#4F46E5" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                New Only
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {applyError && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
            {applyError}
          </div>
        )}

        {/* ── Job Grid / Skeleton / Empty ── */}
        {loading ? (
          <div className="jobs-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ borderRadius: 14, height: 130 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>No jobs found matching your filters</p>
            <button
              onClick={() => { setSearch(""); setJobType(""); setLocation(""); setShowAll(true); }}
              style={{ marginTop: 16, padding: "9px 20px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isApplied={applied.has(job.id)}
                isApplying={applying === job.id}
                onApply={() => handleApply(job.id)}
                toL={toL}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileBottomNav active="jobs" />
    </div>
  );
}

// ─────────────────────────────────────────
// JobCard
// ─────────────────────────────────────────
function JobCard({ job, isApplied, isApplying, onApply, toL }: {
  job: JobOut; isApplied: boolean; isApplying: boolean;
  onApply: () => void; toL: (v: number) => string;
}) {
  const company  = job.company_name || "Company";
  const ac       = avatarColor(company);
  const initials = getInitials(company);
  const score    = job.match_score != null ? Math.round(job.match_score) : null;
  const mc       = score != null ? matchColor(score) : null;

  return (
    <div className="job-card" style={{
      background: "#fff", border: "1px solid #E2E8F0",
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Top: avatar + title + score */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: ac.bg, color: ac.text,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em",
          border: `1px solid ${ac.text}22`,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
              {job.title}
            </h3>
          </Link>
          <p style={{ fontSize: 12, color: "#64748B" }}>{company}</p>
        </div>
        {score != null && mc && (
          <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: mc.text, background: mc.bg, border: `1px solid ${mc.border}`, padding: "3px 9px", borderRadius: 20 }}>
            {score}%
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Tag color="indigo">{job.job_type}</Tag>
        {job.location && <Tag color="slate">{job.location}</Tag>}
        {job.remote_ok && <Tag color="green">Remote OK</Tag>}
        {job.salary_min && (
          <Tag color="amber">₹{toL(job.salary_min)}{job.salary_max ? `–${toL(job.salary_max)}` : "+"}</Tag>
        )}
      </div>

      {/* Apply button */}
      <div style={{ marginTop: "auto", paddingTop: 2 }}>
        <button
          onClick={isApplied ? undefined : onApply}
          disabled={isApplying}
          className={isApplied ? undefined : "apply-btn"}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 9,
            border: isApplied ? "1.5px solid #BBF7D0" : "none",
            cursor: isApplied ? "default" : "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            background: isApplied ? "#F0FDF4" : isApplying ? "#A5B4FC" : "#4F46E5",
            color: isApplied ? "#15803D" : "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {isApplied ? "✓ Applied" : isApplying ? "Applying..." : "Quick Apply"}
        </button>
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: "indigo" | "slate" | "green" | "amber" }) {
  const styles = {
    indigo: { bg: "#EEF2FF", text: "#4338CA" },
    slate:  { bg: "#F1F5F9", text: "#475569" },
    green:  { bg: "#F0FDF4", text: "#15803D" },
    amber:  { bg: "#FFFBEB", text: "#92400E" },
  };
  const s = styles[color];
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.text }}>
      {children}
    </span>
  );
}