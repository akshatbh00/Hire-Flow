"use client";

interface Props {
  score: number;       // 0–100
  label: string;
  size?: number;
  color?: string;
}

export default function ScoreRing({
  score,
  label,
  size = 120,
  color = "#00ff87",
}: Props) {
  const r         = (size / 2) - 10;
  const circ      = 2 * Math.PI * r;
  const filled    = (score / 100) * circ;
  const dashArray = `${filled} ${circ - filled}`;

  // color shifts: red → amber → green based on score
  const ringColor =
    score >= 70 ? "#00ff87" :
    score >= 45 ? "#f59e0b" :
                  "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#1a1a1a" strokeWidth={8}
          />
          {/* fill */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        {/* center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold"
                style={{ fontSize: size * 0.22 }}>
            {score ?? "—"}
          </span>
          <span className="text-[#555]"
                style={{ fontSize: size * 0.1 }}>
            /100
          </span>
        </div>
      </div>
      <span className="text-[#666] text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}