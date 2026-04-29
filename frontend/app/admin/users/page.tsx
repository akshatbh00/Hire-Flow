"use client";
// frontend/app/admin/users/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";

const BASE = "http://localhost:8001/api/v1";

function req(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("hf_token") : "";
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  }).then(r => r.json());
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:     { bg: "#FEF2F2", text: "#DC2626" },
  recruiter: { bg: "#EEF2FF", text: "#4338CA" },
  jobseeker: { bg: "#F0FDF4", text: "#15803D" },
};

export default function AdminUsersPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();

  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("all");
  const [acting,  setActing]  = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await req("/users/admin/all");
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    setActing(userId);
    try {
      await req(`/users/admin/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !isActive }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
    } catch {}
    finally { setActing(null); }
  }

  const filtered = users.filter(u => {
    const matchRole   = role === "all" || u.role?.toLowerCase() === role;
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    total:     users.length,
    admin:     users.filter(u => u.role === "admin").length,
    recruiter: users.filter(u => u.role === "recruiter").length,
    jobseeker: users.filter(u => u.role === "jobseeker").length,
    inactive:  users.filter(u => !u.is_active).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .row:hover{background:#F8FAFC!important}
        .inp:focus{border-color:#4F46E5!important;outline:none}
      `}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 32px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            { href: "/admin",       label: "Overview" },
            { href: "/admin/users", label: "Users",    active: true },
            { href: "/admin/jobs",  label: "Jobs" },
            { href: "/admin/audit", label: "Audit" },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              fontSize: 12, fontWeight: l.active ? 600 : 400,
              color: l.active ? "#4F46E5" : "#64748B",
              textDecoration: "none", padding: "5px 10px", borderRadius: 8,
              background: l.active ? "#EEF2FF" : "transparent",
            }}>{l.label}</Link>
          ))}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", marginLeft: 6 }}>ADMIN</span>
          <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 12, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>Users</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Manage all platform users</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total",     value: counts.total,     color: "#0F172A" },
            { label: "Admins",    value: counts.admin,     color: "#DC2626" },
            { label: "Recruiters",value: counts.recruiter, color: "#4338CA" },
            { label: "Job Seekers",value: counts.jobseeker,color: "#15803D" },
            { label: "Inactive",  value: counts.inactive,  color: "#94A3B8" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input className="inp" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ padding: "8px 13px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", width: 240, color: "#0F172A", background: "#fff" }} />
          {["all", "admin", "recruiter", "jobseeker"].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${role === r ? "#C7D7FE" : "#E2E8F0"}`,
              background: role === r ? "#EEF2FF" : "#fff",
              color: role === r ? "#4338CA" : "#64748B",
              fontSize: 12, fontWeight: role === r ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 100px 80px 100px", gap: 12, padding: "10px 20px", background: "#F8FAFC", borderBottom: "0.5px solid #E2E8F0" }}>
            {["User", "Email", "Role", "Status", "Actions"].map(h => (
              <p key={h} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              {users.length === 0 ? "No users endpoint available yet — wire up /users/admin/all" : "No users match your search"}
            </div>
          ) : filtered.map((u, i) => {
            const rc = ROLE_COLORS[u.role?.toLowerCase()] ?? { bg: "#F1F5F9", text: "#475569" };
            return (
              <div key={u.id} className="row" style={{
                display: "grid", gridTemplateColumns: "1fr 200px 100px 80px 100px",
                gap: 12, padding: "12px 20px",
                borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none",
                alignItems: "center", transition: "background 0.1s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: rc.bg, color: rc.text, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name ?? "—"}</p>
                    <p style={{ fontSize: 10, color: "#94A3B8" }}>{u.id?.slice(0, 8)}...</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: rc.bg, color: rc.text, width: "fit-content" }}>
                  {u.role}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 20, width: "fit-content",
                  background: u.is_active ? "#F0FDF4" : "#F1F5F9",
                  color: u.is_active ? "#15803D" : "#94A3B8",
                }}>
                  {u.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => toggleActive(u.id, u.is_active)}
                  disabled={acting === u.id || u.id === user?.id}
                  style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
                    cursor: u.id === user?.id ? "not-allowed" : "pointer",
                    fontFamily: "inherit", border: "1px solid #E2E8F0",
                    background: u.is_active ? "#FEF2F2" : "#F0FDF4",
                    color: u.is_active ? "#DC2626" : "#15803D",
                    opacity: u.id === user?.id ? 0.4 : 1,
                  }}
                >
                  {acting === u.id ? "..." : u.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            );
          })}
        </div>

        {users.length === 0 && !loading && (
          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, textAlign: "center" }}>
            Backend endpoint <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>GET /users/admin/all</code> needs to be created to load real user data.
          </p>
        )}
      </main>
    </div>
  );
}