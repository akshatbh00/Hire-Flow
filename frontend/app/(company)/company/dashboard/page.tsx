"use client";
// frontend/app/(company)/company/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/api";
import { useUserStore } from "@/store/user.store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanyStats {
  active_jobs: number;
  total_applicants: number;
  pipeline_breakdown: Record<string, number>;
}

interface HRMSMember {
  id: string;
  name: string;
  email: string;
  role: "company_admin" | "hiring_manager" | "hr";
  status: "active" | "inactive" | "suspended";
}

interface Job {
  id: string;
  title: string;
  location: string;
  job_type: string;
  status: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  employee_count?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Hire<span style={{ color: "#2563eb" }}>Flow</span>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", opacity: 0.4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
      <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>{sub}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, logout } = useUserStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [team, setTeam] = useState<HRMSMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/companies/me").catch(() => null),
      api.get("/companies/me/stats").catch(() => null),
      api.get("/jobs", { params: { limit: 5 } }).catch(() => ({ data: [] })),
      api.get("/hrms/team").catch(() => ({ data: [] })),
    ]).then(([c, s, j, t]) => {
      setCompany(c?.data ?? null);
      setStats(s?.data ?? null);
      setJobs(j?.data ?? []);
      setTeam(t?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const breakdown = stats?.pipeline_breakdown ?? {};
  const activeMembers = team.filter((m) => m.status === "active").length;
  const hiringManagers = team.filter((m) => m.role === "hiring_manager").length;
  const hrs = team.filter((m) => m.role === "hr").length;
  const inPipeline = Object.entries(breakdown)
    .filter(([s]) => !["applied", "ats_rejected", "withdrawn"].includes(s))
    .reduce((a, [, v]) => a + v, 0);

  const ROLE_COLORS: Record<string, string> = {
    company_admin: "#dc2626",
    hiring_manager: "#ea580c",
    hr: "#2563eb",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/company/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            { href: "/company/dashboard", label: "Dashboard", active: true },
            { href: "/jobs/create", label: "Post Job" },
            { href: "/candidates", label: "Candidates" },
            { href: "/admin/hrms", label: "HRMS" },
            { href: "/company/profile", label: "Company Profile" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          {company && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              {company.name}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <button onClick={() => { logout(); router.push("/login"); }}
              style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Company Dashboard
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
              {company?.name ?? "Your Company"} · Admin Overview
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/admin/hrms"
              style={{ background: "#f1f5f9", color: "#374151", padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Manage HRMS
            </Link>
            <Link href="/jobs/create"
              style={{ background: "#2563eb", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              + Post Job
            </Link>
          </div>
        </div>

        {/* Stats — Hiring */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Hiring Overview</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          <StatCard label="Active Jobs" value={stats?.active_jobs ?? 0} sub="Open roles" color="#2563eb" />
          <StatCard label="Total Applicants" value={stats?.total_applicants ?? 0} sub="Across all roles" color="#0f172a" />
          <StatCard label="In Pipeline" value={inPipeline} sub="Active candidates" color="#7c3aed" />
          <StatCard label="Selected" value={breakdown["selected"] ?? 0} sub="Hired this cycle" color="#16a34a" />
        </div>

        {/* Stats — HRMS */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>HRMS Overview</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          <StatCard label="Team Members" value={activeMembers} sub="Active staff" color="#0f172a" />
          <StatCard label="Hiring Managers" value={hiringManagers} sub="Managing pipelines" color="#ea580c" />
          <StatCard label="HR Members" value={hrs} sub="Handling candidates" color="#2563eb" />
          <StatCard label="Pending Invites" value={0} sub="Awaiting response" color="#94a3b8" />
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Active Jobs */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Active Roles</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Currently open positions</p>
              </div>
              <Link href="/company/jobs" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
            </div>
            {jobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>No jobs posted yet</p>
                <Link href="/jobs/create" style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Post first job →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}/pipeline`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid #f1f5f9", borderRadius: 10, textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{job.title}</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{job.location || "Remote"} · {job.job_type}</p>
                    </div>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontWeight: 500 }}>
                      {job.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* HRMS Team */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Hiring Team</p>
              <Link href="/admin/hrms" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>Manage →</Link>
            </div>
            {team.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>No team members yet</p>
                <Link href="/admin/hrms" style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Invite team →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {team.slice(0, 6).map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>{m.role.replace("_", " ")}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
          {[
            { href: "/jobs/create",    icon: "📋", label: "Post a Job",       desc: "Create a new listing" },
            { href: "/admin/hrms",     icon: "👥", label: "Manage HRMS",      desc: "Team & hierarchy" },
            { href: "/candidates",     icon: "🔍", label: "View Candidates",  desc: "Browse applicants" },
            { href: "/company/profile",icon: "🏢", label: "Company Profile",  desc: "Edit company details" },
            { href: "/salary",         icon: "💰", label: "Salary Insights",  desc: "Market salary data" },
          ].map(({ href, icon, label, desc }) => (
            <Link key={href} href={href}
              style={{ display: "block", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", textDecoration: "none", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>{desc}</p>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}