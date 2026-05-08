"use client";
//frontend/app/(user)/resume/page.tsx
import { useEffect, useState, useRef } from "react";
import { resumeApi, ResumeOut } from "@/lib/api";
import AtsScoreDisplay from "@/components/resume/ats-score-display";
import Link from "next/link";

export default function ResumePage() {
  const [resume,    setResume]    = useState<ResumeOut | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadResume(); }, []);

  async function loadResume() {
    try {
      const r = await resumeApi.me();
      setResume(r);
    } catch {
      setResume(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await resumeApi.upload(file);
      setTimeout(loadResume, 3000);
    } finally {
      setUploading(false);
    }
  }

  const parsed = resume?.parsed_data;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { href: "/dashboard",    label: "Dashboard" },
            { href: "/jobs",         label: "Jobs" },
            { href: "/applications", label: "Applications" },
            { href: "/resume",       label: "Resume", active: true },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: l.active ? 600 : 400, color: l.active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>My Resume</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>AI analysis + ATS report</p>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ padding: "10px 20px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
            >
              {uploading ? "Uploading..." : resume ? "Replace Resume" : "Upload Resume"}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, height: 180 }} />
            ))}
          </div>

        ) : !resume ? (
          <div
            onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
            onDragLeave={()  => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${dragging ? "#2563eb" : "#e2e8f0"}`, borderRadius: 16, padding: "80px 40px", textAlign: "center", cursor: "pointer", background: dragging ? "#eff6ff" : "#fff", transition: "all 0.2s" }}
          >
            <p style={{ fontSize: 32, color: "#cbd5e1", marginBottom: 12 }}>↑</p>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#64748b", marginBottom: 6 }}>Drop your resume or click to upload</p>
            <p style={{ fontSize: 13, color: "#cbd5e1" }}>PDF · DOCX</p>
          </div>

        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

            {/* Left — parsed info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Identity */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{parsed?.name ?? "—"}</h2>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{parsed?.current_title ?? ""}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{parsed?.email ?? ""}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", letterSpacing: "-0.02em" }}>
                      {parsed?.total_experience_years ?? 0}
                    </p>
                    <p style={{ fontSize: 11, color: "#94a3b8" }}>yrs exp</p>
                  </div>
                </div>

                {(parsed?.skills?.length ?? 0) > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Skills</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {parsed?.skills?.slice(0, 20).map((s: string) => (
                        <span key={s} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, background: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe" }}>
                          {s}
                        </span>
                      ))}
                      {parsed.skills.length > 20 && (
                        <span style={{ fontSize: 12, color: "#94a3b8", padding: "3px 6px" }}>
                          +{parsed.skills.length - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Experience */}
              {parsed?.experience?.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Experience</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {parsed.experience.map((exp: any, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{exp.title}</p>
                          <p style={{ fontSize: 12, color: "#64748b" }}>{exp.company}</p>
                          {exp.duration_months && (
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              {Math.round(exp.duration_months / 12 * 10) / 10} yrs
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsed?.education?.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Education</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {parsed.education.map((edu: any, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2e8f0", marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{edu.degree}</p>
                          <p style={{ fontSize: 12, color: "#64748b" }}>{edu.institution}</p>
                          {edu.year && <p style={{ fontSize: 11, color: "#94a3b8" }}>{edu.year}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — ATS + actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {resume.ats_report && <AtsScoreDisplay report={resume.ats_report} />}

              {resume.file_url && (
                
                  <a href={resume.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", textAlign: "center", padding: "12px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, color: "#64748b", textDecoration: "none", background: "#fff", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                >
                  Download Original ↓
                </a>
              )}

              <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe", borderRadius: 14, padding: "20px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 6 }}>✦ Premium Optimizer</p>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
                  Get exact section rewrites tailored to a specific job description.
                </p>
                <Link
                  href="/jobs"
                  style={{ display: "block", textAlign: "center", padding: "10px", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  Pick a Job to Tailor →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
