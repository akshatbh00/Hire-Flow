"use client";

import { useEffect, useState } from "react";
import { applicationsApi, jobsApi } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface AuditEvent {
  id:        string;
  type:      string;
  action:    string;
  actor:     string;
  target:    string;
  timestamp: string;
  status:    "success" | "failed" | "warning";
  details:   string;
}

// Simulated audit events — replace with real API when backend endpoint ready
const MOCK_EVENTS: AuditEvent[] = [
  { id: "1", type: "auth",     action: "User Login",          actor: "akshat@vela.com",       target: "Job Seeker",         timestamp: new Date().toISOString(),                         status: "success", details: "Successful login from localhost:3001" },
  { id: "2", type: "auth",     action: "User Registered",     actor: "recruiter@test.com",    target: "Recruiter Account",  timestamp: new Date(Date.now()-3600000).toISOString(),        status: "success", details: "New recruiter account created" },
  { id: "3", type: "resume",   action: "Resume Upload",       actor: "akshat@vela.com",       target: "akshat_DS.pdf",      timestamp: new Date(Date.now()-7200000).toISOString(),        status: "success", details: "PDF uploaded, AI parsing queued" },
  { id: "4", type: "resume",   action: "AI Parse Failed",     actor: "system",                target: "Resume #1234",       timestamp: new Date(Date.now()-7100000).toISOString(),        status: "failed",  details: "OpenAI API key not configured" },
  { id: "5", type: "jobs",     action: "Job Created",         actor: "recruiter@test.com",    target: "Frontend Engineer",  timestamp: new Date(Date.now()-86400000).toISOString(),       status: "success", details: "New job posted, pending approval" },
  { id: "6", type: "pipeline", action: "Candidate Moved",     actor: "recruiter@test.com",    target: "App #5678",          timestamp: new Date(Date.now()-172800000).toISOString(),      status: "success", details: "applied → ats_screening" },
  { id: "7", type: "ai",       action: "KAREN Chat",          actor: "akshat@vela.com",       target: "KAREN Session",      timestamp: new Date(Date.now()-259200000).toISOString(),      status: "failed",  details: "OpenAI API unavailable" },
  { id: "8", type: "auth",     action: "Failed Login",        actor: "unknown@test.com",      target: "Auth System",        timestamp: new Date(Date.now()-345600000).toISOString(),      status: "warning", details: "Invalid credentials — 3 attempts" },
];

const TYPE_ICONS: Record<string, string> = {
  auth:     "🔐",
  jobs:     "📋",
  pipeline: "📊",
  resume:   "📄",
  payments: "💰",
  ai:       "🤖",
};

const STATUS_CONFIG = {
  success: { bg: "#f0fdf4", color: "#16a34a", label: "Success" },
  failed:  { bg: "#fef2f2", color: "#dc2626", label: "Failed" },
  warning: { bg: "#fffbeb", color: "#b45309", label: "Warning" },
};

export default function AuditTrailPage() {
  const searchParams  = useSearchParams();
  const typeFilter    = searchParams.get("type") ?? "all";
  const [filter,  setFilter]  = useState(typeFilter);
  const [search,  setSearch]  = useState("");
  const [events,  setEvents]  = useState<AuditEvent[]>(MOCK_EVENTS);

  const filtered = events.filter(e => {
    const matchType   = filter === "all" || e.type === filter;
    const matchSearch = !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = {
    all:      events.length,
    auth:     events.filter(e => e.type === "auth").length,
    jobs:     events.filter(e => e.type === "jobs").length,
    pipeline: events.filter(e => e.type === "pipeline").length,
    resume:   events.filter(e => e.type === "resume").length,
    ai:       events.filter(e => e.type === "ai").length,
  };

  function exportCSV() {
    const csv = ["Type,Action,Actor,Target,Timestamp,Status,Details",
      ...filtered.map(e => `${e.type},${e.action},${e.actor},${e.target},${e.timestamp},${e.status},"${e.details}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "hireflow_audit.csv"; a.click();
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

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Audit Trail</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Complete log of all platform activity</p>
          </div>
          <button onClick={exportCSV}
            style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Export CSV →
          </button>
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Events",  value: events.length,                                   color: "#0f172a" },
            { label: "Failed Events", value: events.filter(e => e.status === "failed").length,  color: "#dc2626" },
            { label: "Warnings",      value: events.filter(e => e.status === "warning").length, color: "#b45309" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b" }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220 }}
            onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
            onBlur={e  => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
          {Object.entries(counts).map(([type, count]) => (
            <button key={type} onClick={() => setFilter(type)}
              style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${filter === type ? "#2563eb" : "#e2e8f0"}`, background: filter === type ? "#eff6ff" : "#fff", color: filter === type ? "#2563eb" : "#64748b", fontSize: 12.5, fontWeight: filter === type ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              {type === "all" ? "All" : TYPE_ICONS[type]} {type} ({count})
            </button>
          ))}
        </div>

        {/* Event table */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "100px 180px 160px 160px 140px 1fr 80px", gap: 0, padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            {["Type", "Action", "Actor", "Target", "Time", "Details", "Status"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No events found</div>
          ) : filtered.map((e, i) => {
            const cfg = STATUS_CONFIG[e.status];
            return (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "100px 180px 160px 160px 140px 1fr 80px", gap: 0, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}
                onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <p style={{ fontSize: 13 }}>{TYPE_ICONS[e.type] ?? "📌"} <span style={{ fontSize: 11, color: "#64748b" }}>{e.type}</span></p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{e.action}</p>
                <p style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.actor}</p>
                <p style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.target}</p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(e.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                <p style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.details}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
          Showing mock data — connect to <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>/admin/audit-log</code> backend endpoint for real data
        </p>
      </main>
    </div>
  );
}