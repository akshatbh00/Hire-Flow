"use client";

import { CandidateOut } from "@/lib/api";

interface Props {
  candidates: CandidateOut[];
  onClose: () => void;
}

export default function CandidateComparison({ candidates, onClose }: Props) {
  if (candidates.length === 0) return null;

  const metrics = [
    { label: "Match Score", key: "match_score", format: (v: number) => `${Math.round(v)}%`, color: (v: number) => v >= 70 ? "#16a34a" : v >= 50 ? "#f59e0b" : "#dc2626" },
    { label: "ATS Score",   key: "ats_score",   format: (v: number) => `${Math.round(v)}`,  color: (v: number) => v >= 70 ? "#2563eb" : "#94a3b8" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px", maxWidth: 800, width: "100%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Comparing {candidates.length} Candidates
          </h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Comparison grid */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${candidates.length}, 1fr)`, gap: 14 }}>
          {candidates.map((c) => (
            <div key={c.user_id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px", textAlign: "center" }}>

              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                {c.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{c.full_name}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, wordBreak: "break-all" }}>{c.email}</p>

              {/* Metrics */}
              {metrics.map(({ label, key, format, color }) => {
                const val = (c as any)[key];
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: val != null ? color(val) : "#94a3b8" }}>
                      {val != null ? format(val) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Winner highlight */}
        {candidates.length > 1 && (() => {
          const best = candidates.reduce((a, b) => (a.match_score ?? 0) > (b.match_score ?? 0) ? a : b);
          return (
            <div style={{ marginTop: 20, padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Best Match</p>
                <p style={{ fontSize: 13, color: "#374151" }}>{best.full_name} — {Math.round(best.match_score ?? 0)}% match score</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}