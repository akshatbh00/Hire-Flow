"use client";

interface Props {
  candidate: {
    application_id:  string;
    user_id:         string;
    match_score:     number | null;
    benchmark_score: number | null;
    applied_at:      string;
    full_name?:      string;
    ats_score?:      number;
  };
  onMove:  (appId: string, stage: string) => void;
  stages:  string[];
}

export default function CandidateCard({ candidate, onMove, stages }: Props) {
  const initials = candidate.full_name
    ? candidate.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={{
      background:   "#fff",
      border:       "1px solid #e2e8f0",
      borderRadius: 10,
      padding:      "12px",
      transition:   "all 0.15s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.08)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* Name row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {initials}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {candidate.full_name ?? `User ${candidate.user_id.slice(0, 6)}`}
        </p>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {candidate.match_score != null && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
            {Math.round(candidate.match_score)}% match
          </span>
        )}
        {candidate.ats_score != null && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#2563eb" }}>
            ATS {Math.round(candidate.ats_score)}
          </span>
        )}
      </div>

      {/* Applied date */}
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
        {new Date(candidate.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </p>

      {/* Move dropdown */}
      <select
        onChange={(e) => { if (e.target.value) { onMove(candidate.application_id, e.target.value); e.target.value = ""; } }}
        defaultValue=""
        style={{ width: "100%", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#374151", background: "#f8fafc", cursor: "pointer", fontFamily: "inherit", outline: "none" }}
      >
        <option value="" disabled>Move to...</option>
        {stages.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
}