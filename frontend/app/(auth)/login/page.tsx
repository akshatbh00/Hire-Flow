"use client";
// PATH: frontend/app/(auth)/login/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/user.store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useUserStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const role = useUserStore.getState().user?.role;
      if (role === "recruiter") router.push("/recruiter-dashboard");
      else if (role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (e: any) {
      console.error("Login error:", e.message);
    }
  }

  return (
    <div style={{
      minHeight:  "100vh",
      background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f0fdf4 100%)",
      display:    "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; }
        .login-card { padding: 48px 40px !important; }
        @media (max-width: 480px) {
          .login-card { padding: 32px 20px !important; }
        }
        .login-input {
          width: 100%; padding: 12px 16px;
          border: 1px solid #e2e8f0; border-radius: 10px;
          font-size: 16px; color: #0f172a; outline: none;
          background: #f8fafc; font-family: 'DM Sans', sans-serif;
          box-sizing: border-box; transition: border-color 0.15s;
        }
        .login-input:focus { border-color: #2563eb; }
        .login-btn {
          width: 100%; padding: 13px;
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em; transition: background 0.15s;
        }
        .login-btn:not(:disabled):hover { background: #1d4ed8 !important; }
        .google-btn {
          width: 100%; padding: 12px;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; color: #374151;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-weight: 500; display: flex; align-items: center;
          justify-content: center; gap: 8px; transition: border-color 0.15s;
        }
        .google-btn:hover { border-color: #2563eb; }
      `}</style>

      {/* Card */}
      <div className="login-card" style={{
        background:   "#fff",
        borderRadius: 20,
        border:       "1px solid #e2e8f0",
        width:        "100%", maxWidth: 420,
        boxShadow:    "0 20px 60px rgba(0,0,0,0.06)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
              Hire<span style={{ color: "#2563eb" }}>Flow</span>
            </span>
          </Link>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
            Transparent hiring for everyone
          </p>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
            Sign up free
          </Link>
        </p>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "12px 16px",
            color: "#dc2626", fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Email address
            </label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Password</label>
              <a href="#" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>Forgot password?</a>
            </div>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            style={{
              background: isLoading ? "#93c5fd" : "#2563eb",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        <button className="google-btn">
          <span style={{ fontSize: 16 }}>G</span> Continue with Google
        </button>

        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 24 }}>
          © 2026 HireFlow · Transparent Hiring
        </p>
      </div>
    </div>
  );
}