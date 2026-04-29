"use client";

import { CompanyStats } from "@/lib/api";

interface Props {
  stats: CompanyStats;
  breakdown: Record<string, number>;
}

export default function StatsCards({ stats, breakdown }: Props) {
  const inPipeline = Object.entries(breakdown)
    .filter(([s]) => !["applied", "ats_rejected", "withdrawn"].includes(s))
    .reduce((a, [, v]) => a + v, 0);

  const cards = [
    {
      label: "Active Jobs",
      value: stats.active_jobs,
      sub:   "Open roles",
      color: "#00ff87",
    },
    {
      label: "Total Applicants",
      value: stats.total_applicants,
      sub:   "Across all roles",
      color: "#fff",
    },
    {
      label: "In Pipeline",
      value: inPipeline,
      sub:   "Active candidates",
      color: "#60a5fa",
    },
    {
      label: "Selected",
      value: breakdown["selected"] ?? 0,
      sub:   "Hired this cycle",
      color: breakdown["selected"] ? "#00ff87" : "#333",
    },
  ];

  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 12,
      }}
    >
      {cards.map(({ label, value, sub, color }) => (
        <div
          key={label}
          style={{
            border:       "1px solid #1e1e1e",
            background:   "#0f0f0f",
            borderRadius: 2,
            padding:      "20px 18px",
          }}
        >
          <p
            style={{
              fontSize:      11,
              color:         "#444",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom:  12,
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize:      32,
              fontWeight:    700,
              color,
              letterSpacing: "-0.02em",
              lineHeight:    1,
              marginBottom:  6,
            }}
          >
            {value}
          </p>
          <p style={{ fontSize: 11, color: "#2a2a2a" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}