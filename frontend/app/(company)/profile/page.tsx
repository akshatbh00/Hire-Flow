"use client";
// app/(company)/company/profile/page.tsx

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CompanyProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        /* ── Sidebar ── */
        .sidebar {
          width: 240px;
          background: #fff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
        }

        /* ── Mobile top bar ── */
        .mobile-topbar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 40;
          width: 100%;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 16px;
          height: 56px;
          align-items: center;
          justify-content: space-between;
        }

        /* ── Mobile backdrop ── */
        .mobile-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-topbar {
            display: flex;
          }
          .mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 49;
          }
          .main-content {
            padding-bottom: 32px !important;
          }
        }
      `}</style>

      {/* ── Mobile Backdrop ── */}
      {sidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px 16px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{ fontWeight: 700, fontSize: 20, color: "#0f172a" }}
          >
            HireFlow
          </span>
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              background: "#eff6ff",
              color: "#3b82f6",
              padding: "2px 7px",
              borderRadius: 99,
              fontWeight: 600,
            }}
          >
            Company
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {[
            { label: "Dashboard", href: "/company/dashboard", icon: "⊞" },
            { label: "Jobs", href: "/recruiter-jobs", icon: "💼" },
            { label: "Pipeline", href: "#", icon: "⇢" },
            { label: "Recruiter Dashboard", href: "/recruiter-dashboard", icon: "📊" },
            { label: "Company Profile", href: "/company/profile", icon: "🏢", active: true },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: item.active ? 600 : 400,
                color: item.active ? "#2563eb" : "#475569",
                background: item.active ? "#eff6ff" : "transparent",
                borderLeft: item.active
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e2e8f0",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          <Link
            href="/settings"
            style={{ color: "#94a3b8", textDecoration: "none" }}
          >
            ⚙ Settings
          </Link>
        </div>
      </aside>

      {/* ── Right side ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Top Bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
            aria-label="Open menu"
          >
            <span
              style={{ display: "block", width: 22, height: 2, background: "#0f172a", borderRadius: 2 }}
            />
            <span
              style={{ display: "block", width: 22, height: 2, background: "#0f172a", borderRadius: 2 }}
            />
            <span
              style={{ display: "block", width: 22, height: 2, background: "#0f172a", borderRadius: 2 }}
            />
          </button>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
            Company Profile
          </span>
          <button
            onClick={() => setEditing((v) => !v)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        {/* Desktop Top Bar */}
        <div
          className="desktop-nav-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Company Profile
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 14, color: "#64748b" }}>
              Manage your public employer brand
            </p>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            style={{
              background: editing ? "#16a34a" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {editing ? "✓ Save Changes" : "✎ Edit Profile"}
          </button>
        </div>

        {/* ── Main Content ── */}
        <main
          className="main-content"
          style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}
        >
          {/* Cover + Logo card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Cover photo */}
            <div
              style={{
                height: 160,
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                position: "relative",
              }}
            >
              {editing && (
                <button
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 14,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📷 Change Cover
                </button>
              )}
            </div>

            {/* Logo + basic info */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: -36 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 14,
                    background: "#fff",
                    border: "3px solid #fff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    flexShrink: 0,
                  }}
                >
                  🏢
                </div>
                {editing && (
                  <button
                    style={{
                      marginBottom: 6,
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Change Logo
                  </button>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                {editing ? (
                  <input
                    defaultValue="Acme Technologies Ltd."
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#0f172a",
                      border: "1.5px solid #93c5fd",
                      borderRadius: 8,
                      padding: "6px 12px",
                      width: "100%",
                      maxWidth: 360,
                      outline: "none",
                    }}
                  />
                ) : (
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Acme Technologies Ltd.
                  </h2>
                )}
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                  Software · 201–500 employees · Delhi NCR, India
                </p>
              </div>
            </div>
          </div>

          {/* Two-column grid on desktop, stacked on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {/* About */}
            <ProfileCard title="About" icon="📝">
              {editing ? (
                <textarea
                  defaultValue="We build next-generation SaaS tools for HR and talent acquisition teams. Founded in 2018, we're a remote-first company with offices in Delhi, Bangalore, and Singapore."
                  rows={5}
                  style={{
                    width: "100%",
                    border: "1.5px solid #93c5fd",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 14,
                    color: "#334155",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  We build next-generation SaaS tools for HR and talent acquisition teams. Founded in
                  2018, we're a remote-first company with offices in Delhi, Bangalore, and Singapore.
                </p>
              )}
            </ProfileCard>

            {/* Company Details */}
            <ProfileCard title="Company Details" icon="🏷">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Industry", value: "Software / SaaS" },
                  { label: "Company Size", value: "201–500 employees" },
                  { label: "Founded", value: "2018" },
                  { label: "Headquarters", value: "Gurugram, Haryana" },
                  { label: "Website", value: "www.acmetech.io" },
                ].map((row) => (
                  <div key={row.label}>
                    <div
                      style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      {row.label}
                    </div>
                    {editing ? (
                      <input
                        defaultValue={row.value}
                        style={{
                          marginTop: 3,
                          fontSize: 14,
                          color: "#0f172a",
                          border: "1.5px solid #93c5fd",
                          borderRadius: 7,
                          padding: "5px 10px",
                          width: "100%",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    ) : (
                      <div style={{ marginTop: 2, fontSize: 14, color: "#0f172a", fontWeight: 500 }}>
                        {row.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ProfileCard>

            {/* Culture & Perks */}
            <ProfileCard title="Culture & Perks" icon="🎁">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  "🌏 Remote-first",
                  "📈 ESOP",
                  "🏥 Health Insurance",
                  "📚 Learning Budget",
                  "🏖 Unlimited PTO",
                  "🍕 Team Retreats",
                  "💻 Home Office Setup",
                  "🎉 Hackathons",
                ].map((perk) => (
                  <span
                    key={perk}
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "5px 12px",
                      borderRadius: 99,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {perk}
                  </span>
                ))}
              </div>
              {editing && (
                <button
                  style={{
                    marginTop: 12,
                    background: "none",
                    border: "1.5px dashed #93c5fd",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 13,
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  + Add Perk
                </button>
              )}
            </ProfileCard>

            {/* Social Links */}
            <ProfileCard title="Social & Links" icon="🔗">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "LinkedIn", icon: "in", value: "linkedin.com/company/acmetech" },
                  { label: "Twitter / X", icon: "𝕏", value: "@acmetech" },
                  { label: "Glassdoor", icon: "⭐", value: "glassdoor.com/acmetech" },
                  { label: "Careers Page", icon: "🔗", value: "acmetech.io/careers" },
                ].map((link) => (
                  <div key={link.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                        color: "#475569",
                      }}
                    >
                      {link.icon}
                    </span>
                    {editing ? (
                      <input
                        defaultValue={link.value}
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: "#0f172a",
                          border: "1.5px solid #93c5fd",
                          borderRadius: 7,
                          padding: "5px 10px",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 13, color: "#2563eb" }}>{link.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </ProfileCard>
          </div>

          {/* Active Jobs teaser */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Active Job Postings
              </h3>
              <Link
                href="/recruiter-jobs"
                style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
              >
                View all →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { title: "Senior Frontend Engineer", type: "Full-time", location: "Remote", applicants: 42 },
                { title: "Product Manager", type: "Full-time", location: "Gurugram", applicants: 28 },
                { title: "Data Analyst", type: "Contract", location: "Bangalore", applicants: 15 },
              ].map((job) => (
                <div
                  key={job.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {job.type} · {job.location}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#0369a1",
                      background: "#e0f2fe",
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.applicants} applicants
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Reusable card wrapper ──────────────────────────────────────────────────
function ProfileCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        padding: "20px 22px",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          fontWeight: 700,
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}