"use client";
//frontend/app/(auth)/onboarding/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, companyApi } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import StepJobType from "./step-job-type";
import StepUploadResume from "./step-upload-resume";

// ── Job seeker steps ──────────────────────────────────────────────────────────
const SEEKER_STEPS = ["Job Preferences", "Upload Resume"];

// ── Recruiter steps ───────────────────────────────────────────────────────────
const RECRUITER_STEPS = ["Company Setup", "Hiring Preferences"];

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education",
  "E-commerce", "Manufacturing", "Consulting", "Media", "Other",
];

export default function OnboardingPage() {
  const router      = useRouter();
  const { user }    = useUserStore();
  const isRecruiter = user?.role === "recruiter";

  const [step,  setStep]  = useState(0);
  const [error, setError] = useState("");

  // Recruiter state
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry,    setIndustry]    = useState("");
  const [website,     setWebsite]     = useState("");
  const [saving,      setSaving]      = useState(false);

  const STEPS = isRecruiter ? RECRUITER_STEPS : SEEKER_STEPS;

  // ── Job seeker handlers ────────────────────────────────────────────────────
  async function handleJobType(data: { job_titles: string[]; job_type: string }) {
    setError("");
    try {
      await authApi.onboarding({ ...data, locations: [] });
    } catch (e: any) {
      console.warn("Onboarding API error (non-fatal):", e.message);
    }
    setStep(1);
  }

  // ── Recruiter handlers ─────────────────────────────────────────────────────
  async function handleCompanySetup() {
    if (!companyName.trim()) { setError("Company name is required."); return; }
    setSaving(true); setError("");
    try {
      await companyApi.setup({
        name:     companyName.trim(),
        size:     companySize,
        industry: industry,
        website:  website.trim(),
      });
      setStep(1);
    } catch (e: any) {
      // non-fatal — continue anyway
      console.warn("Company setup error (non-fatal):", e.message);
      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  async function handleHiringPrefs() {
    router.push("/recruiter-dashboard");
  }

  return (
    <div style={{
      minHeight:  "100vh",
      background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f0fdf4 100%)",
      display:    "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20,
        border: "1px solid #e2e8f0", padding: "48px 40px",
        width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
      }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
              Hire<span style={{ color: "#2563eb" }}>Flow</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: isRecruiter ? "#f0fdf4" : "#eff6ff", color: isRecruiter ? "#16a34a" : "#2563eb", border: `1px solid ${isRecruiter ? "#bbf7d0" : "#bfdbfe"}` }}>
              {isRecruiter ? "Recruiter" : "Job Seeker"}
            </span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
            Setup · Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: i <= step ? "#2563eb" : "#e2e8f0", transition: "background 0.3s" }} />
              <span style={{ fontSize: 11, marginTop: 6, display: "block", color: i === step ? "#2563eb" : "#94a3b8", fontWeight: i === step ? 600 : 400 }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* ── JOB SEEKER FLOW ─────────────────────────────────────────────── */}
        {!isRecruiter && step === 0 && <StepJobType onNext={handleJobType} />}
        {!isRecruiter && step === 1 && <StepUploadResume onDone={() => router.push("/dashboard")} />}

        {/* ── RECRUITER FLOW ──────────────────────────────────────────────── */}
        {isRecruiter && step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Set up your company
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Tell us about your company to get started hiring.</p>
            </div>

            {/* Company name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                Company Name <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Technologies"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              />
            </div>

            {/* Website */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Website</label>
              <input
                value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              />
            </div>

            {/* Company size */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 10 }}>Company Size</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COMPANY_SIZES.map((s) => (
                  <button key={s} onClick={() => setCompanySize(s)}
                    style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${companySize === s ? "#2563eb" : "#e2e8f0"}`, background: companySize === s ? "#eff6ff" : "#fff", color: companySize === s ? "#2563eb" : "#374151", fontSize: 13, fontWeight: companySize === s ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 10 }}>Industry</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {INDUSTRIES.map((ind) => (
                  <button key={ind} onClick={() => setIndustry(ind)}
                    style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${industry === ind ? "#2563eb" : "#e2e8f0"}`, background: industry === ind ? "#eff6ff" : "#fff", color: industry === ind ? "#2563eb" : "#374151", fontSize: 13, fontWeight: industry === ind ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCompanySetup} disabled={saving}
              style={{ width: "100%", padding: "13px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? "Setting up..." : "Continue →"}
            </button>
          </div>
        )}

        {isRecruiter && step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>
                You're all set! 🎉
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                Your recruiter account is ready. You can now post jobs, review candidates, and manage your hiring pipeline.
              </p>
            </div>

            {/* Feature highlights */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📋", title: "Post Jobs",         desc: "Create job listings and set requirements" },
                { icon: "🤖", title: "AI Matching",       desc: "Candidates ranked by fit automatically" },
                { icon: "📊", title: "Pipeline View",     desc: "Kanban board to manage all applicants" },
                { icon: "✦",  title: "KAREN for Hiring",  desc: "AI assistant for talent decisions" },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px", background: "#f8fafc", borderRadius: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{title}</p>
                    <p style={{ fontSize: 12.5, color: "#64748b" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleHiringPrefs}
              style={{ width: "100%", padding: "13px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Go to Recruiter Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}