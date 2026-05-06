"use client";
//frontend/app/(auth)/register/company/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/api";

interface CompanyForm {
  company_name: string;
  industry: string;
  employee_count: string;
  gst_number: string;
  phone: string;
  website: string;
  description: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  admin_confirm_password: string;
  city: string;
  state: string;
  country: string;
  address: string;
}

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education",
  "Manufacturing", "Retail & E-commerce", "Consulting", "Media & Entertainment",
  "Real Estate", "Logistics & Supply Chain", "Telecom", "Other",
];

const EMPLOYEE_RANGES = [
  "1–10", "11–50", "51–200", "201–500", "501–1000", "1001–5000", "5000+",
];

const STEPS = [
  { number: 1, label: "Organization" },
  { number: 2, label: "Admin Account" },
  { number: 3, label: "Location" },
];

function InputField({ label, value, onChange, type = "text", placeholder, required = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ width: "100%", padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
        onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
      />
      {hint && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)} required={required}
        style={{ width: "100%", padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: value ? "#0f172a" : "#94a3b8", outline: "none", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", cursor: "pointer" }}
        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
        onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: "100%", padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", resize: "none" }}
        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
        onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
      />
    </div>
  );
}

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CompanyForm>({
    company_name: "", industry: "", employee_count: "",
    gst_number: "", phone: "", website: "", description: "",
    admin_name: "", admin_email: "", admin_password: "", admin_confirm_password: "",
    city: "", state: "", country: "India", address: "",
  });

  function set(field: keyof CompanyForm, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function validateStep1() {
    if (!form.company_name.trim()) return "Company name is required";
    if (!form.industry) return "Please select an industry";
    if (!form.employee_count) return "Please select employee count";
    if (!form.phone.trim()) return "Phone number is required";
    return null;
  }

  function validateStep2() {
    if (!form.admin_name.trim()) return "Admin name is required";
    if (!form.admin_email.trim()) return "Admin email is required";
    if (!form.admin_email.includes("@")) return "Enter a valid email";
    if (form.admin_password.length < 8) return "Password must be at least 8 characters";
    if (form.admin_password !== form.admin_confirm_password) return "Passwords do not match";
    return null;
  }

  function validateStep3() {
    if (!form.city.trim()) return "City is required";
    if (!form.state.trim()) return "State is required";
    return null;
  }

  function handleNext() {
    setError("");
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : validateStep3();
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError("");
    const err = validateStep3();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      let token = "";
      let userRole = "company_admin";

      try {
        const authRes = await api.post("/auth/register", {
          full_name: form.admin_name,
          email: form.admin_email,
          password: form.admin_password,
          role: "company_admin",
        });
        token = authRes.data.access_token;
        userRole = authRes.data.role ?? "company_admin";
      } catch (e: any) {
        if (e.response?.data?.detail?.toLowerCase().includes("already")) {
          const loginRes = await api.post("/auth/login",
            new URLSearchParams({ username: form.admin_email, password: form.admin_password }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );
          token = loginRes.data.access_token;
          userRole = loginRes.data.role ?? "company_admin";
        } else {
          throw e;
        }
      }

      if (token) {
        localStorage.setItem("hf_token", token);
        document.cookie = `hf_token=${token};path=/;max-age=${30 * 86400};SameSite=Lax`;
        document.cookie = `hf_role=${userRole};path=/;max-age=${30 * 86400};SameSite=Lax`;
      }

      await api.post("/companies/setup", {
        name: form.company_name,
        industry: form.industry,
        employee_count: form.employee_count,
        gst_number: form.gst_number || undefined,
        phone: form.phone,
        website: form.website || undefined,
        description: form.description || undefined,
        city: form.city,
        state: form.state,
        country: form.country,
        address: form.address || undefined,
      });

      router.push("/company/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stepContent = {
    1: (
      <>
        <InputField label="Company Name" value={form.company_name} onChange={(v) => set("company_name", v)} placeholder="e.g. TechCorp India Pvt. Ltd." required />
        <SelectField label="Industry" value={form.industry} onChange={(v) => set("industry", v)} options={INDUSTRIES} required />
        <SelectField label="Current Number of Employees" value={form.employee_count} onChange={(v) => set("employee_count", v)} options={EMPLOYEE_RANGES} required />
        <InputField label="Phone Number" value={form.phone} onChange={(v) => set("phone", v)} type="tel" placeholder="+91 98765 43210" required />
        <InputField label="GST Number" value={form.gst_number} onChange={(v) => set("gst_number", v)} placeholder="22AAAAA0000A1Z5" hint="Optional but recommended for verification" />
        <InputField label="Website" value={form.website} onChange={(v) => set("website", v)} type="url" placeholder="https://yourcompany.com" />
        <TextareaField label="Company Description" value={form.description} onChange={(v) => set("description", v)} placeholder="Tell candidates what your company does…" />
      </>
    ),
    2: (
      <>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#1d4ed8" }}>
          This will be the <strong>Company Admin</strong> account — the main account with full access to HRMS, billing, and settings.
        </div>
        <InputField label="Full Name" value={form.admin_name} onChange={(v) => set("admin_name", v)} placeholder="e.g. Priya Sharma" required />
        <InputField label="Work Email" value={form.admin_email} onChange={(v) => set("admin_email", v)} type="email" placeholder="admin@yourcompany.com" required />
        <InputField label="Password" value={form.admin_password} onChange={(v) => set("admin_password", v)} type="password" placeholder="Min 8 characters" required />
        <InputField label="Confirm Password" value={form.admin_confirm_password} onChange={(v) => set("admin_confirm_password", v)} type="password" placeholder="Repeat password" required />
      </>
    ),
    3: (
      <>
        <InputField label="City" value={form.city} onChange={(v) => set("city", v)} placeholder="e.g. Bangalore" required />
        <InputField label="State" value={form.state} onChange={(v) => set("state", v)} placeholder="e.g. Karnataka" required />
        <InputField label="Country" value={form.country} onChange={(v) => set("country", v)} placeholder="India" required />
        <TextareaField label="Full Address" value={form.address} onChange={(v) => set("address", v)} placeholder="Street, area, pin code…" />
      </>
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f0fdf4 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "48px 40px", width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.06)", marginTop: 40 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
              Hire<span style={{ color: "#2563eb" }}>Flow</span>
            </span>
          </Link>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>Register your Organization</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.number} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: step > s.number ? "#16a34a" : step === s.number ? "#2563eb" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: step >= s.number ? "#fff" : "#94a3b8", transition: "all 0.2s" }}>
                  {step > s.number ? "✓" : s.number}
                </div>
                <span style={{ fontSize: 11, color: step === s.number ? "#2563eb" : "#94a3b8", fontWeight: step === s.number ? 600 : 400 }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 18, background: step > s.number ? "#16a34a" : "#e2e8f0", transition: "all 0.2s" }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {stepContent[step as 1 | 2 | 3]}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 1 && (
            <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }}
              style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={handleNext}
              style={{ flex: 1, padding: "13px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: "13px", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Registering…" : "Register Organization →"}
            </button>
          )}
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
          By registering you agree to our{" "}
          <a href="#" style={{ color: "#2563eb", textDecoration: "none" }}>Terms</a>
          {" "}and{" "}
          <a href="#" style={{ color: "#2563eb", textDecoration: "none" }}>Privacy Policy</a>
        </p>

      </div>
    </div>
  );
}