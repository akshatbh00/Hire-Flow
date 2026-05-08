"use client";
// frontend/app/(company)/jobs/[jobId]/pipeline/page.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { companyApi, jobsApi, pipelineApi, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import KanbanBoard from "@/components/pipeline/kanban-board";
import Link from "next/link";

/* ─── Icons ─────────────────────────────────────────── */
function Icon({ t }: { t: string }) {
  const p = {
    stroke: "currentColor",
    strokeWidth: 1.3,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "back")     return <svg {...s} {...p}><path d="M10 3L5 8l5 5"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "close")    return <svg {...s} {...p}><path d="M2 2l12 12M14 2L2 14"/></svg>;
  return null;
}

/* ─── Sidebar Link ───────────────────────────────────── */
function SbLink({
  href,
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3.5 py-2 text-xs rounded-lg mx-1.5 my-px
        transition-all duration-100 no-underline font-medium
        ${active
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }
      `}
    >
      <span className={active ? "text-indigo-600" : "text-slate-400"}>
        <Icon t={icon} />
      </span>
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-px rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Sidebar Content ────────────────────────────────── */
function SidebarContent({
  company,
  jobs,
  user,
  logout,
  router,
  onNavClick,
}: {
  company: any;
  jobs: JobOut[];
  user: any;
  logout: () => void;
  router: any;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-[18px] border-b border-slate-100">
        <span className="text-[15px] font-bold tracking-tight text-slate-900">
          Hire<span className="text-indigo-600">Flow</span>
        </span>
      </div>

      {/* Company badge */}
      {company && (
        <div className="mx-2.5 mt-2.5 mb-1 px-3 py-1.5 bg-green-50 rounded-lg text-[11px] font-semibold text-green-700 truncate">
          {company.name}
        </div>
      )}

      {/* Main nav */}
      <div className="pt-3.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
          Main
        </p>
        <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard" onClick={onNavClick} />
        <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"       badge={jobs.length} onClick={onNavClick} />
        <SbLink href="/candidates"          icon="cands" label="Candidates" onClick={onNavClick} />
        <SbLink href="/candidates"          icon="pipe"  label="Pipeline"   active onClick={onNavClick} />
      </div>

      <div className="pt-2.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
          Tools
        </p>
        <SbLink href="/referrals" icon="ref" label="Referrals" onClick={onNavClick} />
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-slate-100 py-3 px-1.5">
        <SbLink href="/settings" icon="settings" label="Settings" onClick={onNavClick} />
        <div className="flex items-center gap-2.5 px-3.5 py-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {user?.full_name?.[0]?.toUpperCase() ?? "R"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-900 truncate">{user?.full_name ?? "Recruiter"}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="text-[10px] text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer font-[inherit] shrink-0"
          >
            Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function PipelinePage() {
  const { jobId }        = useParams<{ jobId: string }>();
  const { user, logout } = useUserStore();
  const router           = useRouter();

  const [company,       setCompany]       = useState<any>(null);
  const [jobs,          setJobs]          = useState<JobOut[]>([]);
  const [job,           setJob]           = useState<any>(null);
  const [kanban,        setKanban]        = useState<Record<string, any[]>>({});
  const [loading,       setLoading]       = useState(true);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

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

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const stats = [
    { label: "Total",      value: total,      textColor: "text-slate-900",  bg: "bg-slate-50",   border: "border-slate-200" },
    { label: "Screening",  value: screening,  textColor: "text-amber-800",  bg: "bg-amber-50",   border: "border-amber-200" },
    { label: "Interviews", value: interviews, textColor: "text-indigo-600", bg: "bg-indigo-50",  border: "border-indigo-200" },
    { label: "Offers",     value: offers,     textColor: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  ];

  const sidebarProps = { company, jobs, user, logout, router };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: static | mobile: slide-over) ── */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen z-40
          w-[210px] bg-white border-r border-slate-200
          flex flex-col shrink-0 overflow-y-auto
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Mobile close button */}
        <button
          className="absolute top-3 right-3 md:hidden text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <Icon t="close" />
        </button>

        <SidebarContent
          {...sidebarProps}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 h-[52px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer mr-1"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon t="menu" />
            </button>

            <Link
              href="/recruiter-jobs"
              className="flex items-center gap-1 text-xs text-slate-500 no-underline px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:text-slate-800 shrink-0"
            >
              <Icon t="back" /> Jobs
            </Link>
            <span className="text-slate-300 text-xs">/</span>

            {loading ? (
              <div className="w-32 h-4 rounded-md bg-slate-200 animate-pulse" />
            ) : (
              <span className="text-[13px] font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-xs">
                {job?.title ?? "Pipeline"}
              </span>
            )}
          </div>

          <Link
            href="/jobs/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-lg no-underline shrink-0 transition-colors"
          >
            <span className="hidden sm:inline">+ Post Job</span>
            <span className="sm:hidden">+ Post</span>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* Job header + stats */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">

            {/* Title */}
            <div className="min-w-0">
              {loading ? (
                <div className="w-48 h-6 rounded-md bg-slate-200 animate-pulse" />
              ) : (
                <>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
                    {job?.title ?? "Pipeline"}
                  </h1>
                  {job?.company_name && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {job.company_name} · {job.location || "Remote"} · {job.job_type}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Stats row — scrollable on very small screens */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {stats.map(({ label, value, textColor, bg, border }) => (
                <div
                  key={label}
                  className={`${bg} border ${border} rounded-xl px-3.5 py-2.5 text-center min-w-[68px] shrink-0`}
                >
                  <p className={`text-lg md:text-xl font-bold tracking-tight ${textColor}`}>{value}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold whitespace-nowrap">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban board — horizontal scroll on mobile */}
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[200px] md:w-[220px] h-72 bg-white border border-slate-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
              <KanbanBoard kanban={kanban} onMove={handleMove} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}