"use client";
//frontend/app/(user)/applications/page.tsx
import { useEffect, useState } from "react";
import { applicationsApi, ApplicationOut } from "@/lib/api";
import StageTracker from "@/components/dashboard/stage-tracker";
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

export default function ApplicationsPage() {
  const [apps,     setApps]     = useState<ApplicationOut[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<ApplicationOut | null>(null);
  const [history,  setHistory]  = useState<any[]>([]);

  useEffect(() => {
    applicationsApi.list()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(app: ApplicationOut) {
    setSelected(app);
    try {
      const h = await applicationsApi.history(app.id);
      setHistory(h);
    } catch { setHistory([]); }
  }

  async function handleWithdraw(appId: string) {
    try {
      await applicationsApi.withdraw(appId);
      setApps((prev) => prev.filter((a) => a.id !== appId));
      setSelected(null);
    } catch {}
  }

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

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            My Applications
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            {apps.length} total · full pipeline transparency
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 80 }} />
            ))}
          </div>

        ) : apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>No applications yet</p>
            <Link href="/jobs" style={{ display: "inline-block", padding: "10px 24px", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Browse Jobs →
            </Link>
          </div>

        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 20 }}>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {apps.map((app) => {
                const cfg = STAGE_CONFIG[app.current_stage] ?? STAGE_CONFIG.applied;
                const isSelected = selected?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => openDetail(app)}
                    style={{
                      textAlign:    "left",
                      border:       `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                      borderRadius: 14,
                      padding:      "14px 16px",
                      background:   isSelected ? "#eff6ff" : "#fff",
                      cursor:       "pointer",
                      transition:   "all 0.15s",
                      boxShadow:    isSelected ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                      fontFamily:   "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {app.job_title}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>{app.company_name}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>
                    {app.match_score != null && (
                      <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 8 }}>
                        {Math.round(app.match_score)}% match
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            <div>
              {selected ? (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", position: "sticky", top: 76 }}>

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        {selected.job_title}
                      </h2>
                      <p style={{ fontSize: 13, color: "#64748b" }}>{selected.company_name}</p>
                    </div>
                    <button
                      onClick={() => handleWithdraw(selected.id)}
                      style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 8px", borderRadius: 6, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                    >
                      Withdraw
                    </button>
                  </div>

                  {/* Scores */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Match Score",      val: selected.match_score      ? `${Math.round(selected.match_score)}%`      : "—", color: "#16a34a" },
                      { label: "Benchmark Score",  val: selected.benchmark_score  ? `${Math.round(selected.benchmark_score)}%`  : "—", color: "#2563eb" },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                        <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Pipeline</p>
                    <StageTracker
                      currentStage={selected.current_stage}
                      highestStage={selected.highest_stage}
                      rejected={selected.current_stage === "ats_rejected"}
                    />
                  </div>

                  {/* History */}
                  {history.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Full History</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {history.map((h, i) => (
                          <div key={i} style={{ display: "flex", gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 5, flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 13, color: "#374151" }}>
                                <span style={{ color: "#94a3b8" }}>{h.from_stage?.replace(/_/g, " ")}</span>
                                <span style={{ color: "#cbd5e1" }}> → </span>
                                <span style={{ fontWeight: 600 }}>{h.to_stage?.replace(/_/g, " ")}</span>
                              </p>
                              {h.notes && (
                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontStyle: "italic" }}>"{h.notes}"</p>
                              )}
                              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                {new Date(h.moved_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ border: "2px dashed #e2e8f0", borderRadius: 16, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#cbd5e1", fontSize: 14 }}>Select an application to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}