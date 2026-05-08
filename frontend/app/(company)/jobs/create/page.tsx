"use client";
// frontend/app/(company)/jobs/create/page.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jobsApi, JobCreate } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";

const JOB_TYPES = ["fulltime", "parttime", "contract", "internship", "remote"];

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL",
  "Java", "Go", "Rust", "AWS", "Docker", "Kubernetes", "Git",
  "Machine Learning", "Data Analysis", "Product Management",
  "Figma", "Communication", "Leadership",
];

/* ─── Icons ─────────────────────────────────────────── */
function Icon({ t }: { t: string }) {
  const p = {
    stroke: "currentColor",
    strokeWidth: 1.3,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = { width: 14, height: 14, viewBox: "0 0 16 16" };
  if (t === "grid")     return <svg {...s}><rect x="1" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="#4F46E5"/></svg>;
  if (t === "jobs")     return <svg {...s} {...p}><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/></svg>;
  if (t === "cands")    return <svg {...s} {...p}><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.761 2.239-5 5-5"/><circle cx="12" cy="10" r="2.5"/><path d="M10 12.5l1.5 1.5 2.5-2.5"/></svg>;
  if (t === "pipe")     return <svg {...s} {...p}><path d="M2 4h12M2 8h10M2 12h8"/></svg>;
  if (t === "ref")      return <svg {...s} {...p}><path d="M10 8l4-4-4-4M14 4H6a4 4 0 000 8h1"/></svg>;
  if (t === "settings") return <svg {...s} {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>;
  if (t === "menu")     return <svg {...s} {...p}><path d="M1 4h14M1 8h14M1 12h14"/></svg>;
  if (t === "close")    return <svg {...s} {...p}><path d="M2 2l12 12M14 2L2 14"/></svg>;
  return null;
}

/* ─── Sidebar Link ───────────────────────────────────── */
function SbLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3.5 py-2 text-xs rounded-lg mx-1.5 my-px
        transition-all duration-100 no-underline font-medium
        ${active
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }
      `}
    >
      <span className={active ? "text-indigo-600" : "text-slate-400"}>
        <Icon t={icon} />
      </span>
      {label}
    </Link>
  );
}

/* ─── Sidebar Content ────────────────────────────────── */
function SidebarContent({
  user,
  onNavClick,
}: {
  user: any;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-[18px] border-b border-slate-100">
        <span className="text-[15px] font-bold tracking-tight text-slate-900">
          Hire<span className="text-indigo-600">Flow</span>
        </span>
      </div>

      <div className="pt-3.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Main</p>
        <SbLink href="/recruiter-dashboard" icon="grid"  label="Dashboard" onClick={onNavClick} />
        <SbLink href="/recruiter-jobs"      icon="jobs"  label="Jobs"       active onClick={onNavClick} />
        <SbLink href="/candidates"          icon="cands" label="Candidates" onClick={onNavClick} />
        <SbLink href="/candidates"          icon="pipe"  label="Pipeline"   onClick={onNavClick} />
      </div>

      <div className="pt-2.5 pb-1 px-1.5">
        <p className="px-2.5 pb-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Tools</p>
        <SbLink href="/referrals" icon="ref" label="Referrals" onClick={onNavClick} />
      </div>

      <div className="mt-auto border-t border-slate-100 py-3 px-1.5">
        <SbLink href="/settings" icon="settings" label="Settings" onClick={onNavClick} />
        <div className="flex items-center gap-2.5 px-3.5 py-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {user?.full_name?.[0]?.toUpperCase() ?? "R"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-900 truncate">{user?.full_name ?? "Recruiter"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Card wrapper ───────────────────────────────────── */
function Card({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
      <label className="block text-[13px] font-semibold text-slate-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Shared input className ────────────────────────── */
const inputCls = `
  w-full px-3 py-2 text-[13px] text-slate-900 bg-white
  border border-slate-200 rounded-lg outline-none
  transition-all duration-150
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10
  placeholder:text-slate-400
  font-[inherit]
`;

/* ─── Main Page ─────────────────────────────────────── */
export default function CreateJobPage() {
  const router    = useRouter();
  const { user }  = useUserStore();

  const [form, setForm] = useState({
    title:       "",
    description: "",
    job_type:    "fulltime",
    location:    "",
    remote_ok:   false,
    salary_min:  "",
    salary_max:  "",
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput,     setReqInput]     = useState("");
  const [skills,       setSkills]       = useState<string[]>([]);
  const [skillInput,   setSkillInput]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function set(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addReq() {
    const t = reqInput.trim();
    if (t && !requirements.includes(t)) { setRequirements(r => [...r, t]); setReqInput(""); }
  }

  function addSkill(s?: string) {
    const t = (s ?? skillInput).trim();
    if (t && !skills.includes(t)) { setSkills(sk => [...sk, t]); setSkillInput(""); }
  }

  async function handleSubmit() {
    if (!form.title.trim())       { setError("Job title is required.");           return; }
    if (!form.description.trim()) { setError("Job description is required.");     return; }
    if (skills.length === 0)      { setError("Add at least one required skill."); return; }

    setLoading(true); setError("");

    const body: JobCreate = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      requirements: [...requirements, ...skills],
      job_type:     form.job_type,
      location:     form.location.trim(),
      remote_ok:    form.remote_ok,
      salary_min:   form.salary_min ? Number(form.salary_min) * 100000 : undefined,
      salary_max:   form.salary_max ? Number(form.salary_max) * 100000 : undefined,
    };

    try {
      const job = await jobsApi.create(body);
      await fetch(`http://localhost:8001/api/v1/jobs/${job.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("hf_token")}` },
      });
      router.push("/recruiter-jobs");
    } catch (e: any) {
      setError(e.message ?? "Failed to create job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen z-40
          w-[210px] bg-white border-r border-slate-200
          flex flex-col shrink-0 overflow-y-auto
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <button
          className="absolute top-3 right-3 md:hidden text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <Icon t="close" />
        </button>
        <SidebarContent user={user} onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 h-[52px] flex items-center gap-3 shrink-0">

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Icon t="menu" />
          </button>

          <div className="flex items-center gap-2 text-[13px]">
            <Link href="/recruiter-jobs" className="text-indigo-600 no-underline font-medium hover:text-indigo-700">
              ← Jobs
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Post a Job</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">

            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Post a New Job</h1>
              <p className="text-slate-400 text-[13px] mt-1">Fill in the details below. The job will go live immediately.</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">

              {/* Title */}
              <Card label="Job Title" required>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </Card>

              {/* Description */}
              <Card label="Job Description" required>
                <textarea
                  className={`${inputCls} resize-y leading-relaxed`}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the role, responsibilities, and what success looks like..."
                  rows={5}
                />
              </Card>

              {/* Skills */}
              <Card label="Required Skills" required>
                <div className="flex gap-2 mb-3">
                  <input
                    className={`${inputCls} flex-1`}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="e.g. React, Python, SQL..."
                  />
                  <button
                    onClick={() => addSkill()}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap font-[inherit]"
                  >
                    Add
                  </button>
                </div>

                {/* Quick-add chips */}
                <div className={`flex flex-wrap gap-1.5 ${skills.length > 0 ? "mb-3" : ""}`}>
                  {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-pointer font-[inherit]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                {/* Added skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <span
                        key={s}
                        className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {s}
                        <button
                          onClick={() => setSkills(sk => sk.filter(x => x !== s))}
                          className="text-indigo-400 hover:text-indigo-700 bg-transparent border-none cursor-pointer text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* Requirements */}
              <Card label="Additional Requirements">
                <div className="flex gap-2 mb-3">
                  <input
                    className={`${inputCls} flex-1`}
                    value={reqInput}
                    onChange={(e) => setReqInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReq()}
                    placeholder="e.g. 3+ years experience, B.Tech CS..."
                  />
                  <button
                    onClick={addReq}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap font-[inherit]"
                  >
                    Add
                  </button>
                </div>
                {requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requirements.map(r => (
                      <span
                        key={r}
                        className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {r}
                        <button
                          onClick={() => setRequirements(prev => prev.filter(x => x !== r))}
                          className="text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* Job Details */}
              <Card label="Job Details">
                {/* Type + Location — stack on mobile, side-by-side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Job Type</label>
                    <select
                      className={`${inputCls} cursor-pointer`}
                      value={form.job_type}
                      onChange={(e) => set("job_type", e.target.value)}
                    >
                      {JOB_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Location</label>
                    <input
                      className={inputCls}
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="e.g. Bangalore, India"
                    />
                  </div>
                </div>

                {/* Remote toggle */}
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={form.remote_ok}
                    onClick={() => set("remote_ok", !form.remote_ok)}
                    className={`
                      relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer border-none shrink-0
                      ${form.remote_ok ? "bg-indigo-600" : "bg-slate-200"}
                    `}
                  >
                    <span
                      className={`
                        absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm
                        transition-all duration-200
                        ${form.remote_ok ? "left-[18px]" : "left-0.5"}
                      `}
                    />
                  </button>
                  <span className="text-[13px] text-slate-700 font-medium">Remote OK</span>
                </div>
              </Card>

              {/* Salary */}
              <Card label="Salary Range (in Lakhs/yr)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Min (₹L)</label>
                    <input
                      className={inputCls}
                      type="number"
                      value={form.salary_min}
                      onChange={(e) => set("salary_min", e.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Max (₹L)</label>
                    <input
                      className={inputCls}
                      type="number"
                      value={form.salary_max}
                      onChange={(e) => set("salary_max", e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </div>
                </div>
              </Card>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1 pb-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`
                    flex-1 py-3 rounded-xl text-[14px] font-bold text-white border-none
                    transition-colors duration-150 cursor-pointer font-[inherit]
                    ${loading
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                    }
                  `}
                >
                  {loading ? "Posting..." : "Post Job →"}
                </button>
                <Link
                  href="/recruiter-jobs"
                  className="
                    sm:w-auto flex items-center justify-center
                    px-6 py-3 border border-slate-200 rounded-xl
                    text-[13px] font-medium text-slate-600 no-underline
                    bg-white hover:bg-slate-50 hover:border-slate-300
                    transition-colors text-center
                  "
                >
                  Cancel
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}