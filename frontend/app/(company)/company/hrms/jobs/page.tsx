"use client";
// frontend/app/(company)/company/hrms/jobs/page.tsx

import { useEffect, useState } from "react";
import { hrmsApi, HRMSJobOut, HRMSMemberOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  live:             { bg: "#f0fdf4", color: "#16a34a" },
  pending_approval: { bg: "#fffbeb", color: "#d97706" },
  draft:            { bg: "#f8fafc", color: "#64748b" },
  closed:           { bg: "#fef2f2", color: "#dc2626" },
  rejected:         { bg: "#fef2f2", color: "#dc2626" },
};

export default function HRMSJobsPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();

  const [jobs,       setJobs]       = useState<HRMSJobOut[]>([]);
  const [members,    setMembers]    = useState<HRMSMemberOut[]>([]);
  const [myProfile,  setMyProfile]  = useState<HRMSMemberOut | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [assigning,  setAssigning]  = useState<string | null>(null); // job_id being assigned
  const [assignData, setAssignData] = useState<Record<string, string>>({}); // job_id -> recruiter_member_id

  useEffect(() => {
    Promise.all([
      hrmsApi.me().catch(() => null),
      hrmsApi.jobs().catch(() => []),
      hrmsApi.members().catch(() => []),
    ]).then(([me, j, m]) => {
      setMyProfile(me);
      setJobs(j ?? []);
      setMembers((m ?? []).filter((x) => x.hrms_role === "recruiter"));
    }).finally(() => setLoading(false));
  }, []);

  async function handleAssign(job_id: string) {
    const recruiter_member_id = assignData[job_id];
    if (!recruiter_member_id) return;
    setAssigning(job_id);
    try {
      const updated = await hrmsApi.assignJob(job_id, recruiter_member_id);
      setJobs((prev) => prev.map((j) => (j.job_id === job_id ? updated : j)));
    } catch (e: any) {
      alert(e.message ?? "Assignment failed");
    } finally {
      setAssigning(null);
    }
  }

  const canAssign = myProfile?.hrms_role === "hiring_manager" || myProfile?.hrms_role === "company_admin";

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
            { href: "/company/hrms/jobs",    label: "Jobs", active: true },
            { href: "/company/hrms/metrics", label: "Metrics" },
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Job Assignments</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            {myProfile?.hrms_role === "recruiter"
              ? "Jobs assigned to you"
              : "Assign recruiters to open roles"}
          </p>
        </div>

        {/* Jobs table */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{jobs.length} Jobs</p>
          </div>

          {jobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>
              No jobs found.{" "}
              {myProfile?.hrms_role === "recruiter" && "No jobs have been assigned to you yet."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Job Title", "Status", "Hiring Manager", "Assigned Recruiter", canAssign ? "Assign" : ""].filter(Boolean).map((h) => (
                    <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => {
                  const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS.draft;
                  return (
                    <tr key={job.job_id} style={{ borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 24px" }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{job.title}</p>
                        <Link href={`/jobs/${job.job_id}/pipeline`} style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
                          View Pipeline →
                        </Link>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: sc.bg, color: sc.color }}>
                          {job.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#64748b" }}>
                        {job.assigned_hiring_manager ?? <span style={{ color: "#cbd5e1" }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#64748b" }}>
                        {job.assigned_recruiter ?? <span style={{ color: "#cbd5e1" }}>Unassigned</span>}
                      </td>
                      {canAssign && (
                        <td style={{ padding: "14px 24px" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                              value={assignData[job.job_id] ?? ""}
                              onChange={(e) => setAssignData((prev) => ({ ...prev, [job.job_id]: e.target.value }))}
                              style={{ fontSize: 13, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", background: "#fff", color: "#374151" }}>
                              <option value="">Select recruiter</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(job.job_id)}
                              disabled={!assignData[job.job_id] || assigning === job.job_id}
                              style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 8, border: "none", background: assignData[job.job_id] ? "#2563eb" : "#e2e8f0", color: assignData[job.job_id] ? "#fff" : "#94a3b8", cursor: assignData[job.job_id] ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                              {assigning === job.job_id ? "..." : "Assign"}
                            </button>
                          </div>
                        </td>
                      )}
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