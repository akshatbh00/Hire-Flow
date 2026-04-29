"use client";
// frontend/app/(company)/company/hrms/members/page.tsx

import { useEffect, useState } from "react";
import { hrmsApi, HRMSMemberOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  company_admin:  { bg: "#eff6ff", color: "#2563eb", label: "Company Admin" },
  hiring_manager: { bg: "#faf5ff", color: "#7c3aed", label: "Hiring Manager" },
  recruiter:      { bg: "#f0fdf4", color: "#16a34a", label: "Recruiter" },
};

export default function HRMSMembersPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();

  const [members,     setMembers]     = useState<HRMSMemberOut[]>([]);
  const [myProfile,   setMyProfile]   = useState<HRMSMemberOut | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showInvite,  setShowInvite]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("recruiter");
  const [inviting,    setInviting]    = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk,    setInviteOk]    = useState(false);

  useEffect(() => {
    Promise.all([hrmsApi.me().catch(() => null), hrmsApi.members().catch(() => [])])
      .then(([me, list]) => {
        setMyProfile(me);
        setMembers(list ?? []);
      })
      .catch(() => setError("Could not load team members."))
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError(null);
    try {
      const newMember = await hrmsApi.invite(inviteEmail, inviteRole);
      setMembers((prev) => [...prev, newMember]);
      setInviteOk(true);
      setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteOk(false); }, 1500);
    } catch (e: any) {
      setInviteError(e.message ?? "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(member_id: string, newRole: string) {
    try {
      const updated = await hrmsApi.updateRole(member_id, newRole);
      setMembers((prev) => prev.map((m) => (m.id === member_id ? updated : m)));
    } catch (e: any) {
      alert(e.message ?? "Failed to update role");
    }
  }

  async function handleDeactivate(member_id: string) {
    if (!confirm("Remove this member from the team?")) return;
    try {
      await hrmsApi.deactivate(member_id);
      setMembers((prev) => prev.filter((m) => m.id !== member_id));
    } catch (e: any) {
      alert(e.message ?? "Failed to remove member");
    }
  }

  const isAdmin = myProfile?.hrms_role === "company_admin";
  const isHM    = myProfile?.hrms_role === "hiring_manager";

  if (loading) return <Skeleton />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/recruiter-dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Hire<span style={{ color: "#2563eb" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            { href: "/recruiter-dashboard",    label: "Dashboard" },
            { href: "/company/hrms/members",   label: "Team",    active: true },
            { href: "/company/hrms/jobs",      label: "Jobs" },
            { href: "/company/hrms/metrics",   label: "Metrics" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "H"}
            </div>
            <button onClick={() => { logout(); router.push("/login"); }}
              style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>HR Team</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
              {myProfile ? `You are a ${ROLE_COLORS[myProfile.hrms_role]?.label}` : "Manage your hiring team"}
            </p>
          </div>
          {(isAdmin || isHM) && (
            <button onClick={() => setShowInvite(true)}
              style={{ background: "#2563eb", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
              + Invite Member
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Members table */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Team Members ({members.length})</p>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>
              No team members yet. Invite your first recruiter.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Member", "Role", "Joined", "Reports To", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const rc = ROLE_COLORS[m.hrms_role] ?? ROLE_COLORS.recruiter;
                  const reportsTo = members.find((x) => x.id === m.reports_to);
                  return (
                    <tr key={m.id} style={{ borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                            {(m.full_name ?? m.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{m.full_name ?? "—"}</p>
                            <p style={{ fontSize: 12, color: "#94a3b8" }}>{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        {isAdmin && m.hrms_role !== "company_admin" ? (
                          <select
                            value={m.hrms_role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            style={{ fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 20, border: `1px solid ${rc.color}`, background: rc.bg, color: rc.color, cursor: "pointer", fontFamily: "inherit" }}>
                            <option value="recruiter">Recruiter</option>
                            <option value="hiring_manager">Hiring Manager</option>
                            <option value="company_admin">Company Admin</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: rc.bg, color: rc.color }}>
                            {rc.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#64748b" }}>
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pending"}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#64748b" }}>
                        {reportsTo?.full_name ?? "—"}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        {isAdmin && m.hrms_role !== "company_admin" && (
                          <button onClick={() => handleDeactivate(m.id)}
                            style={{ fontSize: 12, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {showInvite && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Invite Team Member</h2>
              <button onClick={() => { setShowInvite(false); setInviteError(null); }}
                style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="recruiter@company.com"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" }}>
                <option value="recruiter">Recruiter</option>
                {isAdmin && <option value="hiring_manager">Hiring Manager</option>}
                {isAdmin && <option value="company_admin">Company Admin</option>}
              </select>
            </div>

            {inviteError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                {inviteError}
              </div>
            )}

            {inviteOk && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", color: "#16a34a", fontSize: 13, marginBottom: 16 }}>
                ✅ Member added successfully!
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowInvite(false); setInviteError(null); }}
                style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontWeight: 500, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, background: inviting ? "#93c5fd" : "#2563eb", color: "#fff", cursor: inviting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {inviting ? "Inviting..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Hire<span style={{ color: "#2563eb" }}>Flow</span>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", opacity: 0.4 }} />
          ))}
        </div>
      </div>
    </div>
  );
}