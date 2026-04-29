"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { jobsApi, pipelineApi } from "@/lib/api";
import Link from "next/link";

export default function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const searchParams    = useSearchParams();
  const jobId           = searchParams.get("job") ?? "";

  const [candidate, setCandidate] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [moving,    setMoving]    = useState(false);
  const [moved,     setMoved]     = useState(false);
  const [stage,     setStage]     = useState("");
  const [error,     setError]     = useState("");

  const STAGES = [
    "ats_screening", "round_1", "round_2",
    "round_3", "hr_round", "offer", "selected", "ats_rejected",
  ];

  const STAGE_LABELS: Record<string, string> = {
    ats_screening: "ATS Screening",
    round_1:       "Round 1",
    round_2:       "Round 2",
    round_3:       "Round 3",
    hr_round:      "HR Round",
    offer:         "Offer",
    selected:      "Selected",
    ats_rejected:  "Rejected",
  };

  useEffect(() => {
    if (!jobId) return;
    jobsApi.candidates(jobId)
      .then((candidates) => {
        const found = candidates.find((c) => c.user_id === candidateId);
        setCandidate(found ?? null);
      })
      .catch(() => setCandidate(null))
      .finally(() => setLoading(false));
  }, [candidateId, jobId]);

  async function handleMove() {
    if (!stage || !candidate) return;
    setMoving(true); setError("");
    try {
      await pipelineApi.move(candidate.resume_id, stage);
      setMoved(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to move candidate.");
    } finally {
      setMoving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Hire<span style={{ color: "#2563eb" }}>Flow</span>
        </div>
      </div>
    </div>
  );

  if (!candidate) return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 16, color: "#94a3b8", marginBottom: 16 }}>Candidate not found</p>
        <Link href="/company/candidates" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>← Back to Candidates</Link>
      </div>
    </div>
  );

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
          <Link href="/recruiter-dashboard"  style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/company/candidates"   style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Candidates</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: "#94a3b8" }}>
          <Link href="/company/candidates" style={{ color: "#2563eb", textDecoration: "none" }}>← Candidates</Link>
          <span>/</span>
          <span>{candidate.full_name}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Header card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {candidate.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  {candidate.full_name}
                </h1>
                <p style={{ fontSize: 13, color: "#64748b" }}>{candidate.email}</p>
              </div>
            </div>

            {/* Score cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Match Score", val: candidate.match_score != null ? `${Math.round(candidate.match_score)}%` : "—", color: candidate.match_score >= 70 ? "#16a34a" : "#f59e0b" },
                { label: "ATS Score",   val: candidate.ats_score   != null ? `${Math.round(candidate.ats_score)}`   : "—", color: "#2563eb" },
                { label: "Profile",     val: candidate.resume_id   ? "Resume on file" : "No resume",                        color: candidate.resume_id ? "#16a34a" : "#94a3b8" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Move stage */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
              Move to Stage
            </h2>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
                {error}
              </div>
            )}

            {moved ? (
              <div style={{ padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
                ✓ Candidate moved to {STAGE_LABELS[stage] ?? stage}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStage(s)}
                      style={{
                        padding:      "8px 16px",
                        borderRadius: 10,
                        border:       `1px solid ${stage === s ? "#2563eb" : "#e2e8f0"}`,
                        background:   stage === s ? "#eff6ff" : "#fff",
                        color:        stage === s ? "#2563eb" : "#374151",
                        fontSize:     13,
                        fontWeight:   stage === s ? 600 : 400,
                        cursor:       "pointer",
                        fontFamily:   "inherit",
                        transition:   "all 0.15s",
                      }}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleMove}
                  disabled={!stage || moving}
                  style={{
                    padding:      "10px 24px",
                    background:   !stage || moving ? "#e2e8f0" : "#2563eb",
                    color:        !stage || moving ? "#94a3b8" : "#fff",
                    border:       "none",
                    borderRadius: 10,
                    fontSize:     14,
                    fontWeight:   600,
                    cursor:       !stage || moving ? "not-allowed" : "pointer",
                    fontFamily:   "inherit",
                    transition:   "all 0.15s",
                  }}
                >
                  {moving ? "Moving..." : "Confirm Move →"}
                </button>
              </>
            )}
          </div>

          {/* View pipeline */}
          {jobId && (
            <Link
              href={`/company/jobs/${jobId}/pipeline`}
              style={{ display: "block", textAlign: "center", padding: "12px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, color: "#2563eb", textDecoration: "none", background: "#fff", fontWeight: 500 }}
            >
              View Full Pipeline for this Job →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}