"use client";

import { useState } from "react";
import { coursesApi } from "@/lib/api";
import Link from "next/link";

const SKILL_CATEGORIES = [
  { label: "Programming",    skills: ["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust"] },
  { label: "Data & AI",      skills: ["Machine Learning", "Data Science", "SQL", "TensorFlow", "Statistics"] },
  { label: "Cloud & DevOps", skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"] },
  { label: "Design",         skills: ["Figma", "UI/UX Design", "Prototyping", "User Research"] },
  { label: "Business",       skills: ["Product Management", "Marketing", "Finance", "Business Analysis"] },
];

const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  "Google":    { bg: "#eff6ff", color: "#2563eb" },
  "IBM":       { bg: "#fef2f2", color: "#dc2626" },
  "Microsoft": { bg: "#f0fdf4", color: "#16a34a" },
  "Meta":      { bg: "#fffbeb", color: "#b45309" },
  "Coursera":  { bg: "#f5f3ff", color: "#7c3aed" },
};

export default function CoursesPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [courses,  setCourses]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  function toggle(skill: string) {
    setSelected(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  async function search() {
    if (selected.length === 0) return;
    setLoading(true); setSearched(true);
    try {
      const res = await coursesApi.forSkills(selected);
      setCourses(res.courses ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/dashboard"      style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/interview-prep" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Interview Prep</Link>
          <Link href="/courses"        style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Courses</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Course Recommendations</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Google, IBM, Microsoft & Meta certified courses for your skill gaps</p>
        </div>

        {/* Skill selector */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Select skills you want to learn:</p>
          {SKILL_CATEGORIES.map(({ label, skills }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.map(skill => (
                  <button key={skill} onClick={() => toggle(skill)}
                    style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${selected.includes(skill) ? "#2563eb" : "#e2e8f0"}`, background: selected.includes(skill) ? "#2563eb" : "#fff", color: selected.includes(skill) ? "#fff" : "#374151", fontSize: 13, fontWeight: selected.includes(skill) ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <p style={{ fontSize: 13, color: "#64748b" }}>{selected.length} skill{selected.length !== 1 ? "s" : ""} selected</p>
            <div style={{ display: "flex", gap: 10 }}>
              {selected.length > 0 && (
                <button onClick={() => { setSelected([]); setSearched(false); setCourses([]); }}
                  style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#64748b", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear
                </button>
              )}
              <button onClick={search} disabled={selected.length === 0 || loading}
                style={{ padding: "9px 24px", background: selected.length === 0 ? "#e2e8f0" : "#2563eb", color: selected.length === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: selected.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {loading ? "Finding courses..." : "Find Courses →"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && (
          courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>No courses found for selected skills</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>{courses.length} courses found</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {courses.map((c: any, i: number) => {
                  const cfg = PROVIDER_COLORS[c.provider] ?? { bg: "#f8fafc", color: "#475569" };
                  return (
                    <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", textDecoration: "none", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{c.provider}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>Free</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>{c.title}</p>
                      {c.skills && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                          {c.skills.slice(0, 3).map((s: string) => (
                            <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>{s}</span>
                          ))}
                        </div>
                      )}
                      {c.duration && <p style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {c.duration}</p>}
                    </a>
                  );
                })}
              </div>
            </>
          )
        )}

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, height: 140 }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}