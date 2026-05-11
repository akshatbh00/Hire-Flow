"use client";

import { useState } from "react";
import { coursesApi } from "@/lib/api";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

const ROLES = [
  "Software Engineer", "Product Manager", "Data Scientist",
  "Frontend Developer", "Backend Developer", "System Design",
  "UI/UX Designer", "Business Analyst", "DevOps Engineer",
];

const PREP_DATA: Record<string, { questions: string[]; tips: string[] }> = {
  "Software Engineer": {
    questions: [
      "Explain the difference between process and thread.",
      "What is Big O notation? Give examples.",
      "How does garbage collection work?",
      "Explain REST vs GraphQL.",
      "What are SOLID principles?",
      "How would you design a URL shortener?",
      "Explain CAP theorem.",
      "What is the difference between SQL and NoSQL?",
    ],
    tips: [
      "Practice LeetCode Medium problems daily",
      "Study system design for senior roles",
      "Know your data structures cold",
      "Be ready to explain your past projects in detail",
    ],
  },
  "Product Manager": {
    questions: [
      "How would you prioritize a product roadmap?",
      "Tell me about a product you admire and why.",
      "How do you measure product success?",
      "Describe a time you made a decision with incomplete data.",
      "How would you improve Google Maps?",
      "Walk me through launching a new feature end to end.",
      "How do you handle disagreements with engineering?",
    ],
    tips: [
      "Use the STAR method for behavioral questions",
      "Have 3-5 metrics-backed stories ready",
      "Study product frameworks: RICE, ICE, OKRs",
      "Know the company's products deeply before the interview",
    ],
  },
  "System Design": {
    questions: [
      "Design Twitter's feed system.",
      "Design a distributed cache.",
      "How would you design WhatsApp?",
      "Design a rate limiter.",
      "How would you build a search autocomplete system?",
      "Design YouTube's video upload pipeline.",
      "How would you design a payment system?",
    ],
    tips: [
      "Always clarify requirements before designing",
      "Start with high-level architecture, then drill down",
      "Discuss trade-offs explicitly",
      "Know about load balancing, caching, and databases",
    ],
  },
};

const DEFAULT_PREP = {
  questions: [
    "Tell me about yourself.",
    "Why do you want to work here?",
    "What's your greatest strength and weakness?",
    "Where do you see yourself in 5 years?",
    "Describe a challenging situation and how you handled it.",
    "Why are you leaving your current job?",
    "What motivates you?",
  ],
  tips: [
    "Research the company thoroughly before your interview",
    "Prepare 3-5 stories using the STAR method",
    "Have questions ready to ask the interviewer",
    "Practice out loud, not just in your head",
  ],
};

export default function InterviewPrepPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [courses,      setCourses]      = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const prep = PREP_DATA[selectedRole] ?? DEFAULT_PREP;

  async function loadCourses(role: string) {
    setSelectedRole(role);
    setLoadingCourses(true);
    try {
      const res = await coursesApi.forSkills([role]);
      setCourses(res.courses?.slice(0, 3) ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .mobile-topbar { display: none; }
        .mobile-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .mobile-topbar { display: flex; }
          .mobile-bottom-nav { display: flex; }
          .desktop-nav-bar { display: none !important; }

          .interview-main {
            padding: 16px 16px 88px !important;
          }

          .interview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <MobileTopBar />

      <nav className="desktop-nav-bar" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[{ href: "/dashboard", label: "Dashboard" }, { href: "/jobs", label: "Jobs" }, { href: "/interview-prep", label: "Interview Prep", active: true }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <main className="interview-main" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Interview Prep</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Practice questions and tips for your target role</p>
        </div>

        {/* Role selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {ROLES.map((r) => (
            <button key={r} onClick={() => loadCourses(r)}
              style={{ padding: "8px 18px", borderRadius: 20, border: `1px solid ${selectedRole === r ? "#2563eb" : "#e2e8f0"}`, background: selectedRole === r ? "#2563eb" : "#fff", color: selectedRole === r ? "#fff" : "#374151", fontSize: 13, fontWeight: selectedRole === r ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {r}
            </button>
          ))}
        </div>

        <div className="interview-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
                {selectedRole ? `${selectedRole} Interview Questions` : "Common Interview Questions"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prep.questions.map((q, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                    <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.5 }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips + Courses */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Tips */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Pro Tips</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prep.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", marginTop: 6, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses */}
            {courses.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Recommended Courses</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {courses.map((c: any, i: number) => (
                    <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "10px 12px", border: "1px solid #f1f5f9", borderRadius: 10, textDecoration: "none", display: "block", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", marginBottom: 2 }}>{c.title}</p>
                      <p style={{ fontSize: 11.5, color: "#64748b" }}>{c.provider}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* KAREN link */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe", borderRadius: 14, padding: "18px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 6 }}>✦ Ask KAREN</p>
              <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6, marginBottom: 0 }}>
                Get personalized interview coaching from KAREN — your AI career copilot. Click the ✦ button below.
              </p>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}