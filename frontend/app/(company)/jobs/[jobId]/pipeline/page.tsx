"use client";
// frontend/app/(company)/jobs/[jobId]/pipeline/page.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { companyApi, jobsApi, pipelineApi, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import KanbanBoard from "@/components/pipeline/kanban-board";
import Link from "next/link";

/* ─── shared sidebar helpers (same as dashboard) ─────── */
function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "clock")    return <svg {...s} {...p}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
  if (t === "salary")   return <svg {...s} {...p}><path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "bell")     return <svg {...s} {...p}><path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5zM6.5 13.5a1.5 1.5 0 003 0"/></svg>;
  if (t === "back")     return <svg {...s} {...p}><path d="M10 3L5 8l5 5"/></svg>;
  return null;
}

function SbLink({ href, icon, label, active, badge }: { href: string; icon: string; label: string; active?: boolean; badge?: number }) {
  return (
    <Link href={href} className="sb-lnk" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 14px", fontSize: 12, textDecoration: "none",
      color: active ? "#4F46E5" : "#64748B",
      background: active ? "#EEF2FF" : "transparent",
      fontWeight: active ? 600 : 400,
      margin: "1px 6px", borderRadius: 8,
    }}>
      <Icon t={icon} />
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: "auto", background: "#EEF2FF", color: "#4F46E5", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── main page ───────────────────────────────────────── */
export default function PipelinePage() {
  const { jobId }        = useParams<{ jobId: string }>();
  const { user, logout } = useUserStore();
  const router           = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [jobs,    setJobs]    = useState<JobOut[]>([]);
  const [job,     setJob]     = useState<any>(null);
  const [kanban,  setKanban]  = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.myJobs().catch(() => []),
      jobsApi.get(jobId).catch(() => null),
      pipelineApi.kanban(jobId).catch(() => ({})),
    ]).then(([c, j, jobData, kanbanData]) => {
      setCompany(c);
      setJobs(j as JobOut[]);
      setJob(jobData);
      setKanban(kanbanData as Record<string, any[]>);
    }).finally(() => setLoading(false));
  }, [jobId]);

  async function handleMove(appId: string, toStage: string) {
    await pipelineApi.move(appId, toStage);
    setKanban((prev) => {
      const next = { ...prev };
      let moved: any = null;
      for (const stage of Object.keys(next)) {
        const idx = next[stage].findIndex((c) => c.application_id === appId);
        if (idx !== -1) {
          moved = next[stage][idx];
          next[stage] = next[stage].filter((_, i) => i !== idx);
          break;
        }
      }
      if (moved) next[toStage] = [...(next[toStage] ?? []), { ...moved }];
      return next;
    });
  }

  const total      = Object.values(kanban).reduce((sum, arr) => sum + arr.length, 0);
  const screening  = kanban["ats_screening"]?.length ?? 0;
  const interviews = (kanban["round_1"]?.length ?? 0) + (kanban["round_2"]?.length ?? 0) + (kanban["round_3"]?.length ?? 0) + (kanban["hr_round"]?.length ?? 0);
  const offers     = (kanban["offer"]?.length ?? 0) + (kanban["selected"]?.length ?? 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sb-lnk{transition:background 0.1s,color 0.1s}
        .sb-lnk:hover{background:#F8FAFC!important;color:#0F172A!important}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:2px}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 210, background: "#fff", borderRight: "0.5px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "0.5px solid #F1F5F9" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </div>
        {company && (
          <div style={{ margin: "10px 10px 4px", padding: "7px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#15803D" }}>
            {company.name}
          </div>
        )}
        <div style={{ padding: "14px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
          <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard" />
          <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"       badge={jobs.length} />
          <SbLink href="/candidates"          icon="cands" label="Candidates" />
          <SbLink href="/candidates"          icon="pipe"  label="Pipeline"   active />
        </div>
        <div style={{ padding: "10px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tools</div>
          <SbLink href="/referrals"      icon="ref"    label="Referrals" />
        </div>
        <div style={{ marginTop: "auto", padding: "12px 6px", borderTop: "0.5px solid #F1F5F9" }}>
          <SbLink href="/settings" icon="settings" label="Settings" />
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", marginTop: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name ?? "Recruiter"}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? ""}</p>
            </div>
            <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 10, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/recruiter-jobs" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748B", textDecoration: "none", padding: "4px 8px", borderRadius: 7, background: "#F8FAFC", border: "0.5px solid #E2E8F0" }}>
              <Icon t="back" /> Jobs
            </Link>
            <span style={{ color: "#CBD5E1", fontSize: 12 }}>/</span>
            {loading
              ? <div style={{ width: 140, height: 16, borderRadius: 6, background: "#E2E8F0" }} />
              : <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{job?.title ?? "Pipeline"}</span>
            }
          </div>
          <Link href="/jobs/create" style={{ background: "#4F46E5", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + Post Job
          </Link>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Job header + stats */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              {loading ? (
                <div style={{ width: 200, height: 24, borderRadius: 6, background: "#E2E8F0" }} />
              ) : (
                <>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>
                    {job?.title ?? "Pipeline"}
                  </h1>
                  {job?.company_name && (
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                      {job.company_name} · {job.location || "Remote"} · {job.job_type}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Total",      value: total,      color: "#0F172A", bg: "#F8FAFC",  border: "#E2E8F0" },
                { label: "Screening",  value: screening,  color: "#92400E", bg: "#FFFBEB",  border: "#FDE68A" },
                { label: "Interviews", value: interviews, color: "#4F46E5", bg: "#EEF2FF",  border: "#C7D7FE" },
                { label: "Offers",     value: offers,     color: "#15803D", bg: "#F0FDF4",  border: "#BBF7D0" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 72 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.03em" }}>{value}</p>
                  <p style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban board */}
          {loading ? (
            <div style={{ display: "flex", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 220, height: 320, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14 }} />
              ))}
            </div>
          ) : (
            <KanbanBoard kanban={kanban} onMove={handleMove} />
          )}
        </div>
      </div>
    </div>
  );
}