"use client";
// frontend/app/(user)/referrals/page.tsx
import { useEffect, useState } from "react";
import { referralsApi, jobsApi, JobOut } from "@/lib/api";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFFBEB", color: "#92400E", label: "Pending" },
  completed: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  expired:   { bg: "#FEF2F2", color: "#DC2626", label: "Expired" },
};

export default function ReferralsPage() {
  const [refs,      setRefs]      = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState<string | null>(null);

  // Generate referral
  const [jobs,      setJobs]      = useState<JobOut[]>([]);
  const [search,    setSearch]    = useState("");
  const [searching, setSearching] = useState(false);
  const [generating,setGenerating]= useState<string | null>(null);
  const [showSearch,setShowSearch]= useState(false);

  useEffect(() => {
    Promise.all([
      referralsApi.list().catch(() => []),
      referralsApi.stats().catch(() => null),
    ]).then(([r, s]) => { setRefs(r); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  async function searchJobs(q: string) {
    setSearch(q);
    if (q.trim().length < 2) { setJobs([]); return; }
    setSearching(true);
    try {
      const res = await jobsApi.list({ search: q, limit: 8 });
      setJobs(res);
    } catch { setJobs([]); }
    finally { setSearching(false); }
  }

  async function generateReferral(jobId: string) {
    setGenerating(jobId);
    try {
      const ref = await referralsApi.create(jobId);
      setRefs(prev => [ref, ...prev]);
      setShowSearch(false);
      setSearch("");
      setJobs([]);
    } catch {}
    finally { setGenerating(null); }
  }

  function copy(url: string, id: string) {
    // Fix localhost port
    const fixedUrl = url.replace("localhost:3000", "localhost:3001");
    navigator.clipboard.writeText(fixedUrl);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .nav-lnk{transition:color 0.12s}
        .nav-lnk:hover{color:#0F172A!important}
        .job-row{transition:background 0.1s;cursor:pointer}
        .job-row:hover{background:#F1F5F9!important}
        .ref-card{transition:border-color 0.12s}
        .ref-card:hover{border-color:#C7D7FE!important}
        .copy-btn{transition:all 0.12s}
      `}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 2 }}>
          {[
            { href: "/dashboard",    label: "Dashboard" },
            { href: "/jobs",         label: "Jobs" },
            { href: "/applications", label: "Applications" },
            { href: "/referrals",    label: "Referrals", active: true },
          ].map(l => (
            <Link key={l.href} href={l.href} className="nav-lnk" style={{
              fontSize: 13, fontWeight: (l as any).active ? 600 : 400,
              color: (l as any).active ? "#4F46E5" : "#64748B",
              textDecoration: "none", padding: "5px 10px", borderRadius: 8,
              background: (l as any).active ? "#EEF2FF" : "transparent",
            }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", width: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Referral Links</h1>
            <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 3 }}>Share jobs and earn rewards when candidates get hired</p>
          </div>
          <button onClick={() => setShowSearch(s => !s)} style={{
            padding: "8px 18px", background: "#4F46E5", color: "#fff",
            border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            + Generate Link
          </button>
        </div>

        {/* Generate referral panel */}
        {showSearch && (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Search a job to generate a referral link</p>
            <div style={{ position: "relative", marginBottom: jobs.length > 0 ? 10 : 0 }}>
              <input
                value={search}
                onChange={e => searchJobs(e.target.value)}
                placeholder="Search job title..."
                style={{ width: "100%", padding: "9px 14px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#0F172A", background: "#F8FAFC" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#4F46E5"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
              />
              {searching && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>searching…</span>}
            </div>
            {jobs.length > 0 && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                {jobs.map((job, i) => (
                  <div key={job.id} className="job-row" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 14px", borderBottom: i < jobs.length - 1 ? "1px solid #F1F5F9" : "none",
                    background: "#fff",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{job.company_name} · {job.location || "Remote"}</p>
                    </div>
                    <button
                      onClick={() => generateReferral(job.id)}
                      disabled={generating === job.id}
                      style={{
                        padding: "6px 14px", background: "#4F46E5", color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 12,
                      }}
                    >
                      {generating === job.id ? "…" : "Generate"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Total Referrals", value: stats.total      ?? 0, color: "#4F46E5" },
              { label: "Completed",       value: stats.completed  ?? 0, color: "#15803D" },
              { label: "Rewards Earned",  value: stats.rewards    ?? 0, color: "#7C3AED" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ background: "linear-gradient(135deg, #EEF2FF, #F0FDF4)", border: "1px solid #C7D7FE", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", marginBottom: 12 }}>✦ How Referrals Work</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {[
              { step: "1", text: "Search a job above and generate your personal referral link" },
              { step: "2", text: "Share the link with friends or on social media" },
              { step: "3", text: "Earn rewards when your referral gets hired" },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step}</div>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#E2E8F0", borderRadius: 12, height: 72, animation: "pulse 1.4s infinite" }} />)}
          </div>
        ) : refs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", border: "2px dashed #E2E8F0", borderRadius: 14, background: "#fff" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>No referral links yet — generate one above</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {refs.map((ref: any) => {
              const cfg = STATUS_CONFIG[ref.status] ?? STATUS_CONFIG.pending;
              const url = (ref.referral_url ?? "").replace("localhost:3000", "localhost:3001");
              return (
                <div key={ref.id} className="ref-card" style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                      Code: <span style={{ color: "#4F46E5", fontFamily: "monospace" }}>{ref.referral_code}</span>
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3B8", wordBreak: "break-all" }}>{url}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <button className="copy-btn" onClick={() => copy(url, ref.id)} style={{
                      padding: "6px 14px",
                      background: copied === ref.id ? "#F0FDF4" : "#EEF2FF",
                      color:      copied === ref.id ? "#15803D" : "#4F46E5",
                      border:     `1px solid ${copied === ref.id ? "#BBF7D0" : "#C7D7FE"}`,
                      borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {copied === ref.id ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}