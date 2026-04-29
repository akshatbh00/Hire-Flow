"use client";

import { useState } from "react";
import { salaryApi, coursesApi, SalaryInsight } from "@/lib/api";
import Link from "next/link";

const POPULAR_ROLES = [
  "Software Engineer", "Product Manager", "Data Scientist",
  "Frontend Developer", "Backend Developer", "DevOps Engineer",
  "UI/UX Designer", "Business Analyst", "Data Analyst",
];

const CITIES = ["", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Remote"];

export default function SalaryPage() {
  const [role,    setRole]    = useState("");
  const [city,    setCity]    = useState("");
  const [data,    setData]    = useState<SalaryInsight | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function search() {
    if (!role.trim()) { setError("Please enter a role."); return; }
    setLoading(true); setError(""); setData(null); setCourses([]);
    try {
      const res = await salaryApi.insights(role.trim(), city || undefined);
      setData(res);
      try {
        const c = await coursesApi.forSkills([role.trim()]);
        setCourses(c.courses?.slice(0, 4) ?? []);
      } catch {}
    } catch (e: any) {
      setError(e.message ?? "No salary data found for this role.");
    } finally {
      setLoading(false);
    }
  }

  function toL(val: number) {
    if (!val) return "—";
    const l = val / 100000;
    return l % 1 === 0 ? `₹${l}L` : `₹${l.toFixed(1)}L`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[{ href: "/dashboard", label: "Dashboard" }, { href: "/jobs", label: "Jobs" }, { href: "/applications", label: "Applications" }, { href: "/resume", label: "Resume" }, { href: "/salary", label: "Salary", active: true }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Salary Insights</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Market salary data by role and location</p>
        </div>

        {/* Search */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Job title e.g. Software Engineer"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
            />
            <select value={city} onChange={(e) => setCity(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#374151", background: "#fff" }}>
              {CITIES.map((c) => <option key={c} value={c}>{c || "All Cities"}</option>)}
            </select>
            <button onClick={search} disabled={loading}
              style={{ padding: "10px 24px", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Popular roles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_ROLES.map((r) => (
              <button key={r} onClick={() => { setRole(r); }}
                style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${role === r ? "#2563eb" : "#e2e8f0"}`, background: role === r ? "#eff6ff" : "#fff", color: role === r ? "#2563eb" : "#64748b", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", fontWeight: role === r ? 600 : 400 }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>{error}</div>
        )}

        {/* Results */}
        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Average",    val: toL(data.avg),  color: "#2563eb" },
                { label: "Min",        val: toL(data.min),  color: "#64748b" },
                { label: "Max",        val: toL(data.max),  color: "#16a34a" },
                { label: "Sample Size", val: String(data.sample_size ?? "—"), color: "#7c3aed" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Percentile bar */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Salary Distribution</p>
              <div style={{ position: "relative", height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: 12 }}>
                <div style={{
                  position: "absolute",
                  left:   `${Math.min(((data.p25 - data.min) / (data.max - data.min)) * 100, 100)}%`,
                  width:  `${Math.min(((data.p75 - data.p25) / (data.max - data.min)) * 100, 100)}%`,
                  height: "100%", background: "#2563eb", borderRadius: 4,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                <span>{toL(data.min)} — bottom</span>
                <span>{toL(data.p25)} — 25th percentile</span>
                <span>{toL(data.p75)} — 75th percentile</span>
                <span>{toL(data.max)} — top</span>
              </div>
            </div>

            {/* Role + location */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#1d4ed8" }}>
              Showing salary data for <strong>{data.job_title}</strong>
              {data.location ? ` in ${data.location}` : " across all locations"}
            </div>
          </>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Recommended Courses to Boost Your Salary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {courses.map((c: any, i: number) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: 10, textDecoration: "none", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0f172a", marginBottom: 2 }}>{c.title}</p>
                    <p style={{ fontSize: 12, color: "#64748b" }}>{c.provider} · {c.duration}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>Free</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}