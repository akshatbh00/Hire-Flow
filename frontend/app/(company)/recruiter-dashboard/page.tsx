"use client";
// frontend/app/(company)/recruiter-dashboard/page.tsx
import { useEffect, useState } from "react";
import { companyApi, CompanyStats, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Constants ──────────────────────────────────────── */
const PIPELINE_STAGES = [
  { key: "applied",       label: "Applied"    },
  { key: "ats_screening", label: "Screening"  },
  { key: "round_1",       label: "Interview"  },
  { key: "hr_round",      label: "Assessment" },
  { key: "offer",         label: "Offer"      },
  { key: "selected",      label: "Selected"   },
];

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4338CA" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#EFF6FF", text: "#1D4ED8" },
  { bg: "#FDF4FF", text: "#7E22CE" },
];

/* ─── Helpers ────────────────────────────────────────── */
function pickColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

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
  if (t === "clock")    return <svg {...s} {...p}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
  if (t === "salary")   return <svg {...s} {...p}><path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "bell")     return <svg {...s} {...p}><path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5zM6.5 13.5a1.5 1.5 0 003 0"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "close")    return <svg {...s} {...p}><path d="M2 2l12 12M14 2L2 14"/></svg>;
  return null;
}

/* ─── Sidebar Link ───────────────────────────────────── */
function SbLink({
  href, icon, label, active, badge, onClick,
}: {
  href: string; icon: string; label: string;
  active?: boolean; badge?: number | null; onClick?: () => void;
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
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}
      `}
    >
      <span className={active ? "text-indigo-600" : "text-slate-400"}>
        <Icon t={icon} />
      </span>
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-px rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Sidebar Content ────────────────────────────────── */
function SidebarContent({
  company, jobs, user, logout, router, onNavClick,
}: {
  company: any; jobs: JobOut[]; user: any;
  logout: () => void; router: any; onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-[18px] border-b border-slate-100">
        <span className="text-[15px] font-bold tracking-tight text-slate-900">
          Hire<span className="text-indigo-600">Flow</span>
        </span>
      </div>

      {company && (
        <div className="mx-2.5 mt-2.5 mb-1 px-3 py-1.5 bg-green-50 rounded-lg text-[11px] font-semibold text-green-700 truncate">
          {company.name}
        </div>
      )}

      <div className="pt-3.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Main</p>
        <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard"  active onClick={onNavClick} />
        <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"        badge={jobs.length} onClick={onNavClick} />
        <SbLink href="/candidates"          icon="cands" label="Candidates"  onClick={onNavClick} />
        <SbLink href="/candidates"          icon="pipe"  label="Pipeline"    onClick={onNavClick} />
      </div>

      <div className="pt-2.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Tools</p>
        <SbLink href="/interview-prep" icon="clock"  label="Interview Prep" onClick={onNavClick} />
        <SbLink href="/salary"         icon="salary" label="Salary Data"    onClick={onNavClick} />
        <SbLink href="/referrals"      icon="ref"    label="Referrals"      onClick={onNavClick} />
      </div>

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
export default function RecruiterDashboardPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();

  const [company,     setCompany]     = useState<any>(null);
  const [stats,       setStats]       = useState<CompanyStats | null>(null);
  const [jobs,        setJobs]        = useState<JobOut[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] ?? "Recruiter";

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.stats().catch(() => ({ active_jobs: 0, total_applicants: 0, pipeline_breakdown: {} })),
      companyApi.myJobs().catch(() => []),
    ]).then(([c, s, j]) => {
      setCompany(c);
      setStats(s as CompanyStats);
      setJobs((j as JobOut[]).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (loading) return <Skeleton />;

  const bd         = stats?.pipeline_breakdown ?? {};
  const maxVal     = Math.max(...PIPELINE_STAGES.map(s => bd[s.key] ?? 0), 1);
  const inPipeline = Object.entries(bd).filter(([s]) => !["applied","ats_rejected","withdrawn"].includes(s)).reduce((a,[,v])=>a+v,0);
  const offers     = bd["offer"] ?? 0;

  const MOCK_NAMES = ["Akshat Kumar","Priya Rao","Sneha K","Rohan V"];
  const MOCK_MSGS  = (job: JobOut, i: number) => [
    `applied to ${job.title}`,
    `moved to Interview · ${job.title}`,
    `requested referral for ${job.title}`,
    `accepted offer · ${job.title}`,
  ][i % 4];
  const MOCK_TIMES = ["2h ago","5h ago","Yesterday","2 days ago"];

  const activity = jobs.slice(0, 4).map((job, i) => {
    const name = MOCK_NAMES[i % MOCK_NAMES.length];
    return { id: job.id, initials: getInitials(name), color: pickColor(name), msg: MOCK_MSGS(job, i), time: MOCK_TIMES[i] };
  });

  const topCands = jobs.slice(0, 3).map((job, i) => {
    const names  = ["Akshat Kumar","Priya Rao","Meera Shah"];
    const scores = [87, 82, 74];
    return { name: names[i], role: job.title, score: scores[i] };
  });

  const statCards = [
    { label: "Active Jobs",      value: stats?.active_jobs ?? 0,      sub: "Open roles",        color: "text-indigo-600" },
    { label: "Total Applicants", value: stats?.total_applicants ?? 0, sub: "Across all roles",  color: "text-slate-900"  },
    { label: "In Pipeline",      value: inPipeline,                    sub: "Active candidates", color: "text-violet-600" },
    { label: "Offers Out",       value: offers,                        sub: "Awaiting response", color: "text-green-700"  },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-40
        w-[210px] bg-white border-r border-slate-200
        flex flex-col shrink-0 overflow-y-auto
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
        <button
          className="absolute top-3 right-3 md:hidden text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <Icon t="close" />
        </button>
        <SidebarContent
          company={company} jobs={jobs} user={user}
          logout={logout} router={router}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 h-[52px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icon t="menu" />
            </button>
            <p className="text-[13px] font-semibold text-slate-900">
              {greeting}, <span className="text-indigo-600">{firstName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/jobs/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-semibold no-underline transition-colors"
            >
              <span className="hidden sm:inline">+ Post Job</span>
              <span className="sm:hidden">+ Post</span>
            </Link>
            <div className="relative w-[30px] h-[30px] rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800">
              <Icon t="bell" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* Stats — 2 cols on mobile, 4 on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mb-4">
            {statCards.map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-3.5 md:p-4">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <p className={`text-2xl md:text-3xl font-bold tracking-tight ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-300 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Jobs table + pipeline — stack on mobile, side-by-side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 mb-3">

            {/* Jobs table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3.5">
                <p className="text-[13px] font-semibold text-slate-900">Active Jobs</p>
                <Link href="/candidates" className="text-[11px] text-indigo-600 no-underline font-medium hover:text-indigo-700">
                  View all →
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-slate-400 mb-3">No jobs posted yet</p>
                  <Link href="/jobs/create" className="text-xs font-semibold text-indigo-600 no-underline hover:text-indigo-700">
                    Post first job →
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop table header — hidden on mobile */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_70px_50px_65px_80px] gap-2 px-2 pb-2 border-b border-slate-50">
                    {["Role","Applicants","New","Status",""].map(h => (
                      <p key={h} className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{h}</p>
                    ))}
                  </div>

                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="
                        flex flex-col sm:grid sm:grid-cols-[1fr_70px_50px_65px_80px]
                        gap-1.5 sm:gap-2 px-2 py-2.5 rounded-lg
                        hover:bg-slate-50 transition-colors items-start sm:items-center
                        border-b border-slate-50 last:border-0
                      "
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{job.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{job.location || "Remote"} · {job.job_type}</p>
                      </div>
                      {/* These columns are desktop-only */}
                      <p className="hidden sm:block text-xs font-semibold text-slate-900">—</p>
                      <p className="hidden sm:block text-xs font-semibold text-indigo-600">—</p>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 whitespace-nowrap w-fit">
                        Live
                      </span>
                      <div className="flex gap-3">
                        <Link href={`/jobs/${job.id}/pipeline`} className="text-[10px] text-indigo-600 font-medium no-underline hover:text-indigo-700">
                          View
                        </Link>
                        <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">Edit</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Pipeline breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Pipeline</p>
              {PIPELINE_STAGES.map(({ key, label }) => {
                const count  = bd[key] ?? 0;
                const pct    = maxVal > 0 ? (count / maxVal) * 100 : 0;
                const isGood = key === "selected" || key === "offer";
                return (
                  <div key={key} className="flex items-center gap-2 mb-2.5">
                    <p className="text-[10px] text-slate-500 w-20 shrink-0">{label}</p>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isGood ? "bg-green-600" : "bg-indigo-500"}`}
                        style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-900 w-4 text-right shrink-0">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity + Top Candidates — stack on mobile, side-by-side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Recent Activity</p>
              {activity.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No activity yet — post a job to get started</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-50">
                  {activity.map((a) => (
                    <div key={a.id} className="flex gap-2.5 py-2.5">
                      <div
                        className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: a.color.bg, color: a.color.text }}
                      >
                        {a.initials}
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 leading-snug">{a.msg}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Candidates */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3.5">
                <p className="text-[13px] font-semibold text-slate-900">Top Candidates</p>
                <Link href="/candidates" className="text-[11px] text-indigo-600 no-underline font-medium hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              {jobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Post a job to see candidates</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topCands.map((c) => {
                    const col = pickColor(c.name);
                    return (
                      <div key={c.name} className="flex items-center gap-2.5 px-2.5 py-2 bg-slate-50 rounded-lg">
                        <div
                          className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                          style={{ background: col.bg, color: col.text }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.role}</p>
                        </div>
                        <span className={`
                          text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0
                          ${c.score >= 80 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"}
                        `}>
                          {c.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="hidden md:block w-[210px] bg-white border-r border-slate-200 shrink-0" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-3">
            Hire<span className="text-indigo-600">Flow</span>
          </p>
          <div className="flex gap-1.5 justify-center">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}