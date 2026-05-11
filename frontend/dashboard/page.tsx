"use client";
// frontend/dashboard/page.tsx
import { useEffect, useState } from "react";
import { companyApi, jobsApi, CompanyStats } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter }    from "next/navigation";
import StatsCards  from "./stats-cards";
import FunnelChart from "./funnel-chart";
import Link from "next/link";

export default function RecruiterDashboardPage() {
  const router        = useRouter();
  const { user, logout } = useUserStore();

  const [company, setCompany] = useState<any>(null);
  const [stats,   setStats]   = useState<CompanyStats | null>(null);
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "jobseeker") { router.push("/dashboard"); return; }
    Promise.all([
      companyApi.me(),
      companyApi.stats(),
      jobsApi.list({ limit: 10 }),
    ])
      .then(([c, s, j]) => { setCompany(c); setStats(s); setJobs(j); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!stats)  return null;

  const breakdown = stats.pipeline_breakdown ?? {};

  return (
    <div
      className="min-h-screen bg-[#0a0a0a]"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {/* ── Nav ── */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-[0.2em] uppercase text-sm">
              Hire<span className="text-[#00ff87]">Flow</span>
            </span>
            {company && (
              <>
                <span className="text-[#2a2a2a] hidden sm:inline">/</span>
                <span className="text-[#555] text-xs uppercase tracking-widest hidden sm:inline">
                  {company.name}
                </span>
              </>
            )}
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/company/jobs"
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Jobs
            </Link>
            <Link href="/company/candidates"
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Candidates
            </Link>
            <Link href="/company/settings"
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Settings
            </Link>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="text-[#333] text-xs uppercase tracking-widest hover:text-[#888] transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[#555] transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#555] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#555] transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-[#1a1a1a] pt-4 flex flex-col gap-4">
            {company && (
              <span className="text-[#555] text-xs uppercase tracking-widest">
                {company.name}
              </span>
            )}
            <Link href="/company/jobs"
              onClick={() => setMenuOpen(false)}
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Jobs
            </Link>
            <Link href="/company/candidates"
              onClick={() => setMenuOpen(false)}
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Candidates
            </Link>
            <Link href="/company/settings"
              onClick={() => setMenuOpen(false)}
              className="text-[#555] text-xs uppercase tracking-widest hover:text-white transition-colors">
              Settings
            </Link>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="text-[#333] text-xs uppercase tracking-widest hover:text-[#888] transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              Recruiter Dashboard
            </h1>
            <p className="text-[#444] text-sm mt-1">
              {company?.name ?? "Your Company"}
            </p>
          </div>
          <Link
            href="/company/jobs/create"
            className="px-4 sm:px-5 py-2.5 bg-[#00ff87] text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#00e87a] transition-colors whitespace-nowrap flex-shrink-0"
          >
            + Post Job
          </Link>
        </div>

        {/* Stats cards */}
        <StatsCards stats={stats} breakdown={breakdown} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Funnel — takes 2 cols */}
          <div className="lg:col-span-2 border border-[#1e1e1e] bg-[#0f0f0f] rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#555] text-xs uppercase tracking-widest">
                Pipeline Funnel
              </h2>
              <span className="text-[#2a2a2a] text-xs hidden sm:inline">
                conversion from applied
              </span>
            </div>
            <FunnelChart breakdown={breakdown} />
          </div>

          {/* Active jobs — 1 col */}
          <div className="border border-[#1e1e1e] bg-[#0f0f0f] rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#555] text-xs uppercase tracking-widest">
                Active Roles
              </h2>
              <Link
                href="/company/jobs"
                className="text-[#333] text-xs uppercase tracking-widest hover:text-[#00ff87] transition-colors"
              >
                All →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#2a2a2a] text-sm mb-4">No jobs posted yet</p>
                <Link
                  href="/company/jobs/create"
                  className="text-[#00ff87] text-xs uppercase tracking-widest"
                >
                  Post first job →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/company/jobs/${job.id}/pipeline`}
                    className="flex items-center justify-between p-3 border border-[#161616] rounded-sm hover:border-[#2a2a2a] transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium group-hover:text-[#00ff87] transition-colors truncate">
                        {job.title}
                      </p>
                      <p className="text-[#2a2a2a] text-xs mt-0.5">
                        {job.location || "Remote"}
                      </p>
                    </div>
                    <span className="text-[#2a2a2a] text-xs ml-2 flex-shrink-0 group-hover:text-[#00ff87] transition-colors">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Skeleton() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <div className="text-center space-y-3">
        <div className="text-white font-bold tracking-[0.2em] uppercase text-sm">
          Hire<span className="text-[#00ff87]">Flow</span>
        </div>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-[#00ff87] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}