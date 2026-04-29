"use client";

import { useEffect, useState } from "react";
import { applicationsApi, ApplicationOut } from "@/lib/api";
import Link from "next/link";

const STAGE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  selected:      { bg: "#f0fdf4", color: "#16a34a", label: "Selected" },
  offer:         { bg: "#f0fdf4", color: "#16a34a", label: "Offer" },
  hr_round:      { bg: "#eff6ff", color: "#2563eb", label: "HR Round" },
  round_1:       { bg: "#eff6ff", color: "#2563eb", label: "Round 1" },
  round_2:       { bg: "#eff6ff", color: "#2563eb", label: "Round 2" },
  round_3:       { bg: "#eff6ff", color: "#2563eb", label: "Round 3" },
  ats_rejected:  { bg: "#fef2f2", color: "#dc2626", label: "Rejected" },
  ats_screening: { bg: "#fffbeb", color: "#b45309", label: "Screening" },
  applied:       { bg: "#f1f5f9", color: "#475569", label: "Applied" },
  withdrawn:     { bg: "#f1f5f9", color: "#94a3b8", label: "Withdrawn" },
};

export default function AppliedJobsPage() {
  const [apps,    setApps]    = useState<ApplicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    applicationsApi.list()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? apps
    : apps.filter((a) => a.current_stage === filter);

  const stages = [...new Set(apps.map((a) => a.current_stage))];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { href: "/dashboard",    label: "Dashboard" },
            { href: "/jobs",         label: "Jobs" },
            { href: "/applications", label: "Applications", active: true },
            { href: "/resume",       label: "Resume" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: l.active ? 600 : 400, color: l.active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Applied Jobs</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{apps.length} applications</p>
        </div>

        {/* Stage filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setFilter("all")}
            style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === "all" ? "#2563eb" : "#e2e8f0"}`, background: filter === "all" ? "#eff6ff" : "#fff", color: filter === "all" ? "#2563eb" : "#64748b", fontSize: 13, fontWeight: filter === "all" ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}
          >
            All ({apps.length})
          </button>
          {stages.map((s) => {
            const cfg = STAGE_CONFIG[s] ?? STAGE_CONFIG.applied;
            const count = apps.filter((a) => a.current_stage === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === s ? cfg.color : "#e2e8f0"}`, background: filter === s ? cfg.bg : "#fff", color: filter === s ? cfg.color : "#64748b", fontSize: 13, fontWeight: filter === s ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 80 }} />
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>No applications found</p>
            <Link href="/jobs" style={{ display: "inline-block", padding: "10px 24px", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Browse Jobs →
            </Link>
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((app) => {
              const cfg = STAGE_CONFIG[app.current_stage] ?? STAGE_CONFIG.applied;
              return (
                <Link key={app.id} href="/applications" style={{ textDecoration: "none" }}>
                  <div
                    style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {app.job_title}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b" }}>{app.company_name}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      {app.match_score != null && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                          {Math.round(app.match_score)}%
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}