"use client";

const STAGES = [
  { key: "applied",       label: "Applied" },
  { key: "ats_screening", label: "ATS" },
  { key: "round_1",       label: "Round 1" },
  { key: "round_2",       label: "Round 2" },
  { key: "round_3",       label: "Round 3" },
  { key: "hr_round",      label: "HR" },
  { key: "offer",         label: "Offer" },
  { key: "selected",      label: "Selected" },
] as const;

const STAGE_KEYS = STAGES.map((s) => s.key);

interface Props {
  currentStage:  string;
  highestStage:  string;
  rejected?:     boolean;
}

export default function StageTracker({ currentStage, highestStage, rejected }: Props) {
  const highestIdx = STAGE_KEYS.indexOf(highestStage as any);
  const currentIdx = STAGE_KEYS.indexOf(currentStage as any);

  if (rejected || currentStage === "ats_rejected") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-950/30 border border-red-900/40 rounded-sm">
        <span className="text-red-400 text-xs uppercase tracking-widest font-bold">
          ✕ ATS Rejected
        </span>
        <span className="text-[#444] text-xs">
          — Improve your resume using HireFlow suggestions
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Stage pills row */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isPast    = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture  = i > currentIdx;
          const isHighest = i === highestIdx;

          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              {/* Node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full border transition-all ${
                  isCurrent
                    ? "bg-[#00ff87] border-[#00ff87] shadow-[0_0_8px_#00ff87]"
                    : isPast
                    ? "bg-[#00ff87]/40 border-[#00ff87]/40"
                    : "bg-transparent border-[#333]"
                }`} />
                <span className={`text-[9px] uppercase tracking-wider hidden sm:block ${
                  isCurrent ? "text-[#00ff87]" :
                  isPast    ? "text-[#444]"    : "text-[#2a2a2a]"
                }`}>
                  {stage.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-px mx-0.5 ${
                  isPast ? "bg-[#00ff87]/30" : "bg-[#1e1e1e]"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage label */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[#555] text-xs">Currently at</span>
        <span className="text-[#00ff87] text-xs font-bold uppercase tracking-widest">
          {STAGES.find((s) => s.key === currentStage)?.label ?? currentStage}
        </span>
        {highestStage !== currentStage && (
          <>
            <span className="text-[#333] text-xs">· Best reached</span>
            <span className="text-[#888] text-xs uppercase tracking-widest">
              {STAGES.find((s) => s.key === highestStage)?.label ?? highestStage}
            </span>
          </>
        )}
      </div>
    </div>
  );
}