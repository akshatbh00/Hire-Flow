"use client";
// PATH: frontend/app/(auth)/register/jobseeker/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JobSeekerRegisterPage() {
  const router = useRouter();

  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit() {
    if (!fullName.trim())          { setError("Full name is required"); return; }
    if (!email.trim())             { setError("Email is required"); return; }
    if (password.length < 8)       { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm)      { setError("Passwords do not match"); return; }

    setLoading(true); setError("");
    try {
      const { useUserStore } = await import("@/store/user.store");
      await useUserStore.getState().register(email, password, fullName, "jobseeker");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        .inp{width:100%;padding:11px 14px;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;color:#0F172A;outline:none;background:#F8FAFC;font-family:'DM Sans',sans-serif;transition:border-color 0.15s,box-shadow 0.15s;}
        .inp:focus{border-color:#4F46E5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.1)!important;}
        .inp::placeholder{color:#CBD5E1;}
        .btn{width:100%;padding:13px;background:#4F46E5;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
        .btn:hover:not(:disabled){background:#4338CA;}
        .btn:disabled{background:#A5B4FC;cursor:not-allowed;}
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

        {/* Back */}
        <button
          onClick={() => router.push("/register")}
          style={{ background: "none", border: "none", fontSize: 13, color: "#4F46E5", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </button>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🎯</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>
              Find your next job
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748B" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            className="inp" type="text" value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. Priya Sharma"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            className="inp" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Password</label>
          <input
            className="inp" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Confirm Password</label>
          <input
            className="inp" type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
          />
        </div>

        {/* What you get */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 8 }}>✅ What you get for free:</p>
          {[
            "AI-matched job recommendations",
            "ATS resume scoring",
            "Application pipeline tracker",
            "Salary insights & benchmarks",
            "Insider referral network",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#16a34a" }}>✓</span>
              <span style={{ fontSize: 12, color: "#15803D" }}>{item}</span>
            </div>
          ))}
        </div>

        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating your account…" : "Create Account →"}
        </button>

        <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", marginTop: 16 }}>
          By signing up you agree to our{" "}
          <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Terms</a>
          {" "}and{" "}
          <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Privacy Policy</a>
        </p>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "#374151", marginBottom: 6,
};