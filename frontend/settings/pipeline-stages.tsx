"use client";

import { useState } from "react";

const DEFAULT_STAGES = [
  { key: "applied",       label: "Applied",       color: "#64748b", locked: true },
  { key: "ats_screening", label: "ATS Screening", color: "#b45309", locked: true },
  { key: "round_1",       label: "Round 1",       color: "#2563eb", locked: false },
  { key: "round_2",       label: "Round 2",       color: "#2563eb", locked: false },
  { key: "round_3",       label: "Round 3",       color: "#2563eb", locked: false },
  { key: "hr_round",      label: "HR Round",      color: "#7c3aed", locked: false },
  { key: "offer",         label: "Offer",         color: "#16a34a", locked: true },
  { key: "selected",      label: "Selected",      color: "#16a34a", locked: true },
  { key: "ats_rejected",  label: "Rejected",      color: "#dc2626", locked: true },
];

export default function PipelineStages() {
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [saved,  setSaved]  = useState(false);

  function toggleStage(key: string) {
    setStages((prev) =>
      prev.map((s) => s.key === key ? { ...s, active: !s } : s)
    );
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Pipeline Stages
        </h3>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Configure which stages appear in your hiring pipeline.
          Locked stages cannot be removed.
        </p>
      </div>

      {saved && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 13, color: "#16a34a" }}>
          ✓ Pipeline stages saved
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {stages.map((stage, i) => (
          <div
            key={stage.key}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}
          >
            {/* Order number */}
            <span style={{ fontSize: 12, color: "#94a3b8", width: 20, textAlign: "center", flexShrink: 0 }}>
              {i + 1}
            </span>

            {/* Color dot */}
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />

            {/* Label */}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", flex: 1 }}>
              {stage.label}
            </span>

            {/* Locked badge */}
            {stage.locked ? (
              <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                locked
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 6 }}>
                active
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        Save Pipeline
      </button>
    </div>
  );
}