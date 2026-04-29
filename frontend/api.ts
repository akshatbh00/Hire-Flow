import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hf_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("hf_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: object)  => api.post("/auth/register", data),
  login: (email: string, password: string) =>
    api.post("/auth/login", new URLSearchParams({ username: email, password }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  me:       ()              => api.get("/auth/me"),
  onboard:  (data: object)  => api.post("/auth/onboard", data),
};

// ── Resume ─────────────────────────────────────────────────────────────────
export const resumeApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/resume/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  ats:       (id: string)              => api.get(`/resume/${id}/ats`),
  parsed:    (id: string)              => api.get(`/resume/${id}/parsed`),
  benchmark: (id: string, title: string) => api.get(`/resume/${id}/benchmark?job_title=${title}`),
  matchedJobs: (id: string)            => api.get(`/resume/${id}/jobs`),
};

// ── Jobs ───────────────────────────────────────────────────────────────────
export const jobsApi = {
  list:    (params?: object)          => api.get("/jobs", { params }),
  get:     (id: string)               => api.get(`/jobs/${id}`),
  apply:   (jobId: string, resumeId: string) => api.post(`/jobs/${jobId}/apply?resume_id=${resumeId}`),
  candidates: (jobId: string)         => api.get(`/jobs/${jobId}/candidates`),
  create:  (data: object)             => api.post("/jobs", data),
};

// ── Pipeline ───────────────────────────────────────────────────────────────
export const pipelineApi = {
  kanban:     (jobId: string)         => api.get(`/pipeline/job/${jobId}/kanban`),
  moveStage:  (data: object)          => api.post("/pipeline/move", data),
  history:    (appId: string)         => api.get(`/pipeline/application/${appId}/history`),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  get:           ()                   => api.get("/users/dashboard"),
  notifications: ()                   => api.get("/users/notifications"),
};

// ── Optimizer (premium) ────────────────────────────────────────────────────
export const optimizerApi = {
  rewriteSection: (data: object)      => api.post("/optimizer/rewrite-section", data),
  tailor:         (data: object)      => api.post("/optimizer/tailor", data),
};

export default api;