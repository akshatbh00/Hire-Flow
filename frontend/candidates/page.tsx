"use client";

import { useEffect, useState } from "react";
import { jobsApi, CandidateOut } from "@/lib/api";
import Link from "next/link";

export default function CandidatesPage() {
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [candidates, setCandidates] = useState<CandidateOut[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    jobsApi.list({ limit: 50 }).then(setJobs).catch(() => {});
  }, []);

  async function loadCandidates(jobId: string) {
    setSelectedJob(jobId);
    setLoading(true);
    try {
      const res = await jobsApi.candidates(jobId);
      setCandidates(res);
    } catch { setCandidates([]); }
    finally  { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/recruiter-dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/recruiter-dashboard" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/company/jobs"        style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Jobs</Link>
          <Link href="/company/candidates"  style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Candidates</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Candidates</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Browse applicants by job role</p>
        </div>

        {/* Job selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => loadCandidates(job.id)}
              style={{
                padding:      "8px 16px",
                borderRadius: 10,
                border:       `1px solid ${selectedJob === job.id ? "#2563eb" : "#e2e8f0"}`,
                background:   selectedJob === job.id ? "#eff6ff" : "#fff",
                color:        selectedJob === job.id ? "#2563eb" : "#374151",
                fontSize:     13,
                fontWeight:   selectedJob === job.id ? 600 : 400,
                cursor:       "pointer",
                fontFamily:   "inherit",
                transition:   "all 0.15s",
              }}
            >
              {job.title}
            </button>
          ))}
          {jobs.length === 0 && (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>No jobs found. <Link href="/company/jobs/create" style={{ color: "#2563eb" }}>Post one →</Link></p>
          )}
        </div>

        {/* Candidates */}
        {!selectedJob ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Select a job above to view candidates</p>
          </div>

        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 120 }} />
            ))}
          </div>

        ) : candidates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No candidates for this role yet</p>
          </div>

        ) : (
          <>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              <strong style={{ color: "#0f172a" }}>{candidates.length}</strong> candidates
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {candidates.map((c) => (
                <Link
                  key={c.user_id}
                  href={`/candidates/${c.user_id}?job=${selectedJob}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", transition: "all 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  >
                    {/* Avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.full_name ?? "Unknown"}
                        </p>
                        <p style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.email}
                        </p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Match</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: c.match_score >= 70 ? "#16a34a" : "#f59e0b" }}>
                          {Math.round(c.match_score)}%
                        </p>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>ATS</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>
                          {Math.round(c.ats_score)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}