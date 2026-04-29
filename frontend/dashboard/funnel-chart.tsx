"use client";

const STAGE_ORDER = [
  "applied",
  "ats_screening",
  "round_1",
  "round_2",
  "round_3",
  "hr_round",
  "offer",
  "selected",
  "ats_rejected",
];

const STAGE_LABELS: Record<string, string> = {
  applied:       "Applied",
  ats_screening: "ATS Screen",
  round_1:       "Round 1",
  round_2:       "Round 2",
  round_3:       "Round 3",
  hr_round:      "HR Round",
  offer:         "Offer",
  selected:      "Selected",
  ats_rejected:  "Rejected",
};

const STAGE_COLORS: Record<string, string> = {
  selected:      "#00ff87",
  offer:         "#00ff87",
  hr_round:      "#60a5fa",
  round_1:       "#60a5fa",
  round_2:       "#60a5fa",
  round_3:       "#60a5fa",
  ats_rejected:  "#ef4444",
  applied:       "#555",
  ats_screening: "#f59e0b",
};

interface Props {
  breakdown: Record<string, number>;
}

export default function FunnelChart({ breakdown }: Props) {
  const stages    = STAGE_ORDER.filter((s) => (breakdown[s] ?? 0) > 0);
  const maxCount  = Math.max(...stages.map((s) => breakdown[s] ?? 0), 1);
  const total     = breakdown["applied"] ?? 1;

  if (stages.length === 0) {
    return (
      <div
        style={{
          textAlign:  "center",
          padding:    "40px 0",
          color:      "#2a2a2a",
          fontSize:   13,
        }}
      >
        No pipeline data yet
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {stages.map((stage) => {
        const count  = breakdown[stage] ?? 0;
        const pct    = (count / maxCount) * 100;
        const convPct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color  = STAGE_COLORS[stage] ?? "#555";

        return (
          <div key={stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Label */}
            <span
              style={{
                fontSize:      11,
                color:         "#444",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                width:         96,
                flexShrink:    0,
              }}
            >
              {STAGE_LABELS[stage] ?? stage.replace(/_/g, " ")}
            </span>

            {/* Bar */}
            <div
              style={{
                flex:         1,
                height:       22,
                background:   "#141414",
                borderRadius: 2,
                overflow:     "hidden",
                position:     "relative",
              }}
            >
              <div
                style={{
                  width:           `${Math.max(pct, 3)}%`,
                  height:          "100%",
                  background:      color + "22",
                  borderLeft:      `2px solid ${color}`,
                  borderRadius:    2,
                  transition:      "width 0.7s ease",
                  display:         "flex",
                  alignItems:      "center",
                  paddingLeft:     8,
                }}
              />
            </div>

            {/* Count */}
            <span
              style={{
                fontSize:   13,
                fontWeight: 700,
                color:      "#fff",
                width:      28,
                textAlign:  "right",
                flexShrink: 0,
              }}
            >
              {count}
            </span>

            {/* Conversion % */}
            <span
              style={{
                fontSize:   10,
                color:      "#2a2a2a",
                width:      36,
                textAlign:  "right",
                flexShrink: 0,
              }}
            >
              {convPct}%
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          marginTop:     12,
          paddingTop:    12,
          borderTop:     "1px solid #141414",
          display:       "flex",
          justifyContent:"flex-end",
          gap:           16,
        }}
      >
        {[
          { label: "Progressing", color: "#60a5fa" },
          { label: "Selected",    color: "#00ff87" },
          { label: "Rejected",    color: "#ef4444" },
        ].map(({ label, color }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width:        8,
                height:       8,
                borderRadius: "50%",
                background:   color,
              }}
            />
            <span style={{ fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}