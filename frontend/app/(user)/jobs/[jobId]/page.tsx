"use client";
//frontend/app/(user)/jobs/[jobId]/page.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { jobsApi, applicationsApi, JobOut } from "@/lib/api";
import Link from "next/link";

/* ─── helpers ─────────────────────────────────────────── */
function toL(val: number) {
  const l = val / 100000;
  return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
}
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
const AC = [
  { bg: "#EEF2FF", text: "#4338CA", border: "#C7D7FE" },
  { bg: "#FDF2F8", text: "#9D174D", border: "#F9A8D4" },
  { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#FDF4FF", text: "#7E22CE", border: "#E9D5FF" },
];
function pickColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AC[Math.abs(h) % AC.length];
}

/* ─── description parser ──────────────────────────────── */
function parseDescription(raw: string): { title: string; items: string[] }[] {
  if (!raw) return [];
  const SECTION_RE = /^(Job\s+Title|Job\s+Summary|Summary|About\s+(?:the\s+)?(?:Role|Company|Us)|Key\s+Responsibilities|Responsibilities|Requirements|Qualifications|What\s+You.ll\s+Do|What\s+We.re\s+Looking\s+For|What\s+We\s+Offer|Benefits|Skills|Experience|Education|About\s+You)\s*:/i;
  const normalized = raw
    .replace(/\s{2,}/g, "\n")
    .replace(/(Job Title|Job Summary|Key Responsibilities|Requirements|Qualifications|What You'll Do|What We're Looking For|What We Offer|Benefits)\s*:/gi, "\n$1:")
    .trim();
  const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 2) {
    const sentences = raw.split(/\.\s+/).filter((s) => s.trim().length > 10);
    return [{ title: "About this role", items: sentences.map((s) => s.trim()) }];
  }
  const sections: { title: string; items: string[] }[] = [];
  let cur: { title: string; items: string[] } | null = null;
  for (const line of lines) {
    const m = line.match(SECTION_RE);
    if (m) {
      if (cur && cur.items.length > 0) sections.push(cur);
      const rest = line.slice(m[0].length).trim();
      cur = { title: m[1].replace(/\s+/g, " "), items: rest ? [rest] : [] };
    } else if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
      const item = line.replace(/^[-•*\d.]\s+/, "").trim();
      if (cur) cur.items.push(item);
      else cur = { title: "Details", items: [item] };
    } else {
      if (!cur) cur = { title: "Overview", items: [] };
      if (cur.items.length > 0 && line.length < 80 && !line.endsWith("."))
        cur.items[cur.items.length - 1] += " " + line;
      else cur.items.push(line);
    }
  }
  if (cur && cur.items.length > 0) sections.push(cur);
  return sections.filter((s) => s.items.length > 0);
}

/* ─── company blurb — max 2 sentences, hard cap 200 chars ─── */
function extractBlurb(raw: string, companyName: string): string | null {
  if (!raw) return null;
  const aboutM = raw.match(/About\s+(?:Us|the\s+Company|[A-Z][^:]{0,40})\s*:\s*([^\n]{40,})/i);
  if (aboutM) {
    const t = aboutM[1].trim();
    const out = t.split(/\.\s+/).slice(0, 2).join(". ").trim();
    const capped = out.length > 200 ? out.slice(0, 197) + "…" : out;
    return capped + (capped.endsWith(".") ? "" : ".");
  }
  const first = companyName.toLowerCase().split(" ")[0];
  const relevant = raw.split(/\.\s+/).slice(0, 8).find((s) =>
    s.toLowerCase().includes(first) ||
    /\b(we (are|were|offer|provide|build|help)|founded|headquartered)\b/i.test(s)
  );
  if (relevant && relevant.trim().length > 30) {
    const t = relevant.trim();
    const capped = t.length > 200 ? t.slice(0, 197) + "…" : t;
    return capped + ".";
  }
  return null;
}

/* ─── Avatar sub-component ───────────────────────────── */
function Avatar({ name, color, size, radius, fz = 12 }: {
  name: string; color: { bg: string; text: string; border: string };
  size: number; radius: number; fz?: number;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: fz, fontWeight: 700,
    }}>
      {getInitials(name)}
    </div>
  );
}

/* ─── Pill tag ────────────────────────────────────────── */
function Pill({ children, color, small }: {
  children: React.ReactNode;
  color: "indigo" | "slate" | "green" | "amber";
  small?: boolean;
}) {
  const s = {
    indigo: { bg: "#EEF2FF", text: "#4338CA" },
    slate:  { bg: "#F1F5F9", text: "#475569" },
    green:  { bg: "#F0FDF4", text: "#15803D" },
    amber:  { bg: "#FFFBEB", text: "#92400E" },
  }[color];
  return (
    <span style={{
      fontSize: small ? 10 : 12, fontWeight: 500,
      padding: small ? "2px 7px" : "3px 10px",
      borderRadius: 20, background: s.bg, color: s.text,
    }}>
      {children}
    </span>
  );
}

/* ─── Apply card ──────────────────────────────────────── */
function ApplyCard({ applied, applying, error, job, onApply, toL }: {
  applied: boolean; applying: boolean; error: string;
  job: JobOut; onApply: () => void; toL: (v: number) => string;
}) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      {error && (
        <div style={{ marginBottom: 12, padding: "8px 11px", background: "#FEF2F2",
          border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>
          {error}
        </div>
      )}
      {applied ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center",
            background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9,
            padding: "10px", marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>✓</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Application Submitted</span>
          </div>
          <Link href="/applications" style={{ display: "block", textAlign: "center", padding: "8px",
            border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12,
            color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}>
            View in Applications →
          </Link>
        </div>
      ) : (
        <button onClick={onApply} disabled={applying} className="apply-btn" style={{
          width: "100%", padding: "11px",
          background: applying ? "#A5B4FC" : "#4F46E5",
          color: "#fff", border: "none", borderRadius: 9,
          fontSize: 13, fontWeight: 700, cursor: applying ? "not-allowed" : "pointer",
          fontFamily: "inherit", letterSpacing: "-0.01em",
        }}>
          {applying ? "Submitting…" : "Apply Now →"}
        </button>
      )}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
        {[
          { label: "Job type", val: job.job_type },
          { label: "Location", val: job.location || "Not specified" },
          { label: "Remote",   val: job.remote_ok ? "Yes" : "No" },
          ...(job.salary_min ? [{ label: "Salary", val: `₹${toL(job.salary_min)}${job.salary_max ? `–${toL(job.salary_max)}` : "+"}` }] : []),
        ].map(({ label, val }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, fontSize: 12 }}>
            <span style={{ color: "#94A3B8" }}>{label}</span>
            <span style={{ color: "#0F172A", fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────── */
export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const [job,        setJob]        = useState<JobOut | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [applying,   setApplying]   = useState(false);
  const [applied,    setApplied]    = useState(false);
  const [error,      setError]      = useState("");
  const [insiders,   setInsiders]   = useState<any[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [similar,    setSimilar]    = useState<JobOut[]>([]);

  useEffect(() => { loadJob(); checkApplied(); loadInsiders(); }, [jobId]);

  async function loadInsiders() {
    try {
      const token = localStorage.getItem("hf_token");
      const res = await fetch(`http://localhost:8001/api/v1/insider/job/${jobId}/insiders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInsiders(await res.json());
    } catch {}
  }

  async function requestReferral(insiderId: string) {
    setRequesting(insiderId);
    try {
      const token = localStorage.getItem("hf_token");
      await fetch(`http://localhost:8001/api/v1/insider/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ insider_id: insiderId, job_id: jobId, message: "Hi, I'd love a referral for this role!" }),
      });
      setRequestMsg("Referral request sent!");
    } catch { setRequestMsg("Failed to send request."); }
    finally { setRequesting(null); }
  }

  async function loadJob() {
    try {
      const data = await jobsApi.get(jobId);
      setJob(data);
      try {
        const all = await jobsApi.list({ job_type: data.job_type, limit: 12 });
        setSimilar(all.filter((j: JobOut) => j.id !== jobId).slice(0, 8));
      } catch {}
    } catch {}
    finally { setLoading(false); }
  }

  async function checkApplied() {
    try {
      const apps = await applicationsApi.list();
      setApplied(apps.some((a) => a.job_id === jobId));
    } catch {}
  }

  async function handleApply() {
    setApplying(true); setError("");
    try {
      await applicationsApi.apply(jobId);
      setApplied(true);
    } catch (e: any) {
      if (e.message?.includes("Already applied")) setApplied(true);
      else setError(e.message ?? "Failed to apply.");
    } finally { setApplying(false); }
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .card { background:#fff; border:1px solid #E2E8F0; border-radius:14px; padding:18px 20px; }
    .detail-grid { display:grid; grid-template-columns:1fr; gap:14px; }
    .sidebar { display:none; }
    .mobile-apply { display:block; }
    @media (min-width:700px) {
      .detail-grid { grid-template-columns:minmax(0,1fr) 252px; align-items:start; }
      .sidebar { display:flex; flex-direction:column; gap:12px; position:sticky; top:62px; }
      .mobile-apply { display:none; }
    }
    .no-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
    .no-scrollbar::-webkit-scrollbar { display:none; }
    .sim-card { transition:border-color 0.12s,transform 0.12s; }
    .sim-card:hover { border-color:#C7D7FE !important; transform:translateY(-1px); }
    .apply-btn { transition:background 0.12s,transform 0.1s; }
    .apply-btn:hover:not(:disabled) { background:#4338CA !important; }
    .apply-btn:active:not(:disabled) { transform:scale(0.98); }
    .insider-row { transition:background 0.1s; }
    .insider-row:hover { background:#F1F5F9 !important; }
    .ask-btn:hover { background:#EEF2FF !important; }
    .nav-lnk { transition:color 0.12s; }
    .nav-lnk:hover { color:#0F172A !important; }
  `;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>
      <span style={{ fontSize: 14, color: "#94A3B8" }}>Loading…</span>
    </div>
  );

  if (!job) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>
      <p style={{ fontSize: 14, color: "#94A3B8" }}>Job not found.</p>
      <Link href="/jobs" style={{ color: "#4F46E5", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>← Back to Jobs</Link>
    </div>
  );

  const company  = job.company_name || "Company";
  const color    = pickColor(company);
  const sections = parseDescription(job.description || "");
  const blurb    = extractBlurb(job.description || "", company);
  const score    = job.match_score != null ? Math.round(job.match_score) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{CSS}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px", height: 54,
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 2 }}>
          {[
            { href: "/dashboard",    label: "Dashboard" },
            { href: "/jobs",         label: "Jobs",  active: true },
            { href: "/applications", label: "Applications" },
            { href: "/resume",       label: "Resume" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="nav-lnk" style={{
              fontSize: 13, fontWeight: l.active ? 600 : 400,
              color: l.active ? "#4F46E5" : "#64748B",
              textDecoration: "none", padding: "5px 10px", borderRadius: 8,
              background: l.active ? "#EEF2FF" : "transparent",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 940, margin: "0 auto", padding: "22px 16px", width: "100%" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, fontSize: 13 }}>
          <Link href="/jobs" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}>← Jobs</Link>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", maxWidth: "55vw" }}>{job.title}</span>
        </div>

        <div className="detail-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

            {/* Job header */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 13, flexWrap: "wrap" }}>
                <Avatar name={company} color={color} size={46} radius={11} fz={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A",
                    letterSpacing: "-0.03em", marginBottom: 3, lineHeight: 1.3 }}>
                    {job.title}
                  </h1>
                  <p style={{ fontSize: 12, color: "#64748B" }}>{company}</p>
                </div>
                {score != null && (
                  <div style={{ flexShrink: 0, textAlign: "center",
                    background: score >= 80 ? "#ECFDF5" : score >= 60 ? "#EEF2FF" : "#F1F5F9",
                    border: `1.5px solid ${score >= 80 ? "#6EE7B7" : score >= 60 ? "#C7D7FE" : "#E2E8F0"}`,
                    borderRadius: 10, padding: "7px 13px" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em",
                      color: score >= 80 ? "#065F46" : score >= 60 ? "#4338CA" : "#475569" }}>
                      {score}%
                    </div>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500 }}>match</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 13 }}>
                <Pill color="indigo">{job.job_type}</Pill>
                {job.location && <Pill color="slate">{job.location}</Pill>}
                {job.remote_ok && <Pill color="green">Remote OK</Pill>}
                {job.salary_min && (
                  <Pill color="amber">₹{toL(job.salary_min)}{job.salary_max ? `–${toL(job.salary_max)}` : "+"}</Pill>
                )}
              </div>
            </div>

            {/* Apply card — mobile only */}
            <div className="mobile-apply">
              <ApplyCard applied={applied} applying={applying} error={error}
                job={job} onApply={handleApply} toL={toL} />
            </div>

            {/* Description */}
            <div className="card">
              <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Job Description
              </p>
              {sections.length === 0
                ? <p style={{ fontSize: 13, color: "#64748B" }}>No description provided.</p>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {sections.map((sec, si) => (
                      <div key={si}>
                        {!["Overview", "Details"].includes(sec.title) && (
                          <p style={{ fontSize: 10, fontWeight: 600, color: "#4F46E5",
                            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                            {sec.title}
                          </p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {sec.items.map((item, ii) => (
                            <div key={ii} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              {sec.items.length > 1 && (
                                <div style={{ width: 4, height: 4, borderRadius: "50%",
                                  background: "#C7D7FE", flexShrink: 0, marginTop: 8 }} />
                              )}
                              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Similar roles */}
            {similar.length > 0 && (
              <div className="card" style={{ overflow: "hidden", paddingBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Similar Roles
                </p>
                <div className="no-scrollbar"
                  style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 2 }}>
                  {similar.map((sj) => {
                    const sjc = pickColor(sj.company_name || "Co");
                    return (
                      <Link key={sj.id} href={`/jobs/${sj.id}`} className="sim-card" style={{
                        flexShrink: 0, width: 155,
                        display: "flex", flexDirection: "column", gap: 7,
                        background: "#F8FAFC", border: "1px solid #E2E8F0",
                        borderRadius: 11, padding: "11px 12px", textDecoration: "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={sj.company_name || "Co"} color={sjc} size={22} radius={5} fz={8} />
                          <p style={{ fontSize: 10, color: "#64748B", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {sj.company_name || "Company"}
                          </p>
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", lineHeight: 1.35,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {sj.title}
                        </p>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <Pill color="indigo" small>{sj.job_type}</Pill>
                          {sj.location && <Pill color="slate" small>{sj.location.split(",")[0]}</Pill>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR (desktop only via CSS) ── */}
          <div className="sidebar">

            <ApplyCard applied={applied} applying={applying} error={error}
              job={job} onApply={handleApply} toL={toL} />

            <Link href="/jobs" style={{ display: "block", textAlign: "center", padding: "8px",
              border: "1px solid #E2E8F0", borderRadius: 10,
              fontSize: 13, color: "#64748B", textDecoration: "none" }}>
              ← Back to Jobs
            </Link>

            {/* Company blurb */}
            {blurb && (
              <div className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <Avatar name={company} color={color} size={30} radius={8} fz={10} />
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8",
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>About</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{company}</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{blurb}</p>
              </div>
            )}

            {/* Insiders */}
            {insiders.length > 0 && (
              <div className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#4F46E5" }}>✦ Insiders</span>
                  <span style={{ fontSize: 10, fontWeight: 600, background: "#EEF2FF",
                    color: "#4338CA", padding: "1px 7px", borderRadius: 20 }}>
                    {insiders.length}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 10 }}>Open to refer at this company</p>
                {requestMsg && (
                  <p style={{ fontSize: 11, color: "#16A34A", marginBottom: 8, fontWeight: 500 }}>{requestMsg}</p>
                )}
                {insiders.map((ins: any) => (
                  <div key={ins.user_id} className="insider-row" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 6, padding: "7px 9px", background: "#F8FAFC", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EEF2FF",
                        color: "#4338CA", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {ins.full_name?.[0]?.toUpperCase()}
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>{ins.full_name}</p>
                    </div>
                    <button onClick={() => requestReferral(ins.user_id)}
                      disabled={requesting === ins.user_id}
                      className="ask-btn" style={{
                        padding: "4px 10px", background: "#F1F5F9", color: "#4F46E5",
                        border: "1px solid #C7D7FE", borderRadius: 7,
                        fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        transition: "background 0.1s",
                      }}>
                      {requesting === ins.user_id ? "…" : "Ask"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}