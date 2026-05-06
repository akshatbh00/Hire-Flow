"use client";
// PATH: frontend/app/(auth)/register/page.tsx

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

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
        .role-card{
          transition:border-color 0.15s,box-shadow 0.15s,transform 0.12s;
          cursor:pointer;
        }
        .role-card:hover{
          transform:translateY(-4px);
          box-shadow:0 12px 40px rgba(79,70,229,0.12);
          border-color:#4F46E5!important;
        }
      `}</style>

      <div style={{
        background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0",
        padding: "48px 40px", width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
              Hire<span style={{ color: "#4F46E5" }}>Flow</span>
            </span>
          </Link>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Join HireFlow
          </h1>
          <p style={{ fontSize: 14, color: "#64748B" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Label */}
        <p style={{
          fontSize: 11, fontWeight: 700, color: "#94A3B8",
          textAlign: "center", marginBottom: 20,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          I want to...
        </p>

        {/* Role cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>

          {/* Job Seeker */}
          <div
            className="role-card"
            onClick={() => router.push("/register/jobseeker")}
            style={{
              border: "2px solid #E2E8F0", borderRadius: 16,
              padding: "28px 16px", textAlign: "center", background: "#fff",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Find a Job</p>
            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
              Browse jobs, track applications, get AI-matched to roles
            </p>
          </div>

          {/* Recruiter */}
          <div
            className="role-card"
            onClick={() => router.push("/register/recruiter")}
            style={{
              border: "2px solid #E2E8F0", borderRadius: 16,
              padding: "28px 16px", textAlign: "center", background: "#fff",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Hire Talent</p>
            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
              Post jobs, manage pipeline, find the best candidates
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center" }}>
          By signing up you agree to our{" "}
          <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Terms</a>
          {" "}and{" "}
          <a href="#" style={{ color: "#4F46E5", textDecoration: "none" }}>Privacy Policy</a>
        </p>

      </div>
    </div>
  );
}