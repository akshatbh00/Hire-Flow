"use client";

interface Notification {
  id:         string;
  message:    string;
  stage:      string | null;
  is_read:    boolean;
  created_at: string;
}

interface Props {
  notifications: Notification[];
}

const STAGE_COLORS: Record<string, string> = {
  selected:      "text-[#00ff87]",
  offer:         "text-[#00ff87]",
  hr_round:      "text-blue-400",
  round_1:       "text-blue-400",
  round_2:       "text-blue-400",
  round_3:       "text-blue-400",
  ats_rejected:  "text-red-400",
  ats_screening: "text-amber-400",
  applied:       "text-[#555]",
};

export default function ActivityFeed({ notifications }: Props) {
  if (!notifications?.length) {
    return (
      <div className="border border-[#1e1e1e] bg-[#0f0f0f] rounded-sm p-6 text-center">
        <p className="text-[#333] text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1e1e1e] bg-[#0f0f0f] rounded-sm divide-y divide-[#141414]">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-5 py-4 flex items-start gap-3 ${
            !n.is_read ? "bg-[#111]" : ""
          }`}
        >
          {/* dot */}
          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            !n.is_read ? "bg-[#00ff87]" : "bg-[#2a2a2a]"
          }`} />

          <div className="flex-1 min-w-0">
            <p className="text-[#ccc] text-sm leading-snug">{n.message}</p>
            <div className="flex items-center gap-3 mt-1">
              {n.stage && (
                <span className={`text-xs uppercase tracking-widest font-bold ${
                  STAGE_COLORS[n.stage] ?? "text-[#555]"
                }`}>
                  {n.stage.replace(/_/g, " ")}
                </span>
              )}
              <span className="text-[#333] text-xs">
                {new Date(n.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}