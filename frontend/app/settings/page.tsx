"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

export default function SettingsPage() {
  const router        = useRouter();
  const { user, logout } = useUserStore();

  const [fullName,  setFullName]  = useState(user?.full_name ?? "");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const isRecruiter = user?.role === "recruiter";

  async function handleSave() {
    if (!fullName.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      await usersApi.updateProfile({ full_name: fullName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const dashboardHref = isRecruiter ? "/recruiter-dashboard" : "/dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .mobile-topbar { display: none; }
        .mobile-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .mobile-topbar { display: flex; }
          .mobile-bottom-nav { display: flex; }
          .desktop-nav-bar { display: none !important; }

          .settings-main {
            padding: 16px 16px 88px !important;
          }
        }
      `}</style>

      <MobileTopBar />

      {/* Nav */}
      <nav className="desktop-nav-bar" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href={dashboardHref} style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href={dashboardHref} style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Dashboard</Link>
          {!isRecruiter && <Link href="/jobs"         style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Jobs</Link>}
          {!isRecruiter && <Link href="/applications" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Applications</Link>}
          <Link href="/settings" style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>Settings</Link>
        </div>
      </nav>

      <main className="settings-main" style={{ maxWidth: 640, margin: "0 auto", padding: "32px 40px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Settings</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Manage your account</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Profile</h2>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
                {error}
              </div>
            )}
            {saved && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 13, color: "#16a34a" }}>
                ✓ Changes saved
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a", boxSizing: "border-box" }}
                onFocus={(e)  => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e)   => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
              <input
                value={user?.email ?? ""}
                disabled
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", color: "#94a3b8", background: "#f8fafc", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Email cannot be changed</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "10px 24px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Account info */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Account</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Role",  val: user?.role === "recruiter" ? "Recruiter" : "Job Seeker" },
                { label: "Plan",  val: user?.tier === "premium" ? "Premium ✦" : "Free" },
                { label: "Status", val: user?.is_active ? "Active" : "Inactive" },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Sign Out</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              You'll need to log in again to access your account.
            </p>
            <button
              onClick={handleLogout}
              style={{ padding: "10px 24px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <MobileBottomNav active="profile" />
    </div>
  );
}