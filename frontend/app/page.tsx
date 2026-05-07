"use client";
// PATH: frontend/app/page.tsx

import { useState, useEffect } from "react";
import Link from "next/link";

const STATS = [
  { value: "67+",  label: "API Endpoints" },
  { value: "100%", label: "Pipeline Transparency" },
  { value: "7",    label: "Industry Themes" },
  { value: "0",    label: "Ghost Jobs" },
];

const FEATURES = [
  { icon: "◈", title: "AI Resume Analysis",      desc: "ATS scoring, keyword gaps, section validation — know exactly why you're getting rejected." },
  { icon: "◎", title: "Full Pipeline Visibility", desc: "See every stage — Applied → Round 1 → HR → Selected. No more ghosting." },
  { icon: "◇", title: "Benchmark vs Hired",       desc: "Compare your profile against people who actually got the job. Close the gap." },
  { icon: "◉", title: "Insider Referral Network", desc: "Know someone at the company? Get referred. +12% match score boost guaranteed." },
  { icon: "◈", title: "KAREN AI Agent",           desc: "Your brutally honest career coach. Knows your resume, your gaps, your pipeline." },
  { icon: "◎", title: "Finance Approval Gate",    desc: "Every job is budget-approved before you see it. Zero ghost jobs, zero wasted applications." },
];

const THEMES = [
  { id: "universal",  label: "Universal",  color: "#2563eb" },
  { id: "engineer",   label: "Engineer",   color: "#00ff87" },
  { id: "civil",      label: "Civil",      color: "#8b6914" },
  { id: "mechanical", label: "Mechanical", color: "#ff6b1a" },
  { id: "finance",    label: "Finance",    color: "#c9a84c" },
  { id: "electrical", label: "Electrical", color: "#7b68ee" },
];

export default function LandingPage() {
  const [activeTheme, setActiveTheme] = useState("universal");
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close menu on route click
  const closeMenu = () => setMenuOpen(false);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Responsive helpers ── */
        .desktop-nav { display: flex; }
        .hamburger   { display: none; }
        .mobile-menu { display: none; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger   { display: flex !important; }
          .mobile-menu { display: flex !important; }
          .hero-btns   { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns a { text-align: center !important; }
          .stats-row   { gap: 24px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cta-banner    { margin: 0 16px 60px !important; padding: 48px 24px !important; }
          .cta-btns      { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns a    { text-align: center !important; }
          .footer-inner  { flex-direction: column !important; gap: 16px !important; text-align: center !important; }
          .theme-pills   { gap: 8px !important; }
          .theme-pill    { font-size: 12px !important; padding: 6px 14px !important; }
          .nav-inner     { padding: 14px 20px !important; }
          .hero-section  { padding: 100px 20px 60px !important; }
          .features-section { padding: 60px 20px !important; }
          .themes-section   { padding: 60px 20px !important; }
          .howto-section    { padding: 60px 20px !important; }
          .howto-grid       { grid-template-columns: 1fr !important; gap: 32px !important; text-align: left !important; }
        }

        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr 1fr !important; display: grid !important; gap: 16px !important; }
        }

        .feature-card:hover {
          border-color: #2563eb !important;
          transform: translateY(-2px);
        }
        .feature-card { transition: border-color 0.2s, transform 0.2s; }

        .nav-link:hover { color: #2563eb !important; }
        .nav-link { transition: color 0.15s; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #e2e8f0" : "none",
        transition: "all 0.3s ease",
      }}>
        <div className="nav-inner" style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </div>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ gap: 32, alignItems: "center" }}>
            <a href="#features" className="nav-link" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>Features</a>
            <a href="#themes"   className="nav-link" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>Themes</a>
            <a href="#pricing"  className="nav-link" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>Pricing</a>
            <Link href="/login" style={{ color: "#0f172a", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            <Link href="/register" style={{
              background: "#2563eb", color: "#fff",
              padding: "8px 20px", borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Get Started →
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 5, padding: 4,
            }}
          >
            <span style={{ width: 22, height: 2, background: "#0f172a", borderRadius: 2, display: "block", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: 22, height: 2, background: "#0f172a", borderRadius: 2, display: "block", opacity: menuOpen ? 0 : 1, transition: "all 0.2s" }} />
            <span style={{ width: 22, height: 2, background: "#0f172a", borderRadius: 2, display: "block", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu" style={{
            flexDirection: "column", background: "#fff",
            borderTop: "1px solid #e2e8f0", padding: "20px",
            gap: 4,
          }}>
            {[
              { href: "#features", label: "Features" },
              { href: "#themes",   label: "Themes" },
              { href: "#pricing",  label: "Pricing" },
            ].map(l => (
              <a key={l.href} href={l.href} onClick={closeMenu} style={{
                padding: "12px 16px", borderRadius: 8,
                color: "#374151", fontSize: 15, textDecoration: "none",
                fontWeight: 500,
              }}>{l.label}</a>
            ))}
            <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
            <Link href="/login" onClick={closeMenu} style={{
              padding: "12px 16px", borderRadius: 8,
              color: "#374151", fontSize: 15, textDecoration: "none", fontWeight: 500,
            }}>Sign in</Link>
            <Link href="/register" onClick={closeMenu} style={{
              padding: "13px 16px", borderRadius: 8,
              background: "#2563eb", color: "#fff",
              fontSize: 15, textDecoration: "none", fontWeight: 600,
              textAlign: "center", marginTop: 4,
            }}>Get Started →</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section" style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 40px 80px",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #dbeafe 0%, #fff 70%)",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(37,99,235,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 200, height: 200, borderRadius: "50%", background: "rgba(16,185,129,0.06)", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 100, padding: "6px 16px",
          fontSize: 13, color: "#2563eb", marginBottom: 32, fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
          India's most transparent hiring platform
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(36px, 7vw, 80px)",
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: "-0.03em", marginBottom: 24,
          maxWidth: 800, fontFamily: "'Fraunces', serif",
        }}>
          Get hired faster.<br />
          <span style={{ color: "#2563eb" }}>Know exactly why</span><br />
          you didn't.
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 20px)",
          color: "#64748b", maxWidth: 560,
          lineHeight: 1.6, marginBottom: 40,
        }}>
          AI resume analysis, full pipeline transparency, insider referrals,
          and a career coach that doesn't sugarcoat.
        </p>

        {/* CTA buttons */}
        <div className="hero-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 400 }}>
          <Link href="/register" style={{
            background: "#2563eb", color: "#fff",
            padding: "14px 32px", borderRadius: 10,
            fontSize: 16, fontWeight: 600, textDecoration: "none",
            flex: 1,
          }}>
            Start for free →
          </Link>
          <Link href="/register/recruiter" style={{
            background: "#fff", color: "#0f172a",
            padding: "14px 32px", borderRadius: 10,
            fontSize: 16, fontWeight: 500, textDecoration: "none",
            border: "1px solid #e2e8f0", flex: 1,
          }}>
            I'm a Recruiter
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-row" style={{ display: "flex", gap: 48, marginTop: 72, flexWrap: "wrap", justifyContent: "center" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section" style={{ padding: "100px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563eb", marginBottom: 12 }}>
            What makes us different
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'Fraunces', serif" }}>
            Built for transparency.<br />Not engagement metrics.
          </h2>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 16, padding: 28,
            }}>
              <div style={{ fontSize: 24, color: "#2563eb", marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Themes ── */}
      <section id="themes" className="themes-section" style={{ padding: "100px 40px", background: "#f8fafc", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto 48px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563eb", marginBottom: 12 }}>
            Personalised for your industry
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'Fraunces', serif", marginBottom: 16 }}>
            HireFlow speaks your language
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.6 }}>
            The platform adapts its look and feel to your industry.
          </p>
        </div>

        <div className="theme-pills" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          {THEMES.map((t) => (
            <button key={t.id} className="theme-pill" onClick={() => setActiveTheme(t.id)} style={{
              padding: "8px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600,
              border: `2px solid ${activeTheme === t.id ? t.color : "#e2e8f0"}`,
              background: activeTheme === t.id ? t.color : "#fff",
              color: activeTheme === t.id ? (t.id === "engineer" ? "#000" : "#fff") : "#64748b",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 20, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
          <ThemePreview theme={activeTheme} />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="howto-section" style={{ padding: "100px 40px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563eb", marginBottom: 12 }}>
          How it works
        </div>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'Fraunces', serif", marginBottom: 64 }}>
          Three steps to your next job
        </h2>

        <div className="howto-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {[
            { step: "01", title: "Upload Resume", desc: "AI analyses your resume, scores ATS compatibility, identifies gaps vs hired candidates." },
            { step: "02", title: "Apply Smart",   desc: "Browse AI-matched jobs, see your % match before applying, one-click apply." },
            { step: "03", title: "Track Live",    desc: "See every stage in real-time. Get notified instantly. Know exactly where you stand." },
          ].map((s) => (
            <div key={s.step} style={{ textAlign: "left" }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.04em", fontFamily: "'Fraunces', serif", marginBottom: 16 }}>{s.step}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner" style={{
        margin: "0 40px 100px", background: "#0f172a",
        borderRadius: 24, padding: "80px 60px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(37,99,235,0.3), transparent 70%)", pointerEvents: "none" }} />
        <h2 style={{ fontSize: "clamp(26px, 4vw, 48px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Fraunces', serif", marginBottom: 16, position: "relative" }}>
          Stop applying in the dark.
        </h2>
        <p style={{ fontSize: 18, color: "#94a3b8", marginBottom: 40, position: "relative" }}>
          Join HireFlow. Know your pipeline. Get hired.
        </p>
        <div className="cta-btns" style={{ display: "flex", gap: 12, justifyContent: "center", position: "relative" }}>
          <Link href="/register" style={{ background: "#2563eb", color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
            Get started free →
          </Link>
          <Link href="/register/recruiter" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 500, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
            Post jobs
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "40px" }}>
        <div className="footer-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>© 2026 HireFlow · Built for transparency</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThemePreview({ theme }: { theme: string }) {
  const configs: Record<string, { bg: string; surface: string; border: string; text: string; text2: string; accent: string; font: string; navBorder: string; }> = {
    universal:  { bg: "#f8fafc", surface: "#fff",    border: "#e2e8f0", text: "#0f172a", text2: "#94a3b8", accent: "#2563eb", font: "DM Sans, sans-serif",      navBorder: "#e2e8f0" },
    engineer:   { bg: "#0a0a0a", surface: "#0f0f0f", border: "#1e1e1e", text: "#ffffff", text2: "#555555", accent: "#00ff87", font: "Courier New, monospace",   navBorder: "#1a1a1a" },
    civil:      { bg: "#f5f0e8", surface: "#ffffff", border: "#d4c4a0", text: "#2c3e2d", text2: "#8b7355", accent: "#8b6914", font: "Georgia, serif",           navBorder: "#d4c4a0" },
    mechanical: { bg: "#1a1a1a", surface: "#222222", border: "#333333", text: "#ffffff", text2: "#666666", accent: "#ff6b1a", font: "Arial Narrow, sans-serif", navBorder: "#333" },
    finance:    { bg: "#0a0f1e", surface: "#0e1628", border: "#1e2d4a", text: "#e8d5a3", text2: "#4a6080", accent: "#c9a84c", font: "Georgia, serif",           navBorder: "#1e2d4a" },
    electrical: { bg: "#0d0d12", surface: "#111118", border: "#1a1a2e", text: "#e0e0ff", text2: "#4a4a6a", accent: "#7b68ee", font: "Courier New, monospace",   navBorder: "#1a1a2e" },
  };

  const c = configs[theme] ?? configs.universal;

  return (
    <div style={{ background: c.bg, fontFamily: c.font }}>
      <div style={{ background: c.surface, borderBottom: `1px solid ${c.navBorder}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>Hire<span style={{ color: c.accent }}>Flow</span></span>
        <div style={{ display: "flex", gap: 16 }}>
          {["Jobs","Applications","Resume"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: c.text2 }}>{l}</span>
          ))}
          <span style={{ background: c.accent, color: theme === "engineer" ? "#000" : "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 4 }}>Browse Jobs</span>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 4 }}>Hey, Akshat 👋</div>
        <div style={{ fontSize: 11, color: c.text2, marginBottom: 16 }}>Your hiring snapshot</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {[["ATS Score","72",true],["Applied","8",false],["Best Stage","Round 2",true],["Matches","24",false]].map(([l,v,hi]) => (
            <div key={String(l)} style={{ background: c.surface, border: `1px solid ${c.border}`, padding: "10px", borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: c.text2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: hi ? c.accent : c.text }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, padding: "12px", borderRadius: 4 }}>
          <div style={{ fontSize: 9, color: c.text2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>AI Matched Jobs</div>
          {[["Senior ML Engineer","Microsoft","89%"],["Backend Engineer","Swiggy","84%"],["Data Engineer","Razorpay","79%"]].map(([title,co,score]) => (
            <div key={String(title)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${c.border}` }}>
              <div>
                <div style={{ fontSize: 11, color: c.text, fontWeight: 500 }}>{title}</div>
                <div style={{ fontSize: 9, color: c.text2 }}>{co}</div>
              </div>
              <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>{score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}