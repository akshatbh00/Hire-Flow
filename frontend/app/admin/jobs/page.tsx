// "use client";
// // frontend/app/admin/jobs/page.tsx
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUserStore } from "@/store/user.store";
// import { useRouter } from "next/navigation";

// const BASE = "http://localhost:8001/api/v1";

// function req(path: string, options: RequestInit = {}) {
//   const token = typeof window !== "undefined" ? localStorage.getItem("hf_token") : "";
//   return fetch(`${BASE}${path}`, {
//     ...options,
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
//   }).then(r => r.json());
// }

// const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
//   live:             { bg: "#F0FDF4", text: "#15803D" },
//   pending_approval: { bg: "#FFFBEB", text: "#92400E" },
//   rejected:         { bg: "#FEF2F2", text: "#DC2626" },
//   closed:           { bg: "#F1F5F9", text: "#64748B" },
// };

// function toL(val: number) {
//   const l = val / 100000;
//   return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
// }

// export default function AdminJobsPage() {
//   const { logout } = useUserStore();
//   const router = useRouter();

//   const [jobs,    setJobs]    = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search,  setSearch]  = useState("");
//   const [status,  setStatus]  = useState("all");
//   const [acting,  setActing]  = useState<string | null>(null);

//   useEffect(() => { loadJobs(); }, []);

//   async function loadJobs() {
//     setLoading(true);
//     try {
//       // Fetch all jobs — admin sees everything
//       const data = await req("/jobs?limit=100");
//       setJobs(Array.isArray(data) ? data : []);
//     } catch { setJobs([]); }
//     finally { setLoading(false); }
//   }

//   async function handleClose(jobId: string) {
//     setActing(jobId);
//     try {
//       await req(`/jobs/${jobId}/close`, { method: "POST" });
//       setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "closed", is_active: false } : j));
//     } catch {}
//     finally { setActing(null); }
//   }

//   async function handleApprove(jobId: string) {
//     setActing(jobId);
//     try {
//       await req(`/jobs/${jobId}/approve`, { method: "POST" });
//       setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "live", is_active: true } : j));
//     } catch {}
//     finally { setActing(null); }
//   }

//   const filtered = jobs.filter(j => {
//     const matchStatus = status === "all" || j.status?.toLowerCase().replace("jobstatus.", "") === status;
//     const matchSearch = !search ||
//       j.title?.toLowerCase().includes(search.toLowerCase()) ||
//       j.company_name?.toLowerCase().includes(search.toLowerCase()) ||
//       j.location?.toLowerCase().includes(search.toLowerCase());
//     return matchStatus && matchSearch;
//   });

//   // Normalise status string from backend (e.g. "JobStatus.LIVE" → "live")
//   function normaliseStatus(s: string) {
//     return s?.toLowerCase().replace("jobstatus.", "").replace("_", " ") ?? "unknown";
//   }

//   const counts = {
//     total:    jobs.length,
//     live:     jobs.filter(j => normaliseStatus(j.status) === "live").length,
//     pending:  jobs.filter(j => normaliseStatus(j.status) === "pending approval").length,
//     closed:   jobs.filter(j => normaliseStatus(j.status) === "closed").length,
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
//       <style suppressHydrationWarning>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
//         *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
//         .row:hover{background:#F8FAFC!important}
//         .inp:focus{border-color:#4F46E5!important;outline:none}
//       `}</style>

//       {/* Nav */}
//       <nav style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 32px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
//         <Link href="/admin" style={{ textDecoration: "none" }}>
//           <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
//             Hire<span style={{ color: "#4F46E5" }}>Flow</span>
//           </span>
//         </Link>
//         <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
//           {[
//             { href: "/admin",       label: "Overview" },
//             { href: "/admin/users", label: "Users" },
//             { href: "/admin/jobs",  label: "Jobs", active: true },
//             { href: "/admin/audit", label: "Audit" },
//           ].map(l => (
//             <Link key={l.href} href={l.href} style={{
//               fontSize: 12, fontWeight: (l as any).active ? 600 : 400,
//               color: (l as any).active ? "#4F46E5" : "#64748B",
//               textDecoration: "none", padding: "5px 10px", borderRadius: 8,
//               background: (l as any).active ? "#EEF2FF" : "transparent",
//             }}>{l.label}</Link>
//           ))}
//           <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", marginLeft: 6 }}>ADMIN</span>
//           <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 12, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>Sign out</button>
//         </div>
//       </nav>

//       <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>

//         {/* Header */}
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
//           <div>
//             <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>All Jobs</h1>
//             <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Manage every job across all companies</p>
//           </div>
//           <Link href="/jobs/create" style={{ background: "#4F46E5", color: "#fff", padding: "8px 18px", borderRadius: 9, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
//             + Post Job
//           </Link>
//         </div>

//         {/* Stats */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
//           {[
//             { label: "Total Jobs", value: counts.total,   color: "#0F172A" },
//             { label: "Live",       value: counts.live,    color: "#15803D" },
//             { label: "Pending",    value: counts.pending, color: "#92400E" },
//             { label: "Closed",     value: counts.closed,  color: "#64748B" },
//           ].map(({ label, value, color }) => (
//             <div key={label} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "12px 16px" }}>
//               <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</p>
//               <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
//             </div>
//           ))}
//         </div>

//         {/* Filters */}
//         <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
//           <input className="inp" value={search} onChange={e => setSearch(e.target.value)}
//             placeholder="Search by title, company, location..."
//             style={{ padding: "8px 13px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", width: 280, color: "#0F172A", background: "#fff" }} />
//           {[
//             { val: "all",     label: "All" },
//             { val: "live",    label: "Live" },
//             { val: "pending", label: "Pending" },
//             { val: "closed",  label: "Closed" },
//           ].map(({ val, label }) => (
//             <button key={val} onClick={() => setStatus(val)} style={{
//               padding: "7px 14px", borderRadius: 20,
//               border: `1px solid ${status === val ? "#C7D7FE" : "#E2E8F0"}`,
//               background: status === val ? "#EEF2FF" : "#fff",
//               color: status === val ? "#4338CA" : "#64748B",
//               fontSize: 12, fontWeight: status === val ? 600 : 400,
//               cursor: "pointer", fontFamily: "inherit",
//             }}>{label}</button>
//           ))}
//         </div>

//         {/* Table */}
//         <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 90px 120px", gap: 10, padding: "10px 20px", background: "#F8FAFC", borderBottom: "0.5px solid #E2E8F0" }}>
//             {["Job", "Company", "Type", "Salary", "Status", "Actions"].map(h => (
//               <p key={h} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
//             ))}
//           </div>

//           {loading ? (
//             <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Loading jobs...</div>
//           ) : filtered.length === 0 ? (
//             <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No jobs match your filters</div>
//           ) : filtered.map((job, i) => {
//             const st  = normaliseStatus(job.status);
//             const sc  = STATUS_COLORS[st.replace(" ", "_")] ?? { bg: "#F1F5F9", text: "#64748B" };
//             const isPending = st === "pending approval";
//             const isLive    = st === "live";
//             return (
//               <div key={job.id} className="row" style={{
//                 display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 90px 120px",
//                 gap: 10, padding: "12px 20px",
//                 borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none",
//                 alignItems: "center", transition: "background 0.1s",
//               }}>
//                 <div style={{ minWidth: 0 }}>
//                   <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</p>
//                   <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{job.location || "Remote"}</p>
//                 </div>
//                 <p style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.company_name || "—"}</p>
//                 <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: "#EEF2FF", color: "#4338CA", width: "fit-content" }}>
//                   {job.job_type}
//                 </span>
//                 <p style={{ fontSize: 12, color: "#475569" }}>
//                   {job.salary_min ? `₹${toL(job.salary_min)}` : "—"}
//                 </p>
//                 <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text, width: "fit-content", whiteSpace: "nowrap" }}>
//                   {st}
//                 </span>
//                 <div style={{ display: "flex", gap: 6 }}>
//                   <Link href={`/jobs/${job.id}/pipeline`} style={{ fontSize: 10, color: "#4F46E5", fontWeight: 600, textDecoration: "none", padding: "4px 9px", borderRadius: 7, background: "#EEF2FF" }}>
//                     View
//                   </Link>
//                   {isPending && (
//                     <button onClick={() => handleApprove(job.id)} disabled={acting === job.id}
//                       style={{ fontSize: 10, color: "#15803D", fontWeight: 600, padding: "4px 9px", borderRadius: 7, background: "#F0FDF4", border: "1px solid #BBF7D0", cursor: "pointer", fontFamily: "inherit" }}>
//                       {acting === job.id ? "..." : "Approve"}
//                     </button>
//                   )}
//                   {isLive && (
//                     <button onClick={() => handleClose(job.id)} disabled={acting === job.id}
//                       style={{ fontSize: 10, color: "#DC2626", fontWeight: 500, padding: "4px 9px", borderRadius: 7, background: "#FEF2F2", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>
//                       {acting === job.id ? "..." : "Close"}
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </main>
//     </div>
//   );
// }


"use client";
// frontend/app/admin/jobs/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

function req(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("hf_token") : "";
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  }).then(r => r.json());
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  live:             { bg: "#F0FDF4", text: "#15803D" },
  pending_approval: { bg: "#FFFBEB", text: "#92400E" },
  rejected:         { bg: "#FEF2F2", text: "#DC2626" },
  closed:           { bg: "#F1F5F9", text: "#64748B" },
};

function toL(val: number) {
  const l = val / 100000;
  return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
}

const NAV_LINKS = [
  { href: "/admin",       label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/jobs",  label: "Jobs",  active: true },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminJobsPage() {
  const { logout } = useUserStore();
  const router = useRouter();

  const [jobs,     setJobs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("all");
  const [acting,   setActing]   = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await req("/jobs?limit=100");
      setJobs(Array.isArray(data) ? data : []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }

  async function handleClose(jobId: string) {
    setActing(jobId);
    try {
      await req(`/jobs/${jobId}/close`, { method: "POST" });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "closed", is_active: false } : j));
    } catch {}
    finally { setActing(null); }
  }

  async function handleApprove(jobId: string) {
    setActing(jobId);
    try {
      await req(`/jobs/${jobId}/approve`, { method: "POST" });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "live", is_active: true } : j));
    } catch {}
    finally { setActing(null); }
  }

  function normaliseStatus(s: string) {
    return s?.toLowerCase().replace("jobstatus.", "").replace("_", " ") ?? "unknown";
  }

  const filtered = jobs.filter(j => {
    const matchStatus = status === "all" || j.status?.toLowerCase().replace("jobstatus.", "").replace("_", " ") === status;
    const matchSearch = !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    total:   jobs.length,
    live:    jobs.filter(j => normaliseStatus(j.status) === "live").length,
    pending: jobs.filter(j => normaliseStatus(j.status) === "pending approval").length,
    closed:  jobs.filter(j => normaliseStatus(j.status) === "closed").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .row:hover{background:#F8FAFC!important}
        .inp:focus{border-color:#4F46E5!important;outline:none}
        .adm-nav-links { display: flex; }
        .adm-hamburger { display: none !important; }
        .adm-mobile-menu { display: none; }
        @media (max-width: 768px) {
          .adm-nav-links { display: none !important; }
          .adm-hamburger { display: flex !important; }
          .adm-mobile-menu.open { display: flex !important; }
          .adm-main { padding: 16px !important; }
          .adm-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .adm-table-header { display: none !important; }
          .adm-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 12px 14px !important;
          }
          .adm-row-company, .adm-row-type, .adm-row-salary { display: none !important; }
          .adm-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .adm-filter-row input { width: 100% !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "0.5px solid #E2E8F0", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Hire<span style={{ color: "#4F46E5" }}>Flow</span>
          </span>
        </Link>
        <div className="adm-nav-links" style={{ gap: 4, alignItems: "center" }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, fontWeight: l.active ? 600 : 400, color: l.active ? "#4F46E5" : "#64748B", textDecoration: "none", padding: "5px 10px", borderRadius: 8, background: l.active ? "#EEF2FF" : "transparent" }}>
              {l.label}
            </Link>
          ))}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", marginLeft: 6 }}>ADMIN</span>
          <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", fontSize: 12, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>Sign out</button>
        </div>
        {/* Mobile right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="adm-hamburger" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>ADMIN</span>
          <button className="adm-hamburger" onClick={() => setMenuOpen(v => !v)}
            style={{ flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <span style={{ display: "block", width: 22, height: 2, background: "#64748B", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#64748B", borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#64748B", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`adm-mobile-menu${menuOpen ? " open" : ""}`} style={{ flexDirection: "column", gap: 16, background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
            style={{ fontSize: 14, fontWeight: l.active ? 600 : 400, color: l.active ? "#4F46E5" : "#64748B", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
        <button onClick={() => { logout(); router.push("/login"); }}
          style={{ background: "none", border: "none", fontSize: 14, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0 }}>
          Sign out
        </button>
      </div>

      <main className="adm-main" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>

        {/* Header */}
        <div className="adm-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em" }}>All Jobs</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Manage every job across all companies</p>
          </div>
          <Link href="/jobs/create" style={{ background: "#4F46E5", color: "#fff", padding: "8px 18px", borderRadius: 9, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            + Post Job
          </Link>
        </div>

        {/* Stats */}
        <div className="adm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Jobs", value: counts.total,   color: "#0F172A" },
            { label: "Live",       value: counts.live,    color: "#15803D" },
            { label: "Pending",    value: counts.pending, color: "#92400E" },
            { label: "Closed",     value: counts.closed,  color: "#64748B" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="adm-filter-row" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input className="inp" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, company, location..."
            style={{ padding: "8px 13px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13, fontFamily: "inherit", width: 280, color: "#0F172A", background: "#fff" }} />
          {[
            { val: "all",     label: "All"     },
            { val: "live",    label: "Live"    },
            { val: "pending", label: "Pending" },
            { val: "closed",  label: "Closed"  },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setStatus(val)} style={{
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${status === val ? "#C7D7FE" : "#E2E8F0"}`,
              background: status === val ? "#EEF2FF" : "#fff",
              color: status === val ? "#4338CA" : "#64748B",
              fontSize: 12, fontWeight: status === val ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
          <div className="adm-table-header" style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 90px 120px", gap: 10, padding: "10px 20px", background: "#F8FAFC", borderBottom: "0.5px solid #E2E8F0" }}>
            {["Job", "Company", "Type", "Salary", "Status", "Actions"].map(h => (
              <p key={h} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Loading jobs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No jobs match your filters</div>
          ) : filtered.map((job, i) => {
            const st = normaliseStatus(job.status);
            const sc = STATUS_COLORS[st.replace(" ", "_")] ?? { bg: "#F1F5F9", text: "#64748B" };
            const isPending = st === "pending approval";
            const isLive    = st === "live";
            return (
              <div key={job.id} className="row adm-row" style={{
                display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 90px 120px",
                gap: 10, padding: "12px 20px",
                borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none",
                alignItems: "center", transition: "background 0.1s",
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</p>
                  <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{job.location || "Remote"}</p>
                </div>
                <p className="adm-row-company" style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.company_name || "—"}</p>
                <span className="adm-row-type" style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: "#EEF2FF", color: "#4338CA", width: "fit-content" }}>
                  {job.job_type}
                </span>
                <p className="adm-row-salary" style={{ fontSize: 12, color: "#475569" }}>
                  {job.salary_min ? `₹${toL(job.salary_min)}` : "—"}
                </p>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text, width: "fit-content", whiteSpace: "nowrap" }}>
                  {st}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Link href={`/jobs/${job.id}/pipeline`} style={{ fontSize: 10, color: "#4F46E5", fontWeight: 600, textDecoration: "none", padding: "4px 9px", borderRadius: 7, background: "#EEF2FF" }}>
                    View
                  </Link>
                  {isPending && (
                    <button onClick={() => handleApprove(job.id)} disabled={acting === job.id}
                      style={{ fontSize: 10, color: "#15803D", fontWeight: 600, padding: "4px 9px", borderRadius: 7, background: "#F0FDF4", border: "1px solid #BBF7D0", cursor: "pointer", fontFamily: "inherit" }}>
                      {acting === job.id ? "..." : "Approve"}
                    </button>
                  )}
                  {isLive && (
                    <button onClick={() => handleClose(job.id)} disabled={acting === job.id}
                      style={{ fontSize: 10, color: "#DC2626", fontWeight: 500, padding: "4px 9px", borderRadius: 7, background: "#FEF2F2", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>
                      {acting === job.id ? "..." : "Close"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}