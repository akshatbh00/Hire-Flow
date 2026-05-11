"use client";

import { useEffect, useState } from "react";
import { insiderApi } from "@/lib/api";
import Link from "next/link";
import MobileTopBar, { MobileBottomNav } from "@/components/mobile/MobileNav";

export default function InsiderPage() {
  const [tab,          setTab]          = useState<"find" | "requests" | "my-profile">("find");
  const [company,      setCompany]      = useState("");
  const [insiders,     setInsiders]     = useState<any[]>([]);
  const [myRequests,   setMyRequests]   = useState<any[]>([]);
  const [pending,      setPending]      = useState<any[]>([]);
  const [workCompany,  setWorkCompany]  = useState("");
  const [isCurrent,    setIsCurrent]    = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState("");
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  useEffect(() => {
    insiderApi.myRequests().then(setMyRequests).catch(() => {});
    insiderApi.pendingRequests().then(setPending).catch(() => {});
  }, []);

  async function findInsiders() {
    if (!company.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await insiderApi.getInsiders(company.trim());
      setInsiders(res);
    } catch (e: any) {
      setError(e.message ?? "No insiders found.");
      setInsiders([]);
    } finally {
      setLoading(false);
    }
  }

  async function addWorkHistory() {
    if (!workCompany.trim()) return;
    try {
      await insiderApi.addWorkHistory(workCompany.trim(), isCurrent);
      setSuccess("Added to your work history! You're now visible as an insider.");
      setWorkCompany("");
    } catch (e: any) {
      setError(e.message ?? "Failed to add.");
    }
  }

  async function requestReferral(insider_user_id: string) {
    if (!msg.trim()) { setError("Please add a message."); return; }
    try {
      await insiderApi.requestReferral(insider_user_id, "", msg);
      setSuccess("Referral request sent!");
      setMsg("");
    } catch (e: any) {
      setError(e.message ?? "Failed to send request.");
    }
  }

  async function handleRequest(id: string, action: string) {
    try {
      await insiderApi.handleRequest(id, action);
      setPending((prev) => prev.filter((r) => r.id !== id));
      setSuccess(`Request ${action}ed successfully.`);
    } catch (e: any) {
      setError(e.message ?? "Failed.");
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

          .insider-main {
            padding: 16px 16px 88px !important;
          }

          .insider-search-row {
            flex-direction: column !important;
          }

          .insider-search-row input {
            width: 100% !important;
          }

          .insider-search-row button {
            width: 100% !important;
          }

          .insider-card-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .insider-card-actions {
            width: 100% !important;
            justify-content: flex-start !important;
          }

          .insider-card-actions button {
            flex: 1 !important;
          }

          .pending-card-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .pending-card-buttons {
            display: flex !important;
            width: 100% !important;
          }

          .pending-card-buttons button {
            flex: 1 !important;
          }

          .tabs-row {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .tabs-row button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }

          .workhistory-row {
            flex-direction: column !important;
          }

          .workhistory-row input {
            width: 100% !important;
          }

          .workhistory-row button {
            width: 100% !important;
          }
        }
      `}</style>

      <MobileTopBar />

      <nav className="desktop-nav-bar" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>Hire<span style={{ color: "#2563eb" }}>Flow</span></span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          {[{ href: "/dashboard", label: "Dashboard" }, { href: "/jobs", label: "Jobs" }, { href: "/insider", label: "Insider Network", active: true }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: (l as any).active ? 600 : 400, color: (l as any).active ? "#2563eb" : "#64748b", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
      </nav>

      <main className="insider-main" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Insider Network</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Connect with professionals at your target companies and get referrals</p>
        </div>

        {/* Tabs */}
        <div className="tabs-row" style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", marginBottom: 24 }}>
          {[{ key: "find", label: "Find Insiders" }, { key: "requests", label: `My Requests (${myRequests.length})` }, { key: "my-profile", label: "My Insider Profile" }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ padding: "10px 20px", fontSize: 14, fontWeight: tab === key ? 600 : 400, color: tab === key ? "#2563eb" : "#64748b", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", borderBottom: `2px solid ${tab === key ? "#2563eb" : "transparent"}`, marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {error && <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>{error}</div>}
        {success && <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 13, color: "#16a34a" }}>{success}</div>}

        {/* Find Insiders */}
        {tab === "find" && (
          <div>
            <div className="insider-search-row" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findInsiders()}
                placeholder="Search by company e.g. Google, Stripe..."
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
              <button onClick={findInsiders} disabled={loading}
                style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {loading ? "Searching..." : "Find"}
              </button>
            </div>

            {insiders.length === 0 && !loading && company && (
              <div style={{ textAlign: "center", padding: "40px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No insiders found at {company}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {insiders.map((insider: any) => (
                <div key={insider.user_id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                  <div className="insider-card-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {insider.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{insider.full_name}</p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>{insider.company_name} {insider.is_current ? "· Current" : "· Alumni"}</p>
                      </div>
                    </div>
                    <div className="insider-card-actions" style={{ display: "flex" }}>
                      <button onClick={() => requestReferral(insider.user_id)}
                        style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Request Referral
                      </button>
                    </div>
                  </div>
                  <textarea value={msg} onChange={(e) => setMsg(e.target.value)}
                    placeholder="Add a message with your referral request..."
                    style={{ width: "100%", marginTop: 12, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", color: "#374151", boxSizing: "border-box" }}
                    rows={2} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Requests */}
        {tab === "requests" && (
          <div>
            {/* Pending requests from others */}
            {pending.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Pending requests from others ({pending.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pending.map((r: any) => (
                    <div key={r.id} className="pending-card-row" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{r.requester_name ?? "Someone"}</p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>{r.message}</p>
                      </div>
                      <div className="pending-card-buttons" style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleRequest(r.id, "accept")}
                          style={{ padding: "7px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          Accept
                        </button>
                        <button onClick={() => handleRequest(r.id, "decline")}
                          style={{ padding: "7px 16px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My sent requests */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>My sent requests</p>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", border: "2px dashed #e2e8f0", borderRadius: 16, background: "#fff" }}>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No referral requests sent yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myRequests.map((r: any) => (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{r.insider_name ?? "Insider"}</p>
                      <p style={{ fontSize: 12, color: "#64748b" }}>{r.company_name}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: r.status === "accepted" ? "#f0fdf4" : r.status === "declined" ? "#fef2f2" : "#fffbeb", color: r.status === "accepted" ? "#16a34a" : r.status === "declined" ? "#dc2626" : "#b45309" }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Profile */}
        {tab === "my-profile" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Add Your Work History</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Add companies you've worked at to become visible as an insider. Other job seekers can then request referrals from you.
            </p>
            <div className="workhistory-row" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input value={workCompany} onChange={(e) => setWorkCompany(e.target.value)}
                placeholder="Company name e.g. Google, Stripe..."
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0f172a" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
              <button onClick={addWorkHistory}
                style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Add
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={() => setIsCurrent(!isCurrent)}
                style={{ width: 40, height: 22, borderRadius: 11, background: isCurrent ? "#2563eb" : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 3, left: isCurrent ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
              <span style={{ fontSize: 13, color: "#374151" }}>Currently working here</span>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}