"use client";

import CandidateCard from "./candidate-card";

interface Props {
  stage:      string;
  candidates: any[];
  allStages:  string[];
  onMove:     (appId: string, toStage: string) => void;
}

const COLUMN_CONFIG: Record<string, { color: string; bg: string }> = {
  selected:      { color: "#16a34a", bg: "#f0fdf4" },
  offer:         { color: "#16a34a", bg: "#f0fdf4" },
  hr_round:      { color: "#2563eb", bg: "#eff6ff" },
  round_1:       { color: "#2563eb", bg: "#eff6ff" },
  round_2:       { color: "#2563eb", bg: "#eff6ff" },
  round_3:       { color: "#2563eb", bg: "#eff6ff" },
  ats_rejected:  { color: "#dc2626", bg: "#fef2f2" },
  ats_screening: { color: "#b45309", bg: "#fffbeb" },
  applied:       { color: "#64748b", bg: "#f8fafc" },
  withdrawn:     { color: "#94a3b8", bg: "#f8fafc" },
};

export default function KanbanColumn({ stage, candidates, allStages, onMove }: Props) {
  const cfg = COLUMN_CONFIG[stage] ?? { color: "#64748b", bg: "#f8fafc" };

  return (
    <div style={{
      flexShrink:   0,
      width:        224,
      background:   "#fff",
      border:       "1px solid #e2e8f0",
      borderRadius: 14,
      overflow:     "hidden",
      borderTop:    `3px solid ${cfg.color}`,
    }}>

      {/* Column header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {stage.replace(/_/g, " ")}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: cfg.color, padding: "2px 8px", borderRadius: 20, minWidth: 20, textAlign: "center" }}>
          {candidates.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ padding: 10, minHeight: 200, maxHeight: "calc(100vh - 280px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {candidates.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
            <p style={{ fontSize: 12, color: "#cbd5e1" }}>No candidates</p>
          </div>
        ) : (
          candidates.map((c) => (
            <CandidateCard
              key={c.application_id}
              candidate={c}
              stages={allStages.filter((s) => s !== stage)}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </div>
  );
}