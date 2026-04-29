"use client";

import { useState, useEffect } from "react";
import api from "@/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type HRMSRole = "company_admin" | "hiring_manager" | "hr";
type MemberStatus = "active" | "inactive" | "suspended";
type InviteStatus = "pending" | "accepted" | "rejected" | "expired";

interface Member {
  id: string;
  name: string;
  email: string;
  role: HRMSRole;
  status: MemberStatus;
  reports_to_id?: string;
  invites_used: number;
  invite_limit: number;
}

interface Invite {
  id: string;
  email: string;
  name?: string;
  role: HRMSRole;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
}

interface MemberStats {
  member_id: string;
  member_name: string;
  role: string;
  month: string;
  total_actions: number;
  total_ai_tokens: number;
  total_ai_cost_usd: number;
  total_time_hours: number;
  stage_moves: number;
  interviews_scheduled: number;
  candidates_messaged: number;
  offers_sent: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

const hrmsApi = {
  getTeam: () => api.get("/hrms/team"),
  getInvites: () => api.get("/hrms/invites"),
  getTeamStats: (month?: string) => api.get("/hrms/stats/team", { params: month ? { month } : {} }),
  sendInvite: (data: object) => api.post("/hrms/invite", data),
  updateMemberStatus: (memberId: string, status: string) =>
    api.patch(`/hrms/member/${memberId}/status`, null, { params: { status } }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<HRMSRole, string> = {
  company_admin: "Company Admin",
  hiring_manager: "Hiring Manager",
  hr: "HR",
};

const ROLE_COLORS: Record<HRMSRole, string> = {
  company_admin: "bg-red-50 text-red-700",
  hiring_manager: "bg-orange-50 text-orange-700",
  hr: "bg-blue-50 text-blue-700",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  suspended: "bg-red-50 text-red-600",
};

const INVITE_STATUS_COLORS: Record<InviteStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-500",
  expired: "bg-gray-100 text-gray-400",
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({
  members,
  onClose,
  onSuccess,
}: {
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ email: "", name: "", intended_role: "hr" as HRMSRole, reports_to_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hms = members.filter((m) => m.role === "hiring_manager");

  const handleSubmit = async () => {
    if (!form.email) return setError("Email is required");
    if (form.intended_role === "hr" && !form.reports_to_id) return setError("Select a Hiring Manager for this HR");
    setLoading(true);
    setError("");
    try {
      await hrmsApi.sendInvite({
        email: form.email,
        name: form.name || undefined,
        intended_role: form.intended_role,
        reports_to_id: form.reports_to_id || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-gray-900">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="hr@yourcompany.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name (optional)</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Their name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Role *</label>
            <select value={form.intended_role} onChange={(e) => setForm({ ...form, intended_role: e.target.value as HRMSRole })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hr">HR</option>
              <option value="hiring_manager">Hiring Manager</option>
            </select>
          </div>
          {form.intended_role === "hr" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reports to (Hiring Manager) *</label>
              <select value={form.reports_to_id} onChange={(e) => setForm({ ...form, reports_to_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Hiring Manager…</option>
                {hms.map((hm) => (<option key={hm.id} value={hm.id}>{hm.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Sending…" : "Send Invite"}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Hierarchy Tree ────────────────────────────────────────────────────────────

function HierarchyTree({ members }: { members: Member[] }) {
  const admins = members.filter((m) => m.role === "company_admin");
  const hms = members.filter((m) => m.role === "hiring_manager");
  const hrs = members.filter((m) => m.role === "hr");

  const MemberChip = ({ m }: { m: Member }) => (
    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{m.name[0]}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">{m.name}</div>
        <Badge label={ROLE_LABELS[m.role]} cls={ROLE_COLORS[m.role]} />
      </div>
      {m.status !== "active" && <Badge label={m.status} cls={STATUS_COLORS[m.status]} />}
    </div>
  );

  if (members.length === 0) return <div className="text-sm text-gray-400 text-center py-8">No team members yet</div>;

  return (
    <div className="space-y-4">
      {admins.map((admin) => (
        <div key={admin.id}>
          <div className="w-64"><MemberChip m={admin} /></div>
          <div className="ml-8 mt-2 border-l-2 border-gray-200 pl-4 space-y-3">
            {hms.map((hm) => (
              <div key={hm.id}>
                <div className="w-56"><MemberChip m={hm} /></div>
                <div className="ml-6 mt-2 border-l-2 border-gray-100 pl-4 space-y-2">
                  {hrs.filter((hr) => hr.reports_to_id === hm.id).map((hr) => (
                    <div key={hr.id} className="w-48"><MemberChip m={hr} /></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "team" | "invites" | "stats" | "hierarchy";

export default function HRMSPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<MemberStats[]>([]);
  const [tab, setTab] = useState<Tab>("team");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamRes, invitesRes, statsRes] = await Promise.all([
        hrmsApi.getTeam(),
        hrmsApi.getInvites(),
        hrmsApi.getTeamStats(),
      ]);
      setMembers(teamRes.data);
      setInvites(invitesRes.data);
      setStats(statsRes.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to load HRMS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = async (memberId: string, newStatus: MemberStatus) => {
    try {
      await hrmsApi.updateMemberStatus(memberId, newStatus);
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, status: newStatus } : m));
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to update status");
    }
  };

  const totalCost = stats.reduce((s, m) => s + m.total_ai_cost_usd, 0);
  const totalHours = stats.reduce((s, m) => s + m.total_time_hours, 0);
  const totalActions = stats.reduce((s, m) => s + m.total_actions, 0);
  const activeMembers = members.filter((m) => m.status === "active").length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "team", label: "Team" },
    { key: "hierarchy", label: "Hierarchy" },
    { key: "invites", label: `Invites (${invites.filter((i) => i.status === "pending").length})` },
    { key: "stats", label: "Cost & Activity" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {showInviteModal && <InviteModal members={members} onClose={() => setShowInviteModal(false)} onSuccess={fetchAll} />}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">
          <span className="text-gray-900">Hire</span><span className="text-blue-600">Flow</span>
          <span className="ml-2 text-xs font-normal text-gray-400">Admin</span>
        </span>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <a href="/admin" className="hover:text-gray-900">Overview</a>
          <a href="/admin/users" className="hover:text-gray-900">Users</a>
          <a href="/admin/jobs" className="hover:text-gray-900">Jobs</a>
          <a href="/admin/audit" className="hover:text-gray-900">Audit</a>
          <a href="/admin/hrms" className="text-blue-600 font-semibold">HRMS</a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HRMS</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your hiring team hierarchy, invites, and activity</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Invite Member
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Team Members" value={activeMembers} sub={`${members.length} total`} />
              <StatCard label="Monthly Actions" value={totalActions} sub="This month" />
              <StatCard label="AI Cost (USD)" value={`$${totalCost.toFixed(2)}`} sub="This month" />
              <StatCard label="Team Hours" value={`${totalHours.toFixed(1)}h`} sub="This month" />
            </div>

            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Team tab */}
            {tab === "team" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {members.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No team members yet. Invite someone to get started.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Member", "Role", "Reports To", "Invites", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {members.map((m) => {
                        const manager = members.find((x) => x.id === m.reports_to_id);
                        return (
                          <tr key={m.id} className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{m.name[0]}</div>
                                <div>
                                  <div className="font-medium text-gray-800">{m.name}</div>
                                  <div className="text-xs text-gray-400">{m.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><Badge label={ROLE_LABELS[m.role]} cls={ROLE_COLORS[m.role]} /></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{manager ? manager.name : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {m.invites_used}/{m.invite_limit}
                              <div className="w-16 bg-gray-100 rounded-full h-1 mt-1">
                                <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${Math.min(100, (m.invites_used / m.invite_limit) * 100)}%` }} />
                              </div>
                            </td>
                            <td className="px-4 py-3"><Badge label={m.status} cls={STATUS_COLORS[m.status]} /></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {m.role !== "company_admin" && m.status === "active" && (
                                  <button onClick={() => handleStatusChange(m.id, "suspended")} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">Suspend</button>
                                )}
                                {m.role !== "company_admin" && m.status === "suspended" && (
                                  <button onClick={() => handleStatusChange(m.id, "active")} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition">Activate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Hierarchy tab */}
            {tab === "hierarchy" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Team Hierarchy</h3>
                <HierarchyTree members={members} />
              </div>
            )}

            {/* Invites tab */}
            {tab === "invites" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {invites.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No invites sent yet</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Invitee", "Role", "Status", "Sent", "Expires"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invites.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{inv.name ?? "—"}</div>
                            <div className="text-xs text-gray-400">{inv.email}</div>
                          </td>
                          <td className="px-4 py-3"><Badge label={ROLE_LABELS[inv.role]} cls={ROLE_COLORS[inv.role]} /></td>
                          <td className="px-4 py-3"><Badge label={inv.status} cls={INVITE_STATUS_COLORS[inv.status]} /></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Stats tab */}
            {tab === "stats" && (
              <div className="space-y-4">
                {stats.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12 text-gray-400 text-sm">No activity recorded this month yet</div>
                ) : (
                  stats.map((s) => (
                    <div key={s.member_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">{s.member_name[0]}</div>
                          <div>
                            <div className="font-medium text-gray-800">{s.member_name}</div>
                            <Badge label={ROLE_LABELS[s.role as HRMSRole] ?? s.role} cls={ROLE_COLORS[s.role as HRMSRole] ?? "bg-gray-100 text-gray-600"} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">${s.total_ai_cost_usd.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">AI cost this month</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3 text-center">
                        {[
                          { label: "Actions", value: s.total_actions },
                          { label: "Stage Moves", value: s.stage_moves },
                          { label: "Interviews", value: s.interviews_scheduled },
                          { label: "Hours", value: `${s.total_time_hours}h` },
                          { label: "AI Tokens", value: s.total_ai_tokens.toLocaleString() },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-base font-bold text-gray-900">{value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}