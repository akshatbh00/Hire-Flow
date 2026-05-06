"use client";
// PATH: frontend/app/(auth)/register/recruiter/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

type Step = "account" | "company-choice" | "create-company" | "pending";

interface CompanyResult {
  id: string;
  name: string;
  slug: string;
  website?: string;
}

export default function RecruiterRegisterPage() {
  const router = useRouter();

  const [step,        setStep]        = useState<Step>("account");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const [fullName,    setFullName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");

  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<CompanyResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState<CompanyResult | null>(null);
  const [message,     setMessage]     = useState("");
  const [companyName, setCompanyName] = useState("");

  // ── Step 1: Create recruiter account ────────────────────────────────
  async function handleCreateAccount() {
    if (!fullName.trim())     { setError("Full name is required"); return; }
    if (!email.trim())        { setError("Email is required"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm)  { setError("Passwords do not match"); return; }

    setLoading(true); setError("");
    try {
      const { useUserStore } = await import("@/store/user.store");
      await useUserStore.getState().register(email, password, fullName, "recruiter");
      setStep("company-choice");
    } catch (e: any) {
      setError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Company search ────────────────────────────────────────────────────
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

  // ── Join existing company ─────────────────────────────────────────────
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

  // ── Create new company ────────────────────────────────────────────────
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EEF2FF 0%, #fff 50%, #F0FDF4 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans',-apple-system,sans-serif", padding: 20,
    }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .inp{width:100%;padding:11px 14px;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;color:#0F172A;outline:none;background:#F8FAFC;font-family:'DM Sans',sans-serif;transition:border-color 0.15s,box-shadow 0.15s;box-sizing:border-box;}
        .inp:focus{border-color:#4F46E5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.1)!important;}
        .inp::placeholder{color:#CBD5E1;}
        .btn{width:100%;padding:13px;background:#4F46E5;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
        .btn:hover:not(:disabled){background:#4338CA;}
        .btn:disabled{background:#A5B4FC;cursor:not-allowed;}
        .company-row{transition:background 0.1s;cursor:pointer;}
        .company-row:hover{background:#F8FAFC!important;}
      `}</style>

      <div style={{
        background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0",
        padding: "48px 40px", width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
              Hire<span style={{ color: "#4F46E5" }}>Flow</span>
            </span>
          </Link>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {["account", "company-choice"].map((s, i) => (
            <div key={s} style={{
              width: step === s ? 24 : 8, height: 8, borderRadius: 4,
              background: step === s ? "#4F46E5" : (
                (step === "company-choice" || step === "create-company" || step === "pending") && s === "account"
                  ? "#4F46E5" : "#E2E8F0"
              ),
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* ── STEP 1: Account ── */}
        {step === "account" && (
          <>
            <button onClick={() => router.push("/register")} style={backBtnStyle}>← Back</button>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>🏢</span>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>
                  Start hiring today
                </h1>
              </div>
              <p style={{ fontSize: 14, color: "#64748B" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </div>

            {error && <ErrBox msg={error} />}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input className="inp" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Work Email</label>
              <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input className="inp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" />
            </div>

            <button className="btn" onClick={handleCreateAccount} disabled={loading}>
              {loading ? "Creating account…" : "Continue →"}
            </button>
          </>
        )}

        {/* ── STEP 2: Company Choice ── */}
        {step === "company-choice" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 6 }}>
                Your organization
              </h1>
              <p style={{ fontSize: 14, color: "#64748B" }}>Search for your company or create a new one</p>
            </div>

            {error && <ErrBox msg={error} />}

            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                className="inp" value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search company name..."
                style={{ paddingRight: searching ? 90 : 14 }}
              />
              {searching && (
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>
                  searching…
                </span>
              )}
            </div>

            {results.length > 0 && !selected && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                {results.map((c, i) => (
                  <div key={c.id} className="company-row"
                    onClick={() => { setSelected(c); setResults([]); }}
                    style={{ padding: "12px 16px", borderBottom: i < results.length - 1 ? "1px solid #F1F5F9" : "none", background: "#fff" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name}</p>
                    {c.website && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{c.website}</p>}
                  </div>
                ))}
              </div>
            )}

            {selected && (
              <div style={{ border: "1.5px solid #C7D7FE", borderRadius: 12, padding: "12px 16px", marginBottom: 16, background: "#EEF2FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#4338CA" }}>{selected.name}</p>
                  {selected.website && <p style={{ fontSize: 11, color: "#6366F1", marginTop: 2 }}>{selected.website}</p>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, color: "#94A3B8", cursor: "pointer" }}>×</button>
              </div>
            )}

            {selected && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Message to admin <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  className="inp" value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hi, I'm a recruiter at this company..."
                  rows={3}
                  style={{ resize: "none", lineHeight: 1.6 }}
                />
              </div>
            )}

            {selected ? (
              <button className="btn" onClick={handleJoinRequest} disabled={loading}>
                {loading ? "Sending request…" : "Request to Join →"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {query.trim().length >= 2 && results.length === 0 && !searching && (
                  <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>No company found for "{query}"</p>
                )}
                <button className="btn" onClick={() => setStep("create-company")}>
                  + Create New Company
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP 3: Create Company ── */}
        {step === "create-company" && (
          <>
            <button onClick={() => { setError(""); setStep("company-choice"); }} style={backBtnStyle}>← Back</button>

            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 6 }}>
                Create your company
              </h1>
              <p style={{ fontSize: 14, color: "#64748B" }}>You'll be set as Company Admin</p>
            </div>

            {error && <ErrBox msg={error} />}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Company Name <span style={{ color: "#DC2626" }}>*</span></label>
              <input className="inp" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. TechCorp India" />
            </div>

            <div style={{ background: "#EEF2FF", border: "1px solid #C7D7FE", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontSize: 13, color: "#4338CA" }}>
              You'll be set as <strong>Company Admin</strong> — you can invite other recruiters from your dashboard.
            </div>

            <button className="btn" onClick={handleCreateCompany} disabled={loading}>
              {loading ? "Creating…" : "Create Company & Continue →"}
            </button>
          </>
        )}

        {/* ── STEP 4: Pending ── */}
        {step === "pending" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 10 }}>
              Request Sent!
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>
              Your request to join <strong>{selected?.name}</strong> has been sent to the company admin. You'll be notified once approved.
            </p>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 24, fontSize: 13, color: "#92400E", textAlign: "left" }}>
              <strong>While you wait:</strong> Browse jobs and explore the platform.
            </div>
            <Link href="/jobs" style={{ display: "block", padding: "12px", background: "#4F46E5", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>
              Browse Jobs →
            </Link>
            <Link href="/settings" style={{ display: "block", padding: "12px", background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, textDecoration: "none" }}>
              Set up Profile
            </Link>
          </div>
        )}

        {step !== "pending" && (
          <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", marginTop: 20 }}>
            By signing up you agree to our{" "}
            <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Terms</a>
            {" "}and{" "}
            <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Privacy Policy</a>
          </p>
        )}

      </div>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 20 }}>
      {msg}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "#374151", marginBottom: 6,
};

const backBtnStyle: React.CSSProperties = {
  background: "none", border: "none",
  fontSize: 13, color: "#4F46E5",
  cursor: "pointer", fontFamily: "inherit",
  padding: 0, marginBottom: 16,
  display: "flex", alignItems: "center", gap: 4,
};