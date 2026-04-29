"use client";

interface Props {
  label:     string;
  value:     string | number;
  sub?:      string;
  accent?:   boolean;
  trend?:    "up" | "down" | "neutral";
}

export default function MetricCard({ label, value, sub, accent, trend }: Props) {
  return (
    <div className={`border rounded-sm p-5 transition-colors ${
      accent
        ? "border-[#00ff87]/20 bg-[#00ff87]/5"
        : "border-[#1e1e1e] bg-[#0f0f0f]"
    }`}>
      <p className="text-[#555] text-xs uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${accent ? "text-[#00ff87]" : "text-white"}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-xs mb-1 ${
            trend === "up"   ? "text-emerald-400" :
            trend === "down" ? "text-red-400"     : "text-[#555]"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"}
          </span>
        )}
      </div>
      {sub && <p className="text-[#444] text-xs mt-1">{sub}</p>}
    </div>
  );
}