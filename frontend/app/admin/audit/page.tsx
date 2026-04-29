"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const MOCK_EVENTS = [
  { id: "1", type: "auth",     action: "User Login",         actor: "akshat@hireflow.com",  target: "Job Seeker",        timestamp: new Date().toISOString(),                          status: "success", details: "Successful login from localhost:3001" },
  { id: "2", type: "auth",     action: "User Registered",    actor: "recruiter@test.com",   target: "Recruiter Account", timestamp: new Date(Date.now()-3600000).toISOString(),         status: "success", details: "New recruiter account created" },
  { id: "3", type: "resume",   action: "Resume Upload",      actor: "akshat@hireflow.com",  target: "resume.pdf",        timestamp: new Date(Date.now()-7200000).toISOString(),         status: "success", details: "PDF uploaded, AI parsing queued" },
  { id: "4", type: "resume",   action: "AI Parse Failed",    actor: "system",               target: "Resume #1234",      timestamp: new Date(Date.now()-7100000).toISOString(),         status: "failed",  details: "OpenAI API key not configured" },
  { id: "5", type: "jobs",     action: "Job Created",        actor: "recruiter@test.com",   target: "Frontend Engineer", timestamp: new Date(Date.now()-86400000).toISOString(),        status: "success", details: "New job posted, pending approval" },
  { id: "6", type: "pipeline", action: "Candidate Moved",    actor: "recruiter@test.com",   target: "App #5678",         timestamp: new Date(Date.now()-172800000).toISOString(),       status: "success", details: "applied → ats_screening" },
  { id: "7", type: "ai",       action: "KAREN Chat",         actor: "akshat@hireflow.com",  target: "KAREN Session",     timestamp: new Date(Date.now()-259200000).toISOString(),       status: "failed",  details: "OpenAI API unavailable" },
  { id: "8", type: "auth",     action: "Failed Login",       actor: "unknown@test.com",     target: "Auth System",       timestamp: new Date(Date.now()-345600000).toISOString(),       status: "warning", details: "Invalid credentials — 3 attempts" },
];

const TYPE_ICONS: Record<string, string> = {
  auth: "🔐", jobs: "📋", pipeline: "📊", resume: "📄", payments: "💰", ai: "🤖",
};

const STATUS_CONFIG = {
  success: { bg: "#f0fdf4", color: "#16a34a", label: "Success" },
  failed:  { bg: "#fef2f2", color: "#dc2626", label: "Failed"  },
  warning: { bg: "#fffbeb", color: "#b45309", label: "Warning" },
};

function AuditContent() {
  const searchParams = useSearchParams();
  const typeFilter   = searchParams.get("type") ?? "all";
  const [filter, setFilter] = useState(typeFilter);
  const [search, setSearch] = useState("");
  const [stats,  setStats]  = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("hf_token");
    fetch("http://localhost:8001/api/v1/admin/stats", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const filtered = MOCK_EVENTS.filter(e => {
    if (filter !== "all" && e.type !== filter) return false;
    if (search && !e.action.toLowerCase().includes(search.toLowerCase()) &&
        !e.actor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function exportCSV() {
    const csv = ["Type,Action,Actor,Target,Timestamp,Status,Details",
      ...filtered.map(e => `${e.type},${e.action},${e.actor},${e.target},${e.timestamp},${e.status},"${e.details}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "audit.csv"; a.click();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/admin"       style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Overview</Link>
          <Link href="/admin/audit" style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Audit Trail</Link>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>ADMIN</span>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Audit Trail</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Platform activity log</p>
          </div>
          <button onClick={exportCSV} style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Export CSV →
          </button>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Users",  value: stats.users?.total ?? 0 },
              { label: "Job Seekers",  value: stats.users?.jobseekers ?? 0 },
              { label: "Recruiters",   value: stats.users?.recruiters ?? 0 },
              { label: "Total Jobs",   value: stats.jobs?.total ?? 0 },
              { label: "Applications", value: stats.applications?.total ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
            style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220 }} />
          {["all", "auth", "jobs", "pipeline", "resume", "ai"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === f ? "#2563eb" : "#e2e8f0"}`, background: filter === f ? "#2563eb" : "#fff", color: filter === f ? "#fff" : "#374151", fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{filtered.length} events</p>
            <span style={{ fontSize: 11, color: "#94a3b8", background: "#fffbeb", border: "1px solid #fde68a", padding: "2px 10px", borderRadius: 20 }}>Demo data</span>
          </div>
          {filtered.map((e, i) => {
            const cfg = STATUS_CONFIG[e.status as keyof typeof STATUS_CONFIG];
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = "#f8fafc"}
                onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = "transparent"}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[e.type] ?? "📌"}</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", flex: 1 }}>{e.action}</p>
                <p style={{ fontSize: 12, color: "#64748b", flex: 1 }}>{e.actor}</p>
                <p style={{ fontSize: 12, color: "#374151", flex: 2 }}>{e.details}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                <p style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{new Date(e.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function AuditTrailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "'DM Sans', sans-serif", color: "#94a3b8" }}>Loading...</div>}>
      <AuditContent />
    </Suspense>
  );
}

import { Suspense } from "react";