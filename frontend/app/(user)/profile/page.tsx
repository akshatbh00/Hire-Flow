"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8);

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <h2 className="text-base font-semibold text-gray-800 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none ${props.className ?? ""}`}
    />
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </button>
  );
}

// ─── Personal Info Section ────────────────────────────────────────────────────

function PersonalInfo() {
  const [name, setName] = useState("Akshat Bhardwaj");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold select-none">
          A
        </div>
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">akshatinmyspace1@gmail.com</div>
          <span className="inline-block mt-1 text-xs border border-gray-300 rounded-full px-2 py-0.5 text-gray-500">
            Free Plan
          </span>
        </div>
      </div>

      <Field label="Full Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Email">
        <Input value="akshatinmyspace1@gmail.com" disabled className="bg-gray-50 text-gray-400 cursor-not-allowed" />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
      </Field>

      <Button onClick={handleSave}>{saved ? "✓ Saved!" : "Save Changes"}</Button>
    </SectionCard>
  );
}

// ─── Skills Section ───────────────────────────────────────────────────────────

function SkillsSection() {
  const [currentTitle, setCurrentTitle] = useState("");
  const [years, setYears] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saved, setSaved] = useState(false);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    // Allow comma-separated
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills((prev) => [...prev, ...parts.map((name) => ({ id: uid(), name }))]);
    setSkillInput("");
  };

  const removeSkill = (id: string) => setSkills((prev) => prev.filter((s) => s.id !== id));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Skills & Experience">
      <Field label="Current Title">
        <Input
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          placeholder="e.g. Software Engineer"
        />
      </Field>

      <Field label="Years of Experience">
        <Input
          value={years}
          onChange={(e) => setYears(e.target.value)}
          placeholder="e.g. 3"
          type="number"
          min="0"
        />
      </Field>

      <Field label="Skills">
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="e.g. Python, React..."
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition"
          >
            Add
          </button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSkill(s.id)}
                  className="ml-1 text-blue-400 hover:text-blue-700 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <Button onClick={handleSave}>{saved ? "✓ Saved!" : "Save Skills"}</Button>
    </SectionCard>
  );
}

// ─── Experience Section ───────────────────────────────────────────────────────

function ExperienceSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const blankExp = (): Experience => ({
    id: uid(),
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const [draft, setDraft] = useState<Experience>(blankExp());

  const handleEdit = (exp: Experience) => {
    setDraft({ ...exp });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleRemove = (id: string) => setExperiences((prev) => prev.filter((e) => e.id !== id));

  const handleFormSave = () => {
    if (!draft.title || !draft.company) return;
    if (editingId) {
      setExperiences((prev) => prev.map((e) => (e.id === editingId ? draft : e)));
    } else {
      setExperiences((prev) => [...prev, { ...draft, id: uid() }]);
    }
    setDraft(blankExp());
    setEditingId(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    setDraft(blankExp());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Work Experience">
      {/* Existing experiences */}
      {experiences.length > 0 && (
        <div className="space-y-4 mb-5">
          {experiences.map((exp) => (
            <div key={exp.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm">{exp.title}</div>
                  <div className="text-sm text-gray-500">
                    {exp.company}
                    {exp.location ? ` · ${exp.location}` : ""}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {exp.startDate}
                    {exp.startDate && " – "}
                    {exp.current ? "Present" : exp.endDate}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{exp.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(exp)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleRemove(exp.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            {editingId ? "Edit Experience" : "Add Experience"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Job Title *">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </Field>
            <Field label="Company *">
              <Input
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                placeholder="e.g. Google"
              />
            </Field>
            <Field label="Location">
              <Input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="e.g. Bangalore, IN"
              />
            </Field>
            <div />
            <Field label="Start Date">
              <Input
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                placeholder="e.g. Jan 2022"
              />
            </Field>
            <Field label="End Date">
              <Input
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                placeholder="e.g. Dec 2023"
                disabled={draft.current}
                className={draft.current ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.current}
              onChange={(e) => setDraft({ ...draft, current: e.target.checked, endDate: "" })}
              className="rounded"
            />
            I currently work here
          </label>

          <Field label="Description">
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Briefly describe your role and key achievements…"
              rows={3}
            />
          </Field>

          <div className="flex gap-2 mt-2">
            <Button onClick={handleFormSave}>
              {editingId ? "Update" : "Add"}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center gap-3">
        {!showForm && (
          <Button variant="secondary" onClick={() => { setDraft(blankExp()); setEditingId(null); setShowForm(true); }}>
            + Add Experience
          </Button>
        )}
        {experiences.length > 0 && (
          <Button onClick={handleSaveAll}>{saved ? "✓ Saved!" : "Save Experience"}</Button>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Account Details Section ──────────────────────────────────────────────────

function AccountDetails() {
  return (
    <SectionCard title="Account Details">
      {[
        { label: "Role", value: "Job Seeker" },
        { label: "Plan", value: "Free" },
        { label: "Status", value: "Active" },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-sm font-semibold text-gray-800">{value}</span>
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Quick Links Section ──────────────────────────────────────────────────────

function QuickLinks() {
  const links = [
    { label: "Upload / Update Resume", href: "/resume" },
    { label: "View My Applications", href: "/applications" },
    { label: "Browse Jobs", href: "/jobs" },
    { label: "Account Settings", href: "/settings" },
  ];
  return (
    <SectionCard title="Quick Links">
      {links.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 text-sm text-gray-700 hover:text-blue-600 transition group"
        >
          {label}
          <span className="text-gray-300 group-hover:text-blue-400 transition">→</span>
        </a>
      ))}
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar — matches existing HireFlow style */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">
          <span className="text-gray-900">Hire</span>
          <span className="text-blue-600">Flow</span>
        </span>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          {["Dashboard", "Jobs", "Applications", "Resume"].map((item) => (
            <a key={item} href={`/${item.toLowerCase()}`} className="hover:text-gray-900 transition">
              {item}
            </a>
          ))}
          <a href="/profile" className="text-blue-600 font-semibold">
            Profile
          </a>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details</p>
        </div>

        <PersonalInfo />
        <SkillsSection />
        <ExperienceSection />
        <AccountDetails />
        <QuickLinks />
      </main>
    </div>
  );
}