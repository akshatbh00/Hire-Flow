"use client";

import { useState } from "react";

const JOB_TYPES = ["fulltime", "parttime", "contract", "internship", "remote"] as const;

const POPULAR_TITLES = [
  "Software Engineer", "Product Manager", "Data Scientist",
  "Frontend Developer", "Backend Developer", "DevOps Engineer",
  "UI/UX Designer", "Business Analyst", "Marketing Manager",
  "Sales Executive", "HR Manager", "Finance Analyst",
];

interface Props {
  onNext: (data: { job_titles: string[]; job_type: string }) => void;
}

export default function StepJobType({ onNext }: Props) {
  const [selectedTitles, setTitles] = useState<string[]>([]);
  const [customTitle,    setCustom] = useState("");
  const [jobType,        setJobType] = useState("fulltime");

  function toggleTitle(t: string) {
    setTitles((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function addCustom() {
    const trimmed = customTitle.trim();
    if (trimmed && !selectedTitles.includes(trimmed)) {
      setTitles((p) => [...p, trimmed]);
      setCustom("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>
          What kind of work are you looking for?
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          Select all that apply. You can change this later.
        </p>
      </div>

      {/* Target roles */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 12 }}>
          Target Roles
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {POPULAR_TITLES.map((t) => {
            const active = selectedTitles.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTitle(t)}
                style={{
                  padding:      "6px 14px",
                  fontSize:     13,
                  fontWeight:   active ? 600 : 400,
                  border:       `1px solid ${active ? "#2563eb" : "#e2e8f0"}`,
                  borderRadius: 8,
                  background:   active ? "#eff6ff" : "#fff",
                  color:        active ? "#2563eb" : "#64748b",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                  fontFamily:   "inherit",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Selected custom tags */}
        {selectedTitles.filter((t) => !POPULAR_TITLES.includes(t)).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {selectedTitles
              .filter((t) => !POPULAR_TITLES.includes(t))
              .map((t) => (
                <span
                  key={t}
                  style={{
                    padding:      "4px 10px",
                    fontSize:     12,
                    fontWeight:   600,
                    background:   "#eff6ff",
                    color:        "#2563eb",
                    border:       "1px solid #bfdbfe",
                    borderRadius: 8,
                    display:      "flex",
                    alignItems:   "center",
                    gap:          6,
                  }}
                >
                  {t}
                  <span
                    onClick={() => toggleTitle(t)}
                    style={{ cursor: "pointer", opacity: 0.6, fontSize: 14, lineHeight: 1 }}
                  >
                    ×
                  </span>
                </span>
              ))}
          </div>
        )}

        {/* Custom input */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={customTitle}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add custom role..."
            style={{
              flex:         1,
              padding:      "9px 14px",
              border:       "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize:     13,
              color:        "#0f172a",
              outline:      "none",
              fontFamily:   "inherit",
              background:   "#f8fafc",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              padding:      "9px 18px",
              border:       "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize:     13,
              fontWeight:   500,
              color:        "#64748b",
              background:   "#fff",
              cursor:       "pointer",
              fontFamily:   "inherit",
              transition:   "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Employment type */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 12 }}>
          Employment Type
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {JOB_TYPES.map((t) => {
            const active = jobType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setJobType(t)}
                style={{
                  padding:      "8px 18px",
                  fontSize:     12,
                  fontWeight:   active ? 700 : 400,
                  border:       `1px solid ${active ? "#2563eb" : "#e2e8f0"}`,
                  borderRadius: 8,
                  background:   active ? "#2563eb" : "#fff",
                  color:        active ? "#fff" : "#64748b",
                  cursor:       "pointer",
                  textTransform:"uppercase",
                  letterSpacing:"0.06em",
                  fontFamily:   "inherit",
                  transition:   "all 0.15s",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNext({ job_titles: selectedTitles, job_type: jobType })}
        disabled={selectedTitles.length === 0}
        style={{
          width:        "100%",
          padding:      "13px",
          background:   selectedTitles.length === 0 ? "#e2e8f0" : "#2563eb",
          color:        selectedTitles.length === 0 ? "#94a3b8" : "#fff",
          border:       "none",
          borderRadius: 12,
          fontSize:     14,
          fontWeight:   700,
          cursor:       selectedTitles.length === 0 ? "not-allowed" : "pointer",
          fontFamily:   "inherit",
          letterSpacing:"0.02em",
          transition:   "all 0.15s",
        }}
      >
        Continue →
      </button>
    </div>
  );
}