"use client";

import ScoreRing from "@/components/dashboard/score-ring";

interface AtsReport {
  score:            number;
  breakdown:        Record<string, number>;
  issues:           string[];
  missing_sections: string[];
}

interface Props {
  report: AtsReport;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  sections:  "Sections",
  keywords:  "Keywords",
  format:    "Formatting",
  length:    "Length",
  clarity:   "Clarity",
};

const BREAKDOWN_MAX: Record<string, number> = {
  sections: 25, keywords: 35, format: 20, length: 10, clarity: 10,
};

export default function AtsScoreDisplay({ report }: Props) {
  return (
    <div className="border border-[#1e1e1e] bg-[#0f0f0f] rounded-sm p-6 space-y-6">

      {/* Header row */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-white text-sm font-medium uppercase tracking-widest mb-1">
            ATS Score
          </h3>
          <p className="text-[#444] text-xs">
            How well your resume passes automated screening
          </p>
        </div>
        <ScoreRing score={Math.round(report.score)} label="ATS" size={90} />
      </div>

      {/* Breakdown bars */}
      <div className="space-y-3">
        {Object.entries(report.breakdown).map(([key, val]) => {
          const max     = BREAKDOWN_MAX[key] ?? 20;
          const pct     = (val / max) * 100;
          const barColor = pct >= 70 ? "#00ff87" : pct >= 40 ? "#f59e0b" : "#ef4444";

          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-[#666] text-xs uppercase tracking-wider">
                  {BREAKDOWN_LABELS[key] ?? key}
                </span>
                <span className="text-[#888] text-xs">
                  {val}/{max}
                </span>
              </div>
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Issues */}
      {report.issues?.length > 0 && (
        <div>
          <p className="text-[#555] text-xs uppercase tracking-widest mb-2">Issues Found</p>
          <ul className="space-y-1.5">
            {report.issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#888]">
                <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing sections */}
      {report.missing_sections?.length > 0 && (
        <div>
          <p className="text-[#555] text-xs uppercase tracking-widest mb-2">Missing Sections</p>
          <div className="flex flex-wrap gap-1.5">
            {report.missing_sections.map((s) => (
              <span key={s} className="px-2 py-1 bg-amber-950/40 border border-amber-900/40 text-amber-400 text-xs rounded-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}