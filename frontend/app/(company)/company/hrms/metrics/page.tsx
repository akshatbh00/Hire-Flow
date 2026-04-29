"use client";
// frontend/app/(company)/company/hrms/metrics/page.tsx

import { useEffect, useState } from "react";
import { hrmsApi, HRMSMetricsOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HRMSMetricsPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();

  const [metrics, setMetrics] = useState<HRMSMetricsOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    hrmsApi.metrics()
      .then(setMetrics)
      .catch((e) => setError(e.message ?? "Could not load metrics"))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate totals
  const totals = metrics.reduce(
    (acc, m) => ({
      jobs:  acc.jobs  + m.total_assigned_jobs,
      apps:  acc.apps  + m.total_applications,
      offers:acc.offers+ m.offers_made,
      hired: acc.hired + m.selected,
    }),
    { jobs: 0, apps: 0, offers: 0, hired: 0 }
  );

  if (loading) return <Skeleton />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/recruiter-dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            { href: "/recruiter-dashboard",  label: "Dashboard" },
            { href: "/company/hrms/members", label: "Team" },
            { href: "/company/hrms/jobs",    label: "Jobs" },
            { href: "/company/hrms/metrics", label: "Metrics", active: true },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "H"}
            </div>
            <button onClick={() => { logout(); router.push("/login"); }}
              style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>HR Performance</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Recruiter metrics across your hiring team</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Roles",    value: totals.jobs,   color: "#2563eb" },
            { label: "Applications",   value: totals.apps,   color: "#0f172a" },
            { label: "Offers Made",    value: totals.offers, color: "#7c3aed" },
            { label: "Hired",          value: totals.hired,  color: "#16a34a" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Per-recruiter breakdown */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Recruiter Breakdown</p>
          </div>

          {metrics.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>
              No recruiter data yet. Assign recruiters to jobs to start tracking metrics.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Recruiter", "Jobs", "Applications", "Offers", "Hired", "Offer Rate", "Avg Time to Hire"].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => {
                  const offerRate = m.total_applications > 0
                    ? ((m.offers_made / m.total_applications) * 100).toFixed(1)
                    : "—";
                  return (
                    <tr key={m.member_id} style={{ borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                            {m.full_name[0].toUpperCase()}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{m.full_name}</p>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{m.total_assigned_jobs}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#64748b" }}>{m.total_applications}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#7c3aed", fontWeight: 600 }}>{m.offers_made}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: m.selected > 0 ? "#f0fdf4" : "#f8fafc", color: m.selected > 0 ? "#16a34a" : "#94a3b8" }}>
                          {m.selected}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#64748b" }}>
                        {offerRate === "—" ? "—" : `${offerRate}%`}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#64748b" }}>
                        {m.avg_time_to_hire_days != null ? `${m.avg_time_to_hire_days}d` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", opacity: 0.4 }} />))}
        </div>
      </div>
    </div>
  );
}