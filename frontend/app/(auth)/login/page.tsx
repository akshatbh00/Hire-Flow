"use client";

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

      {/* Card */}
      <div style={{
        background:   "#fff",
        borderRadius: 20,
        border:       "1px solid #e2e8f0",
        padding:      "48px 40px",
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{
                width: "100%", padding: "12px 16px",
                border: "1px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, color: "#0f172a", outline: "none",
                background: "#f8fafc", fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563eb"}
              onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Password
              </label>
              <a href="#" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 16px",
                border: "1px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, color: "#0f172a", outline: "none",
                background: "#f8fafc", fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563eb"}
              onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "13px",
              background: isLoading ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em",
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

        {/* Social placeholder */}
        <button style={{
          width: "100%", padding: "12px",
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 10, fontSize: 14, color: "#374151",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>G</span> Continue with Google
        </button>
      </div>

      <p style={{ position: "fixed", bottom: 24, fontSize: 12, color: "#94a3b8" }}>
        © 2026 HireFlow · Transparent Hiring
      </p>
    </div>
  );
}