"use client";
// frontend/app/(auth)/register/page.tsx  (recruiter flow)
// This replaces the existing register page with company search + join/create flow

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

const BASE = "http://localhost:8001/api/v1";

type Step = "account" | "company-choice" | "join-request" | "create-company" | "pending";

interface CompanyResult {
  id: string;
  name: string;
  slug: string;
  website?: string;
}

export default function RecruiterRegisterPage() {
  const router = useRouter();

  const [step,      setStep]      = useState<Step>("account");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Account fields
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [token,     setToken]     = useState("");

  // Company search
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected,  setSelected]  = useState<CompanyResult | null>(null);
  const [message,   setMessage]   = useState("");

  // Create company
  const [companyName, setCompanyName] = useState("");

  // ── Step 1: create account ──────────────────────────────────────────────
  async function handleCreateAccount() {
    if (!fullName.trim())      { setError("Name is required"); return; }
    if (!email.trim())         { setError("Email is required"); return; }
    if (password.length < 8)   { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await authApi.register({ full_name: fullName, email, password, role: "recruiter" });
      localStorage.setItem("hf_token", res.access_token);
      document.cookie = `hf_token=${res.access_token};path=/;max-age=${30*86400};SameSite=Lax`;
      document.cookie = `hf_role=${res.role};path=/;max-age=${30*86400};SameSite=Lax`;
      setToken(res.access_token);
      setStep("company-choice");
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
    } finally { setLoading(false); }
  }

  // ── Company search ──────────────────────────────────────────────────────
  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const t = localStorage.getItem("hf_token");
      const res = await fetch(`${BASE}/companies/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }

  // ── Submit join request ─────────────────────────────────────────────────
  async function handleJoinRequest() {
    if (!selected) return;
    setLoading(true); setError("");
    try {
      const t = localStorage.getItem("hf_token");
      const res = await fetch(`${BASE}/companies/${selected.id}/request-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to send request");
      }
      setStep("pending");
    } catch (e: any) {
      setError(e.message ?? "Failed to send join request");
    } finally { setLoading(false); }
  }

  // ── Create new company ──────────────────────────────────────────────────
  async function handleCreateCompany() {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setLoading(true); setError("");
    try {
      const t = localStorage.getItem("hf_token");
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const res = await fetch(`${BASE}/companies/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ name: companyName, slug }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create company");
      }
      router.push("/recruiter-dashboard");
    } catch (e: any) {
      setError(e.message ?? "Failed to create company");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #fff 50%, #F0FDF4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',-apple-system,sans-serif", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .inp{transition:border-color 0.15s,box-shadow 0.15s}
        .inp:focus{border-color:#4F46E5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.1)!important;outline:none}
        .company-row{transition:background 0.1s,border-color 0.1s;cursor:pointer}
        .company-row:hover{background:#F8FAFC!important;border-color:#C7D7FE!important}
        .btn-primary{transition:background 0.12s}
        .btn-primary:hover:not(:disabled){background:#4338CA!important}
      `}</style>

      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "44px 40px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.06)" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
              Hire<span style={{ color: "#4F46E5" }}>Flow</span>
            </span>
          </Link>
        </div>

        {/* ── STEP: Account ── */}
        {step === "account" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Create your account</h1>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                Already have one? <Link href="/login" style={{ color: "#4F46E5", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
              </p>
            </div>

            {error && <ErrBox msg={error} />}

            <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Rahul Sharma" />
            <Field label="Work Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
            <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="Min 8 characters" />

            <button onClick={handleCreateAccount} disabled={loading} className="btn-primary" style={primaryBtn}>
              {loading ? "Creating account…" : "Continue →"}
            </button>
          </>
        )}

        {/* ── STEP: Company choice ── */}
        {step === "company-choice" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Your organization</h1>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Search for your company or create a new one</p>
            </div>

            {error && <ErrBox msg={error} />}

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                className="inp"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search company name..."
                style={{ ...inputStyle, paddingRight: searching ? 40 : 14 }}
              />
              {searching && (
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>
                  searching…
                </div>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && !selected && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                {results.map((c, i) => (
                  <div key={c.id} className="company-row" onClick={() => { setSelected(c); setResults([]); }} style={{
                    padding: "12px 16px", borderBottom: i < results.length - 1 ? "1px solid #F1F5F9" : "none",
                    background: "#fff", border: "1px solid transparent",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name}</p>
                    {c.website && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{c.website}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Selected company */}
            {selected && (
              <div style={{ border: "1.5px solid #C7D7FE", borderRadius: 12, padding: "12px 16px", marginBottom: 16, background: "#EEF2FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#4338CA" }}>{selected.name}</p>
                  {selected.website && <p style={{ fontSize: 11, color: "#6366F1", marginTop: 2 }}>{selected.website}</p>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, color: "#94A3B8", cursor: "pointer" }}>×</button>
              </div>
            )}

            {/* Message */}
            {selected && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#64748B", display: "block", marginBottom: 6 }}>
                  Message to admin <span style={{ color: "#94A3B8" }}>(optional)</span>
                </label>
                <textarea
                  className="inp"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hi, I'm a recruiter at this company and would like to join..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                />
              </div>
            )}

            {selected ? (
              <button onClick={handleJoinRequest} disabled={loading} className="btn-primary" style={primaryBtn}>
                {loading ? "Sending request…" : "Request to Join →"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {query.trim().length >= 2 && results.length === 0 && !searching && (
                  <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
                    No company found for "{query}"
                  </p>
                )}
                <button onClick={() => setStep("create-company")} style={{ ...primaryBtn, background: "#F8FAFC", color: "#4F46E5", border: "1.5px solid #C7D7FE" }}>
                  + Create New Company
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP: Create company ── */}
        {step === "create-company" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <button onClick={() => setStep("company-choice")} style={{ background: "none", border: "none", fontSize: 13, color: "#4F46E5", cursor: "pointer", fontFamily: "inherit", marginBottom: 12, padding: 0 }}>
                ← Back
              </button>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Create your company</h1>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>You'll be the Company Admin</p>
            </div>

            {error && <ErrBox msg={error} />}

            <Field label="Company Name" value={companyName} onChange={setCompanyName} placeholder="e.g. TechCorp India" required />

            <div style={{ padding: "12px 14px", background: "#EEF2FF", border: "1px solid #C7D7FE", borderRadius: 10, marginBottom: 18, fontSize: 12, color: "#4338CA" }}>
              You'll be set as <strong>Company Admin</strong> — you can invite other recruiters from the dashboard.
            </div>

            <button onClick={handleCreateCompany} disabled={loading} className="btn-primary" style={primaryBtn}>
              {loading ? "Creating…" : "Create Company & Continue →"}
            </button>
          </>
        )}

        {/* ── STEP: Pending ── */}
        {step === "pending" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Request Sent!
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>
              Your request to join <strong>{selected?.name}</strong> has been sent to the company admin.
              You'll be notified once they approve or reject your request.
            </p>
            <div style={{ padding: "14px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, marginBottom: 24, fontSize: 13, color: "#92400E", textAlign: "left" }}>
              <strong>While you wait:</strong> You can still browse job listings and set up your profile.
            </div>
            <Link href="/jobs" style={{ display: "block", padding: "11px", background: "#4F46E5", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>
              Browse Jobs →
            </Link>
            <Link href="/settings" style={{ display: "block", padding: "11px", background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, textDecoration: "none" }}>
              Set up Profile
            </Link>
          </div>
        )}

        {step !== "pending" && step !== "account" && (
          <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 16 }}>
            Already have access? <Link href="/login" style={{ color: "#4F46E5", textDecoration: "none" }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── small helpers ───────────────────────────────────── */
function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
      </label>
      <input className="inp" type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, fontSize: 13, color: "#DC2626" }}>
      {msg}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13, fontFamily: "'DM Sans',sans-serif",
  outline: "none", color: "#0F172A", background: "#F8FAFC",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "12px",
  background: "#4F46E5", color: "#fff",
  border: "none", borderRadius: 10,
  fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
  marginTop: 4,
};