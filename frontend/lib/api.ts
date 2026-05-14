/**
 * lib/api.ts — typed API client for all backend calls
 * Uses fetch with auto JWT injection from localStorage
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function req<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("hf_token") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) => req<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }, false),

  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    }).then((r) => r.json()) as Promise<TokenResponse>;
  },

  me: () => req<UserOut>("/auth/me"),

  onboarding: (body: {
    job_titles: string[];
    locations: string[];
    job_type: string;
  }) => req<UserOut>("/auth/onboarding", { method: "PATCH", body: JSON.stringify(body) }),
};

// ── Resume ─────────────────────────────────────────────────────────────────

export const resumeApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const token = localStorage.getItem("hf_token");
    return fetch(`${BASE}/resume/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then((r) => r.json()) as Promise<{ resume_id: string; status: string }>;
  },

  me:           ()                          => req<ResumeOut>("/resume/me"),
  ats:          (id: string)                => req<AtsReport>(`/resume/${id}/ats`),
  benchmark:    (id: string, title: string) => req<BenchmarkResult>(`/resume/${id}/benchmark?job_title=${encodeURIComponent(title)}`),
  matchedJobs:  (id: string, limit = 20)    => req<JobOut[]>(`/resume/${id}/jobs?limit=${limit}`),
};

// ── Jobs ───────────────────────────────────────────────────────────────────

export const jobsApi = {
  list: (params?: {
    job_type?: string;
    location?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return req<JobOut[]>(`/jobs${q ? "?" + q : ""}`);
  },

  get:        (id: string)      => req<JobOut>(`/jobs/${id}`),
  candidates: (id: string)      => req<CandidateOut[]>(`/jobs/${id}/candidates`),
  create:     (body: JobCreate) => req<JobOut>("/jobs", { method: "POST", body: JSON.stringify(body) }),
  delete:     (id: string)      => req<null>(`/jobs/${id}`, { method: "DELETE" }),
};

// ── Applications ───────────────────────────────────────────────────────────

export const applicationsApi = {
  apply:   (job_id: string, resume_id?: string) =>
    req<ApplicationOut>("/applications", {
      method: "POST",
      body: JSON.stringify({ job_id, resume_id }),
    }),
  list:    ()          => req<ApplicationOut[]>("/applications"),
  get:     (id: string) => req<ApplicationOut>(`/applications/${id}`),
  history: (id: string) => req<StageHistory[]>(`/applications/${id}/history`),
  withdraw:(id: string) => req<null>(`/applications/${id}/withdraw`, { method: "DELETE" }),
};

// ── Users ──────────────────────────────────────────────────────────────────

export const usersApi = {
  dashboard:         ()           => req<DashboardOut>("/users/dashboard"),
  updateProfile:     (body: any)  => req<UserOut>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  markNotifsRead:    ()           => req<any>("/users/notifications/read", { method: "POST" }),
};

// ── Pipeline ───────────────────────────────────────────────────────────────

export const pipelineApi = {
  move: (application_id: string, to_stage: string, notes?: string) =>
    req<any>("/pipeline/move", {
      method: "POST",
      body: JSON.stringify({ application_id, to_stage, notes }),
    }),
  kanban:  (job_id: string)  => req<any>(`/pipeline/job/${job_id}/kanban`),
  history: (app_id: string)  => req<StageHistory[]>(`/pipeline/application/${app_id}/history`),
};

// ── Premium ────────────────────────────────────────────────────────────────

export const premiumApi = {
  tailor:      (resume_id: string, job_id: string) =>
    req<any>("/premium/tailor", { method: "POST", body: JSON.stringify({ resume_id, job_id }) }),
  bullets:     (bullets: string[], job_title: string) =>
    req<any>("/premium/bullets", { method: "POST", body: JSON.stringify({ bullets, job_title }) }),
  gapAnalysis: (job_title: string) =>
    req<any>(`/premium/gap-analysis?job_title=${encodeURIComponent(job_title)}`),
};

// ── KAREN ─────────────────────────────────────────────────────────────────────────────────────────────

export const karenApi = {
  chat: (message: string) =>
    req<{ reply: string }>("/karen/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

// ── Company ────────────────────────────────────────────────────────────────


export const companyApi = {
  setup: (body: { name: string; size?: string; industry?: string; website?: string }) =>
    req<CompanyOut>("/companies/setup", { method: "POST", body: JSON.stringify(body) }),
  me:     ()          => req<CompanyOut>("/companies/me"),
  stats:  ()          => req<CompanyStats>("/companies/me/stats"),
  myJobs: ()          => req<JobOut[]>("/companies/me/jobs"),          // ← ADD THIS
  update: (id: string, body: { name?: string; website?: string; description?: string; logo_url?: string }) =>
    req<CompanyOut>(`/companies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  invite: (email: string, company_id: string) =>
    req<any>(`/companies/${company_id}/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
 

// ── Types ──────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type:   string;
  user_id:      string;
  role:         string;
  tier:         string;
}

export interface UserOut {
  id:        string;
  email:     string;
  full_name: string;
  role:      string;
  tier:      string;
  is_active: boolean;
}

export interface ResumeOut {
  resume_id:   string;
  ats_score:   number;
  ats_report:  AtsReport;
  parsed_data: ParsedResume;
  file_url:    string;
}

export interface AtsReport {
  score:            number;
  breakdown:        Record<string, number>;
  issues:           string[];
  missing_sections: string[];
}

export interface BenchmarkResult {
  percentile:       number;
  similarity_score: number;
  pool_size:        number;
  skill_gaps:       string[];
  strength_skills:  string[];
  improvement_pts:  number;
}

export interface ParsedResume {
  name:                    string;
  email:                   string;
  skills:                  string[];
  total_experience_years:  number;
  current_title:           string;
  experience:              any[];
  education:               any[];
}

export interface JobOut {
  id:           string;
  title:        string;
  description:  string;
  job_type:     string;
  location:     string;
  remote_ok:    boolean;
  salary_min:   number | null;
  salary_max:   number | null;
  company_name: string;
  match_score:  number | null;
}

export interface JobCreate {
  title:        string;
  description:  string;
  requirements: string[];
  job_type:     string;
  location:     string;
  remote_ok:    boolean;
  salary_min?:  number;
  salary_max?:  number;
}

export interface ApplicationOut {
  id:              string;
  job_id:          string;
  user_id:         string;
  current_stage:   string;
  highest_stage:   string;
  match_score:     number | null;
  benchmark_score: number | null;
  job_title:       string;
  company_name:    string;
}

export interface StageHistory {
  from_stage: string;
  to_stage:   string;
  notes:      string | null;
  moved_at:   string;
}

export interface DashboardOut {
  user_id:          string;
  full_name:        string;
  tier:             string;
  active_resume:    any;
  highest_stage:    string | null;
  total_applied:    number;
  active_pipeline:  any[];
  top_job_matches:  any[];
  notifications:    any[];
}

export interface CandidateOut {
  resume_id:   string;
  user_id:     string;
  full_name:   string;
  email:       string;
  match_score: number;
  ats_score:   number;
}

export interface CompanyOut {
  id:          string;
  name:        string;
  slug:        string;
  website:     string;
  description: string;
  logo_url:    string;
}

export interface CompanyStats {
  active_jobs:        number;
  total_applicants:   number;
  pipeline_breakdown: Record<string, number>;
}
// ── Salary ────────────────────────────────────────────────────────────────────

export const salaryApi = {
  insights: (job_title: string, location?: string) => {
    const q = new URLSearchParams({ job_title, ...(location ? { location } : {}) }).toString();
    return req<SalaryInsight>(`/salary/insights?${q}`);
  },
  byLocation: (job_title: string) =>
    req<any>(`/salary/by-location?job_title=${encodeURIComponent(job_title)}`),
};

// ── Courses ───────────────────────────────────────────────────────────────────

export const coursesApi = {
  forSkills: (skills: string[]) =>
    req<any>(`/courses/for-skills?skills=${encodeURIComponent(skills.join(","))}`),
};

// ── Insider ───────────────────────────────────────────────────────────────────

export const insiderApi = {
  addWorkHistory:   (company_name: string, is_current: boolean) =>
    req<any>("/insider/work-history", { method: "POST", body: JSON.stringify({ company_name, is_current }) }),
  getInsiders:      (company_name: string) =>
    req<any[]>(`/insider/at-company?company_name=${encodeURIComponent(company_name)}`),
  requestReferral:  (insider_user_id: string, job_id: string, message: string) =>
    req<any>("/insider/referral-request", { method: "POST", body: JSON.stringify({ insider_user_id, job_id, message }) }),
  myRequests:       () => req<any[]>("/insider/my-requests"),
  pendingRequests:  () => req<any[]>("/insider/pending-requests"),
  handleRequest:    (request_id: string, action: string) =>
    req<any>(`/insider/referral-request/${request_id}/action`, { method: "POST", body: JSON.stringify({ action }) }),
};

// ── Referrals ─────────────────────────────────────────────────────────────────

export const referralsApi = {
  create: (job_id: string) =>
    req<any>("/referrals", { method: "POST", body: JSON.stringify({ job_id }) }),
  list:   ()               => req<any[]>("/referrals"),
  stats:  ()               => req<any>("/referrals/stats"),
};

// ── New Types ─────────────────────────────────────────────────────────────────

export interface SalaryInsight {
  job_title:   string;
  location:    string | null;
  min:         number;
  max:         number;
  avg:         number;
  p25:         number;
  p75:         number;
  sample_size: number;
}

// ── HRMS Types ──────────────────────────────────────────────────────────────

export interface HRMSMemberOut {
  id:         string;
  user_id:    string;
  full_name:  string | null;
  email:      string;
  hrms_role:  "recruiter" | "hiring_manager" | "company_admin";
  is_active:  boolean;
  joined_at:  string | null;
  reports_to: string | null;
}

export interface HRMSJobOut {
  job_id:                   string;
  title:                    string;
  status:                   string;
  assigned_recruiter:       string | null;
  assigned_hiring_manager:  string | null;
}

export interface HRMSMetricsOut {
  member_id:              string;
  full_name:              string;
  hrms_role:              string;
  total_assigned_jobs:    number;
  total_applications:     number;
  offers_made:            number;
  selected:               number;
  avg_time_to_hire_days:  number | null;
}

// ── HRMS API ────────────────────────────────────────────────────────────────

export const hrmsApi = {
  me: () =>
    req<HRMSMemberOut>("/hrms/me"),

  members: () =>
    req<HRMSMemberOut[]>("/hrms/members"),

  invite: (email: string, hrms_role: string, reports_to?: string) =>
    req<HRMSMemberOut>("/hrms/members/invite", {
      method: "POST",
      body: JSON.stringify({ email, hrms_role, reports_to }),
    }),

  updateRole: (member_id: string, hrms_role: string) =>
    req<HRMSMemberOut>(`/hrms/members/${member_id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ hrms_role }),
    }),

  deactivate: (member_id: string) =>
    req<null>(`/hrms/members/${member_id}`, { method: "DELETE" }),

  jobs: () =>
    req<HRMSJobOut[]>("/hrms/jobs"),

  assignJob: (job_id: string, recruiter_member_id: string, hiring_manager_member_id?: string) =>
    req<HRMSJobOut>(`/hrms/jobs/${job_id}/assign`, {
      method: "POST",
      body: JSON.stringify({ recruiter_member_id, hiring_manager_member_id }),
    }),

  metrics: () =>
    req<HRMSMetricsOut[]>("/hrms/metrics"),
};