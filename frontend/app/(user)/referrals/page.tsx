"use client";

import { useEffect, useState } from "react";
import { referralsApi } from "@/lib/api";
import Link from "next/link";

export default function ReferralsPage() {
  const [refs,    setRefs]    = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      referralsApi.list().catch(() => []),
      referralsApi.stats().catch(() => null),
    ]).then(([r, s]) => { setRefs(r); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  function copy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#fffbeb", color: "#b45309" },
    completed: { bg: "#f0fdf4", color: "#16a34a" },
    expired:   { bg: "#fef2f2", color: "#dc2626" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/dashboard"    style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/jobs"         style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Jobs</Link>
          <Link href="/referrals"    style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Referrals</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Referral Links</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Share job links and earn rewards when candidates get hired</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Referrals", value: stats.total ?? 0,     color: "#2563eb" },
              { label: "Completed",       value: stats.completed ?? 0, color: "#16a34a" },
              { label: "Rewards Earned",  value: stats.rewards ?? 0,   color: "#7c3aed" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px" }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginBottom: 12 }}>✦ How Referrals Work</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { step: "1", text: "Browse jobs and generate a referral link for any role" },
              { step: "2", text: "Share the link with friends or on social media" },
              { step: "3", text: "Earn rewards when your referral gets hired" },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step}</div>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 80 }} />)}
          </div>
        ) : refs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔗</p>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>No referral links yet</p>
            <Link href="/jobs" style={{ background: "#2563eb", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Browse Jobs to Refer →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {refs.map((ref: any) => {
              const cfg = STATUS_CONFIG[ref.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={ref.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Referral Code: <span style={{ color: "#2563eb", fontFamily: "monospace" }}>{ref.referral_code}</span></p>
                    <p style={{ fontSize: 12, color: "#94a3b8", wordBreak: "break-all" }}>{ref.referral_url}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                      {ref.status}
                    </span>
                    <button onClick={() => copy(ref.referral_url, ref.id)}
                      style={{ padding: "8px 16px", background: copied === ref.id ? "#f0fdf4" : "#eff6ff", color: copied === ref.id ? "#16a34a" : "#2563eb", border: `1px solid ${copied === ref.id ? "#bbf7d0" : "#bfdbfe"}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {copied === ref.id ? "Copied ✓" : "Copy Link"}
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