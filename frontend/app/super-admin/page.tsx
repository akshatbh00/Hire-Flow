"use client";
//frontend/app/super-admin/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = "akshatbh498@gmail.com";

async function adminReq(path: string, method = "GET", body?: any) {
  const token = localStorage.getItem("hf_token");
  const res = await fetch(`http://localhost:8001/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [stats,    setStats]    = useState<any>(null);
  const [users,    setUsers]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"overview"|"users"|"pool">("overview");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.email !== SUPER_ADMIN_EMAIL) {
      router.push("/dashboard");
      return;
    }
    Promise.all([
      adminReq("/admin/stats").catch(() => null),
      adminReq("/admin/users?limit=100").catch(() => []),
    ]).then(([s, u]) => { setStats(s); setUsers(u); })
      .finally(() => setLoading(false));
  }, [user]);

  async function deactivate(id: string) {
    if (!confirm("Deactivate this user?")) return;
    await adminReq(`/admin/users/${id}/deactivate`, "PATCH").catch(() => {});
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
  }

  const filteredUsers = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: "#475569" }}>Verifying access...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: "#111", borderBottom: "1px solid #1e293b", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#7c3aed", color: "#fff", letterSpacing: "0.08em" }}>SUPER ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#475569" }}>{user?.email}</span>
          <Link href="/admin" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>Company Admin</Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>Exit</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em" }}>Super Admin Panel</h1>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 4 }}>Full platform control — restricted to {SUPER_ADMIN_EMAIL}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#111", padding: 4, borderRadius: 12, width: "fit-content" }}>
          {(["overview", "users", "pool"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {t === "pool" ? "Benchmark Pool" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Total Users",    value: stats.users?.total ?? 0,       color: "#2563eb" },
                { label: "Job Seekers",    value: stats.users?.jobseekers ?? 0,  color: "#7c3aed" },
                { label: "Recruiters",     value: stats.users?.recruiters ?? 0,  color: "#0891b2" },
                { label: "Companies",      value: stats.companies ?? 0,          color: "#16a34a" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#111", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 22px" }}>
                  <p style={{ fontSize: 11, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total Jobs",     value: stats.jobs?.total ?? 0,            color: "#f59e0b" },
                { label: "Active Jobs",    value: stats.jobs?.active ?? 0,           color: "#16a34a" },
                { label: "Resumes",        value: stats.resumes?.total ?? 0,         color: "#2563eb" },
                { label: "Applications",   value: stats.applications?.total ?? 0,    color: "#7c3aed" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#111", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 22px" }}>
                  <p style={{ fontSize: 11, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div style={{ background: "#111", border: "1px solid #7f1d1d", borderRadius: 16, padding: "24px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 16 }}>⚠ Danger Zone</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Reprocess All Resumes", path: "/admin/resumes/reprocess-all", method: "POST" },
                ].map(({ label, path, method }) => (
                  <button key={label}
                    onClick={async () => { if(confirm(`Run: ${label}?`)) { await adminReq(path, method).catch(() => alert("Failed")); alert("Done!"); }}}
                    style={{ padding: "9px 18px", background: "#3b1515", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ padding: "10px 16px", border: "1px solid #1e293b", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#111", color: "#f8fafc", width: 300, marginBottom: 16 }} />
            <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>All Users ({filteredUsers.length})</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b" }}>
                    {["Name", "Email", "Role", "Tier", "Status", "Joined", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#0a0a0a"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#f8fafc", fontWeight: 500 }}>{u.full_name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: u.role === "recruiter" ? "#1e3a5f" : u.role === "admin" ? "#3b0764" : "#1e3a2f", color: u.role === "recruiter" ? "#60a5fa" : u.role === "admin" ? "#c084fc" : "#4ade80" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>{u.tier}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: u.is_active ? "#1e3a2f" : "#3b1515", color: u.is_active ? "#4ade80" : "#f87171" }}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.is_active && u.email !== SUPER_ADMIN_EMAIL && (
                          <button onClick={() => deactivate(u.id)}
                            style={{ padding: "4px 12px", background: "#3b1515", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pool */}
        {tab === "pool" && (
          <PoolTab />
        )}
      </main>
    </div>
  );
}

function PoolTab() {
  const [pool, setPool] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("hf_token");
    fetch("http://localhost:8001/api/v1/admin/selected-pool", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setPool).catch(() => {});
  }, []);

  return (
    <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Benchmark Pool by Job Title</p>
      </div>
      {pool.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#334155", fontSize: 14 }}>No benchmark pool data yet</p>
        </div>
      ) : pool.map((p: any) => (
        <div key={p.job_title} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1e293b" }}>
          <p style={{ fontSize: 13, color: "#f8fafc" }}>{p.job_title}</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{p.count}</span>
        </div>
      ))}
    </div>
  );
}