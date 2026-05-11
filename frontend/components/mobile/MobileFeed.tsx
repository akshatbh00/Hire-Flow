// frontend/components/mobile/pages/MobileFeed.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { jobsApi, applicationsApi, JobOut } from "@/lib/api";

function toL(val: number) {
  const l = val / 100000;
  return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#1E1B4B", text: "#818CF8" },
  { bg: "#1A1040", text: "#A78BFA" },
  { bg: "#0F2A1F", text: "#34D399" },
  { bg: "#1A1000", text: "#FCD34D" },
  { bg: "#0F1F3D", text: "#60A5FA" },
  { bg: "#1F0F3D", text: "#C084FC" },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SEARCH_PLACEHOLDERS = [
  "Search for 'AI Engineer'",
  "Search for 'Remote Jobs'",
  "Search for 'Python'",
  "Search for 'Product Manager'",
];

export default function MobileFeed() {
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [appCount, setAppCount] = useState(0);

  // Cycle search placeholder like Naukri
  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    applicationsApi.list()
      .then((apps) => {
        setApplied(new Set(apps.map((a) => a.job_id)));
        setAppCount(apps.length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    jobsApi.list({ limit: 20 })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleApply(jobId: string) {
    setApplying(jobId);
    try {
      await applicationsApi.apply(jobId);
      setApplied((s) => new Set([...s, jobId]));
      setAppCount((c) => c + 1);
    } catch (e: any) {
      if (e.message?.includes("Already applied")) {
        setApplied((s) => new Set([...s, jobId]));
      }
    } finally {
      setApplying(null);
    }
  }

  const featuredJobs = jobs.slice(0, 6);
  const matchedJobs = jobs.slice(6, 12);

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F1F5F9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .mob-card { transition: transform 0.15s, border-color 0.15s; }
        .mob-card:active { transform: scale(0.98); }
        .mob-apply-btn { transition: background 0.12s, transform 0.1s; }
        .mob-apply-btn:active { transform: scale(0.96); }
        .skeleton-dark { background: linear-gradient(90deg, #12121A 25%, #1A1A28 50%, #12121A 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .placeholder-fade { animation: fadeInUp 0.4s ease; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .scroll-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .scroll-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top Bar */}
      <div style={{
        padding: "16px 16px 12px",
        background: "#0A0A0F",
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid #1E1E2E",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#F1F5F9" }}>
            Hire<span style={{ color: "#6366F1" }}>Flow</span>
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>
            A
          </div>
        </div>

        {/* Search Bar */}
        <Link href="/jobs" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#12121A",
            border: "1px solid #1E1E2E",
            borderRadius: 12,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span key={placeholderIdx} className="placeholder-fade" style={{ fontSize: 13, color: "#475569" }}>
              {SEARCH_PLACEHOLDERS[placeholderIdx]}
            </span>
          </div>
        </Link>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 10 }}>
          <StatCard value={jobs.length} label="Matched Jobs" color="#6366F1" />
          <StatCard value={appCount} label="Applications" color="#10B981" />
          <StatCard value={4} label="NVites" color="#F59E0B" />
        </div>

        {/* Jobs Based on Profile */}
        <Section title="Jobs for you" count={featuredJobs.length} href="/jobs">
          {loading ? (
            <div className="scroll-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-dark" style={{
                  minWidth: 220, height: 140, borderRadius: 14, flexShrink: 0,
                }} />
              ))}
            </div>
          ) : (
            <div className="scroll-row">
              {featuredJobs.map((job) => (
                <MobileJobCard
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
        </Section>

        {/* AI Matches Banner */}
        <Link href="/applications" style={{ textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #2D1B69 100%)",
            borderRadius: 16,
            padding: "18px 20px",
            border: "1px solid #3730A3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#E0E7FF", marginBottom: 4 }}>
                ✨ AI Match Score
              </p>
              <p style={{ fontSize: 12, color: "#818CF8", lineHeight: 1.4 }}>
                See how well your profile matches each role
              </p>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(99,102,241,0.2)",
              border: "2px solid #6366F1",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#818CF8",
              flexShrink: 0,
            }}>
              VIEW
            </div>
          </div>
        </Link>

        {/* More Matches */}
        {matchedJobs.length > 0 && (
          <Section title="You might like" count={matchedJobs.length} href="/jobs">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matchedJobs.map((job) => (
                <MobileJobRow
                  key={job.id}
                  job={job}
                  isApplied={applied.has(job.id)}
                  isApplying={applying === job.id}
                  onApply={() => handleApply(job.id)}
                  toL={toL}
                />
              ))}
            </div>
          </Section>
        )}

        {/* KAREN AI Banner */}
        <div style={{
          background: "#0F172A",
          borderRadius: 16,
          padding: "18px 20px",
          border: "1px solid #1E293B",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>
            70% hiring happens without job posts
          </p>
          <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            Top companies reach out directly. Keep your profile updated to get noticed.
          </p>
          <Link href="/resume" style={{
            display: "inline-block",
            marginTop: 12,
            fontSize: 12,
            fontWeight: 600,
            color: "#6366F1",
            textDecoration: "none",
          }}>
            Update Profile →
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      flex: 1,
      background: "#12121A",
      border: "1px solid #1E1E2E",
      borderRadius: 14,
      padding: "14px 12px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.03em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function Section({ title, count, href, children }: {
  title: string; count: number; href: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>{title}</span>
          <span style={{ fontSize: 12, color: "#475569" }}>({count})</span>
        </div>
        <Link href={href} style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", textDecoration: "none" }}>
          View all
        </Link>
      </div>
      {children}
    </div>
  );
}

function MobileJobCard({ job, isApplied, isApplying, onApply, toL }: {
  job: JobOut; isApplied: boolean; isApplying: boolean;
  onApply: () => void; toL: (v: number) => string;
}) {
  const company = job.company_name || "Company";
  const ac = avatarColor(company);
  const initials = getInitials(company);
  const score = job.match_score != null ? Math.round(job.match_score) : null;

  return (
    <div className="mob-card" style={{
      minWidth: 220,
      flexShrink: 0,
      background: "#12121A",
      border: "1px solid #1E1E2E",
      borderRadius: 14,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: ac.bg, color: ac.text,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: "#F1F5F9",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {job.title}
          </p>
          <p style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{company}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {job.location && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#1E1E2E", color: "#64748B" }}>
            📍 {job.location}
          </span>
        )}
        {score != null && (
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20,
            background: score >= 80 ? "#0F2A1F" : "#1E1B4B",
            color: score >= 80 ? "#34D399" : "#818CF8",
            fontWeight: 600,
          }}>
            {score}% match
          </span>
        )}
        {job.salary_min && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#1A1000", color: "#FCD34D" }}>
            ₹{toL(job.salary_min)}{job.salary_max ? `–${toL(job.salary_max)}` : "+"}
          </span>
        )}
      </div>

      <button
        onClick={isApplied ? undefined : onApply}
        disabled={isApplying}
        className={isApplied ? undefined : "mob-apply-btn"}
        style={{
          width: "100%", padding: "8px 0", borderRadius: 9,
          border: isApplied ? "1px solid #065F46" : "none",
          cursor: isApplied ? "default" : "pointer",
          fontFamily: "inherit", fontSize: 12, fontWeight: 600,
          background: isApplied ? "#0F2A1F" : isApplying ? "#3730A3" : "#4F46E5",
          color: isApplied ? "#34D399" : "#fff",
        }}
      >
        {isApplied ? "✓ Applied" : isApplying ? "Applying..." : "Quick Apply"}
      </button>
    </div>
  );
}

function MobileJobRow({ job, isApplied, isApplying, onApply, toL }: {
  job: JobOut; isApplied: boolean; isApplying: boolean;
  onApply: () => void; toL: (v: number) => string;
}) {
  const company = job.company_name || "Company";
  const ac = avatarColor(company);
  const initials = getInitials(company);
  const score = job.match_score != null ? Math.round(job.match_score) : null;

  return (
    <div className="mob-card" style={{
      background: "#12121A",
      border: "1px solid #1E1E2E",
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: ac.bg, color: ac.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "#F1F5F9",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {job.title}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#475569" }}>{company}</span>
          {score != null && (
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 20,
              background: score >= 80 ? "#0F2A1F" : "#1E1B4B",
              color: score >= 80 ? "#34D399" : "#818CF8",
              fontWeight: 600,
            }}>
              {score}%
            </span>
          )}
        </div>
      </div>

      <button
        onClick={isApplied ? undefined : onApply}
        disabled={isApplying}
        className={isApplied ? undefined : "mob-apply-btn"}
        style={{
          flexShrink: 0,
          padding: "7px 14px",
          borderRadius: 9,
          border: isApplied ? "1px solid #065F46" : "none",
          cursor: isApplied ? "default" : "pointer",
          fontFamily: "inherit", fontSize: 11, fontWeight: 600,
          background: isApplied ? "#0F2A1F" : isApplying ? "#3730A3" : "#4F46E5",
          color: isApplied ? "#34D399" : "#fff",
        }}
      >
        {isApplied ? "✓" : isApplying ? "..." : "Apply"}
      </button>
    </div>
  );
}