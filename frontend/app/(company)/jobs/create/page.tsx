"use client";
// frontend/app/(company)/jobs/create/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { jobsApi, JobCreate } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";

const JOB_TYPES = ["fulltime", "parttime", "contract", "internship", "remote"];

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL",
  "Java", "Go", "Rust", "AWS", "Docker", "Kubernetes", "Git",
  "Machine Learning", "Data Analysis", "Product Management",
  "Figma", "Communication", "Leadership",
];

/* ─── icon + sidebar (same as all recruiter pages) ────── */
function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  return null;
}

function SbLink({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className="sb-lnk" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 14px", fontSize: 12, textDecoration: "none",
      color: active ? "#4F46E5" : "#64748B",
      background: active ? "#EEF2FF" : "transparent",
      fontWeight: active ? 600 : 400,
      margin: "1px 6px", borderRadius: 8,
    }}>
      <Icon t={icon} />{label}
    </Link>
  );
}

/* ─── main page ───────────────────────────────────────── */
export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const [form, setForm] = useState({
    title:       "",
    description: "",
    job_type:    "fulltime",
    location:    "",
    remote_ok:   false,
    salary_min:  "",
    salary_max:  "",
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput,     setReqInput]     = useState("");
  const [skills,       setSkills]       = useState<string[]>([]);
  const [skillInput,   setSkillInput]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  function set(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addReq() {
    const t = reqInput.trim();
    if (t && !requirements.includes(t)) { setRequirements(r => [...r, t]); setReqInput(""); }
  }

  function addSkill(s?: string) {
    const t = (s ?? skillInput).trim();
    if (t && !skills.includes(t)) { setSkills(sk => [...sk, t]); setSkillInput(""); }
  }

  async function handleSubmit() {
    if (!form.title.trim())       { setError("Job title is required.");       return; }
    if (!form.description.trim()) { setError("Job description is required."); return; }
    if (skills.length === 0)      { setError("Add at least one required skill."); return; }

    setLoading(true); setError("");

    const body: JobCreate = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      requirements: [...requirements, ...skills], // merge skills into requirements for backend
      job_type:     form.job_type,
      location:     form.location.trim(),
      remote_ok:    form.remote_ok,
      salary_min:   form.salary_min ? Number(form.salary_min) * 100000 : undefined,
      salary_max:   form.salary_max ? Number(form.salary_max) * 100000 : undefined,
    };

    try {
      const job = await jobsApi.create(body);
      // Auto-approve the job so it shows up immediately
      await fetch(`http://localhost:8001/api/v1/jobs/${job.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("hf_token")}` },
      });
      router.push("/recruiter-jobs");
    } catch (e: any) {
      setError(e.message ?? "Failed to create job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sb-lnk{transition:background 0.1s,color 0.1s}
        .sb-lnk:hover{background:#F8FAFC!important;color:#0F172A!important}
        .inp:focus{border-color:#4F46E5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.08)!important}
        .skill-chip{transition:all 0.1s;cursor:pointer}
        .skill-chip:hover{background:#EEF2FF!important;border-color:#C7D7FE!important;color:#4338CA!important}
        .submit-btn{transition:background 0.12s}
        .submit-btn:hover:not(:disabled){background:#4338CA!important}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 210, background: "#fff", borderRight: "0.5px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "0.5px solid #F1F5F9" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </div>
        <div style={{ padding: "14px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
          <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard" />
          <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"       active />
          <SbLink href="/candidates"          icon="cands" label="Candidates" />
          <SbLink href="/candidates"          icon="pipe"  label="Pipeline" />
        </div>
        <div style={{ padding: "10px 6px 4px" }}>
          <div style={{ padding: "0 10px 6px", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tools</div>
          <SbLink href="/referrals" icon="ref" label="Referrals" />
        </div>
        <div style={{ marginTop: "auto", padding: "12px 6px", borderTop: "0.5px solid #F1F5F9" }}>
          <SbLink href="/settings" icon="settings" label="Settings" />
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", marginTop: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name ?? "Recruiter"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Link href="/recruiter-jobs" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}>← Jobs</Link>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span style={{ color: "#0F172A", fontWeight: 600 }}>Post a Job</span>
          </div>
        </div>

        <main style={{ maxWidth: 700, margin: "0 auto", padding: "28px 24px" }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Post a New Job</h1>
            <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>Fill in the details below. The job will go live immediately.</p>
          </div>

          {error && (
            <div style={{ marginBottom: 18, padding: "11px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Title */}
            <Card label="Job Title" required>
              <input className="inp" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Senior Frontend Engineer" style={inp} />
            </Card>

            {/* Description */}
            <Card label="Job Description" required>
              <textarea className="inp" value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the role, responsibilities, and what success looks like..."
                rows={5} style={{ ...inp, resize: "vertical", lineHeight: 1.65 }} />
            </Card>

            {/* Skills — mandatory */}
            <Card label="Required Skills" required>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="inp" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="e.g. React, Python, SQL..."
                  style={{ ...inp, flex: 1 }} />
                <button onClick={() => addSkill()} style={addBtn}>Add</button>
              </div>

              {/* Quick-add common skills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: skills.length > 0 ? 12 : 0 }}>
                {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                  <button key={s} onClick={() => addSkill(s)} className="skill-chip" style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: "#F8FAFC", border: "1px solid #E2E8F0",
                    color: "#64748B", cursor: "pointer", fontFamily: "inherit",
                  }}>
                    + {s}
                  </button>
                ))}
              </div>

              {/* Added skills */}
              {skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {skills.map(s => (
                    <span key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 11px", borderRadius: 20, background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D7FE" }}>
                      {s}
                      <span onClick={() => setSkills(sk => sk.filter(x => x !== s))} style={{ cursor: "pointer", opacity: 0.6, fontSize: 14, lineHeight: 1 }}>×</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Requirements */}
            <Card label="Additional Requirements">
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input className="inp" value={reqInput} onChange={(e) => setReqInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addReq()}
                  placeholder="e.g. 3+ years experience, B.Tech CS..."
                  style={{ ...inp, flex: 1 }} />
                <button onClick={addReq} style={addBtn}>Add</button>
              </div>
              {requirements.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {requirements.map(r => (
                    <span key={r} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 11px", borderRadius: 20, background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                      {r}
                      <span onClick={() => setRequirements(prev => prev.filter(x => x !== r))} style={{ cursor: "pointer", opacity: 0.6, fontSize: 14, lineHeight: 1 }}>×</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Job details */}
            <Card label="Job Details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Job Type</label>
                  <select className="inp" value={form.job_type} onChange={(e) => set("job_type", e.target.value)}
                    style={{ ...inp, cursor: "pointer" }}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Location</label>
                  <input className="inp" value={form.location} onChange={(e) => set("location", e.target.value)}
                    placeholder="e.g. Bangalore, India" style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => set("remote_ok", !form.remote_ok)} style={{
                  width: 38, height: 21, borderRadius: 11,
                  background: form.remote_ok ? "#4F46E5" : "#E2E8F0",
                  cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}>
                  <div style={{ position: "absolute", top: 3, left: form.remote_ok ? 19 : 3, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Remote OK</span>
              </div>
            </Card>

            {/* Salary */}
            <Card label="Salary Range (in Lakhs/yr)">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Min (₹L)</label>
                  <input className="inp" type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)}
                    placeholder="e.g. 10" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Max (₹L)</label>
                  <input className="inp" type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)}
                    placeholder="e.g. 20" style={inp} />
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
              <button onClick={handleSubmit} disabled={loading} className="submit-btn" style={{
                flex: 1, padding: "12px",
                background: loading ? "#A5B4FC" : "#4F46E5",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}>
                {loading ? "Posting..." : "Post Job →"}
              </button>
              <Link href="/recruiter-jobs" style={{
                padding: "12px 22px", border: "1px solid #E2E8F0",
                borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: "#64748B", textDecoration: "none",
                display: "flex", alignItems: "center", background: "#fff",
              }}>
                Cancel
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────── */
function Card({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "18px 20px" }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 12 }}>
        {label}{required && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 13px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13, fontFamily: "'DM Sans',sans-serif",
  outline: "none", color: "#0F172A", background: "#fff",
  transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: "#64748B", display: "block", marginBottom: 5,
};

const addBtn: React.CSSProperties = {
  padding: "9px 16px", border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 12, fontWeight: 500, color: "#374151",
  background: "#fff", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
};