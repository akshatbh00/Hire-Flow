"use client";
// frontend/app/(company)/recruiter-dashboard/page.tsx
import { useEffect, useState } from "react";
import { companyApi, CompanyStats, JobOut } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── constants ───────────────────────────────────────── */
const PIPELINE_STAGES = [
  { key: "applied",       label: "Applied"    },
  { key: "ats_screening", label: "Screening"  },
  { key: "round_1",       label: "Interview"  },
  { key: "hr_round",      label: "Assessment" },
  { key: "offer",         label: "Offer"      },
  { key: "selected",      label: "Selected"   },
];

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4338CA" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#EFF6FF", text: "#1D4ED8" },
  { bg: "#FDF4FF", text: "#7E22CE" },
];

/* ─── helpers ─────────────────────────────────────────── */
function pickColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ─── icon component ──────────────────────────────────── */
function Icon({ t }: { t: string }) {
  const p = { stroke: "#64748B", strokeWidth: 1.3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "clock")    return <svg {...s} {...p}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
  if (t === "salary")   return <svg {...s} {...p}><path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "bell")     return <svg {...s} {...p}><path d="M8 1a5 5 0 015 5v3l1.5 2.5H1.5L3 9V6a5 5 0 015-5zM6.5 13.5a1.5 1.5 0 003 0"/></svg>;
  return null;
}

/* ─── sidebar link ────────────────────────────────────── */
function SbLink({ href, icon, label, active, badge }: { href: string; icon: string; label: string; active?: boolean; badge?: number | null }) {
  return (
    <Link href={href} className="sb-lnk" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 14px", fontSize: 12, textDecoration: "none",
      color: active ? "#4F46E5" : "#64748B",
      background: active ? "#EEF2FF" : "transparent",
      fontWeight: active ? 600 : 400,
      margin: "1px 6px", borderRadius: 8,
    }}>
      <Icon t={icon} />
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#DC2626", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── main page ───────────────────────────────────────── */
export default function RecruiterDashboardPage() {
  const router           = useRouter();
  const { user, logout } = useUserStore();

  const [company, setCompany] = useState<any>(null);
  const [stats,   setStats]   = useState<CompanyStats | null>(null);
  const [jobs,    setJobs]    = useState<JobOut[]>([]);
  const [loading, setLoading] = useState(true);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] ?? "Recruiter";

  useEffect(() => {
    Promise.all([
      companyApi.me().catch(() => null),
      companyApi.stats().catch(() => ({ active_jobs: 0, total_applicants: 0, pipeline_breakdown: {} })),
      companyApi.myJobs().catch(() => []),
    ]).then(([c, s, j]) => {
      setCompany(c);
      setStats(s as CompanyStats);
      setJobs((j as JobOut[]).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const bd          = stats?.pipeline_breakdown ?? {};
  const maxVal      = Math.max(...PIPELINE_STAGES.map(s => bd[s.key] ?? 0), 1);
  const inPipeline  = Object.entries(bd).filter(([s]) => !["applied","ats_rejected","withdrawn"].includes(s)).reduce((a,[,v])=>a+v,0);
  const offers      = bd["offer"] ?? 0;

  // Placeholder activity — in production wire to a real feed endpoint
  const MOCK_NAMES  = ["Akshat Kumar","Priya Rao","Sneha K","Rohan V"];
  const MOCK_MSGS   = (job: JobOut, i: number) => [
    `applied to ${job.title}`,
    `moved to Interview · ${job.title}`,
    `requested referral for ${job.title}`,
    `accepted offer · ${job.title}`,
  ][i % 4];
  const MOCK_TIMES  = ["2h ago","5h ago","Yesterday","2 days ago"];

  const activity = jobs.slice(0, 4).map((job, i) => {
    const name = MOCK_NAMES[i % MOCK_NAMES.length];
    return { id: job.id, initials: getInitials(name), color: pickColor(name), msg: MOCK_MSGS(job, i), time: MOCK_TIMES[i] };
  });

  // Placeholder top candidates
  const topCands = jobs.slice(0, 3).map((job, i) => {
    const names  = ["Akshat Kumar","Priya Rao","Meera Shah"];
    const scores = [87, 82, 74];
    return { name: names[i], role: job.title, score: scores[i] };
  });

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F8FAFC", fontFamily:"'DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .sb-lnk{transition:background 0.1s,color 0.1s}
        .sb-lnk:hover{background:#F8FAFC!important;color:#0F172A!important}
        .jr:hover{background:#F8FAFC!important}
        .post-btn{transition:background 0.12s}
        .post-btn:hover{background:#4338CA!important}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:2px}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width:210, background:"#fff", borderRight:"0.5px solid #E2E8F0", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ padding:"18px 16px 12px", borderBottom:"0.5px solid #F1F5F9" }}>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.03em", color:"#0F172A" }}>Hire<span style={{ color:"#4F46E5" }}>Flow</span></span>
        </div>

        {company && (
          <div style={{ margin:"10px 10px 4px", padding:"7px 12px", background:"#F0FDF4", borderRadius:8, fontSize:11, fontWeight:600, color:"#15803D" }}>
            {company.name}
          </div>
        )}

        <div style={{ padding:"14px 6px 4px" }}>
          <div style={{ padding:"0 10px 6px", fontSize:9, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em" }}>Main</div>
          <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard"  active />
          <SbLink href="/recruiter-jobs"      icon="jobs" label="Jobs" badge={jobs.length} />
          <SbLink href="/candidates"          icon="cands" label="Candidates" />
          <SbLink href="/candidates"          icon="pipe"  label="Pipeline" />
        </div>

        <div style={{ padding:"10px 6px 4px" }}>
          <div style={{ padding:"0 10px 6px", fontSize:9, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em" }}>Tools</div>
          <SbLink href="/interview-prep" icon="clock"  label="Interview Prep" />
          <SbLink href="/salary"         icon="salary" label="Salary Data" />
          <SbLink href="/referrals"      icon="ref"    label="Referrals" />
        </div>

        <div style={{ marginTop:"auto", padding:"12px 6px", borderTop:"0.5px solid #F1F5F9" }}>
          <SbLink href="/settings" icon="settings" label="Settings" />
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 14px", marginTop:4 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"#4F46E5", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.full_name ?? "Recruiter"}</p>
              <p style={{ fontSize:10, color:"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email ?? ""}</p>
            </div>
            <button onClick={()=>{logout();router.push("/login");}} style={{ background:"none", border:"none", fontSize:10, color:"#94A3B8", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowY:"auto" }}>

        {/* Topbar */}
        <div style={{ background:"#fff", borderBottom:"0.5px solid #E2E8F0", padding:"0 24px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:40 }}>
          <p style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{greeting}, {firstName}</p>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/jobs/create" className="post-btn" style={{ background:"#4F46E5", color:"#fff", padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none" }}>
              + Post Job
            </Link>
            <div style={{ width:30, height:30, borderRadius:8, background:"#F8FAFC", border:"0.5px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer" }}>
              <Icon t="bell" />
              <div style={{ width:6, height:6, background:"#EF4444", borderRadius:"50%", position:"absolute", top:4, right:4 }} />
            </div>
          </div>
        </div>

        <div style={{ padding:"20px 24px", flex:1 }}>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:14 }}>
            {[
              { label:"Active Jobs",      value:stats?.active_jobs??0,      sub:"Open roles",        color:"#4F46E5" },
              { label:"Total Applicants", value:stats?.total_applicants??0, sub:"Across all roles",  color:"#0F172A" },
              { label:"In Pipeline",      value:inPipeline,                  sub:"Active candidates", color:"#7C3AED" },
              { label:"Offers Out",       value:offers,                      sub:"Awaiting response", color:"#15803D" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background:"#fff", border:"0.5px solid #E2E8F0", borderRadius:12, padding:"14px 16px" }}>
                <p style={{ fontSize:9, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:7 }}>{label}</p>
                <p style={{ fontSize:24, fontWeight:700, color, letterSpacing:"-0.03em" }}>{value}</p>
                <p style={{ fontSize:10, color:"#CBD5E1", marginTop:3 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Jobs table + pipeline */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 272px", gap:12, marginBottom:12 }}>

            {/* Jobs table */}
            <div style={{ background:"#fff", border:"0.5px solid #E2E8F0", borderRadius:12, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>Active Jobs</p>
                <Link href="/candidates" style={{ fontSize:11, color:"#4F46E5", textDecoration:"none", fontWeight:500 }}>View all →</Link>
              </div>
              {jobs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <p style={{ fontSize:13, color:"#94A3B8", marginBottom:12 }}>No jobs posted yet</p>
                  <Link href="/jobs/create" style={{ fontSize:12, fontWeight:600, color:"#4F46E5", textDecoration:"none" }}>Post first job →</Link>
                </div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 50px 65px 80px", gap:8, padding:"0 8px 8px", borderBottom:"0.5px solid #F1F5F9" }}>
                    {["Role","Applicants","New","Status",""].map(h=>(
                      <p key={h} style={{ fontSize:9, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</p>
                    ))}
                  </div>
                  {jobs.map((job, i) => (
                    <div key={job.id} className="jr" style={{ display:"grid", gridTemplateColumns:"1fr 70px 50px 65px 80px", gap:8, padding:"9px 8px", borderRadius:8, alignItems:"center", transition:"background 0.1s" }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{job.title}</p>
                        <p style={{ fontSize:10, color:"#94A3B8", marginTop:1 }}>{job.location||"Remote"} · {job.job_type}</p>
                      </div>
                      <p style={{ fontSize:12, fontWeight:600, color:"#0F172A" }}>—</p>
                      <p style={{ fontSize:12, fontWeight:600, color:"#4F46E5" }}>—</p>
                      <span style={{ fontSize:9, fontWeight:600, padding:"2px 8px", borderRadius:10, background:"#F0FDF4", color:"#15803D", whiteSpace:"nowrap" }}>Live</span>
                      <div style={{ display:"flex", gap:8 }}>
                        <Link href={`/jobs/${job.id}/pipeline`} style={{ fontSize:10, color:"#4F46E5", fontWeight:500, textDecoration:"none" }}>View</Link>
                        <span style={{ fontSize:10, color:"#94A3B8", cursor:"pointer" }}>Edit</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Pipeline breakdown */}
            <div style={{ background:"#fff", border:"0.5px solid #E2E8F0", borderRadius:12, padding:"16px" }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginBottom:14 }}>Pipeline</p>
              {PIPELINE_STAGES.map(({ key, label }) => {
                const count = bd[key] ?? 0;
                const pct   = maxVal > 0 ? (count / maxVal) * 100 : 0;
                const isGood = key === "selected" || key === "offer";
                return (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <p style={{ fontSize:10, color:"#64748B", width:76, flexShrink:0 }}>{label}</p>
                    <div style={{ flex:1, height:6, background:"#F1F5F9", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${Math.max(pct, count>0?3:0)}%`, height:"100%", background: isGood?"#15803D":"#4F46E5", borderRadius:3, transition:"width 0.6s ease" }} />
                    </div>
                    <p style={{ fontSize:10, fontWeight:600, color:"#0F172A", width:18, textAlign:"right", flexShrink:0 }}>{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity + top candidates */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

            <div style={{ background:"#fff", border:"0.5px solid #E2E8F0", borderRadius:12, padding:"16px" }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginBottom:14 }}>Recent Activity</p>
              {activity.length === 0 ? (
                <p style={{ fontSize:12, color:"#94A3B8", textAlign:"center", padding:"24px 0" }}>No activity yet — post a job to get started</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {activity.map((a, i) => (
                    <div key={a.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom: i < activity.length-1 ? "0.5px solid #F8FAFC":"none" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:a.color.bg, color:a.color.text, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {a.initials}
                      </div>
                      <div>
                        <p style={{ fontSize:12, color:"#374151", lineHeight:1.4 }}>{a.msg}</p>
                        <p style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background:"#fff", border:"0.5px solid #E2E8F0", borderRadius:12, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>Top Candidates</p>
                <Link href="/candidates" style={{ fontSize:11, color:"#4F46E5", textDecoration:"none", fontWeight:500 }}>View all →</Link>
              </div>
              {jobs.length === 0 ? (
                <p style={{ fontSize:12, color:"#94A3B8", textAlign:"center", padding:"24px 0" }}>Post a job to see candidates</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {topCands.map((c) => {
                    const col = pickColor(c.name);
                    return (
                      <div key={c.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"#F8FAFC", borderRadius:9 }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background:col.bg, color:col.text, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {getInitials(c.name)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</p>
                          <p style={{ fontSize:10, color:"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.role}</p>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, flexShrink:0, background:c.score>=80?"#F0FDF4":"#FFFBEB", color:c.score>=80?"#15803D":"#D97706" }}>
                          {c.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F8FAFC", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:210, background:"#fff", borderRight:"0.5px solid #E2E8F0" }} />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#0F172A", marginBottom:12 }}>Hire<span style={{ color:"#4F46E5" }}>Flow</span></div>
          <div style={{ display:"flex", gap:5, justifyContent:"center" }}>
            {[0,1,2].map(i=>(
              <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#4F46E5", opacity:0.4, animation:"pulse 1s infinite", animationDelay:`${i*0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}