import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  | "universal"
  | "engineer"
  | "recruiter"
  | "civil"
  | "mechanical"
  | "finance"
  | "electrical";

export const THEME_MAP: Record<string, ThemeId> = {
  jobseeker:    "universal",
  recruiter:    "recruiter",
  admin:        "recruiter",
  "software engineer":    "engineer",
  "frontend developer":   "engineer",
  "backend developer":    "engineer",
  "fullstack developer":  "engineer",
  "devops engineer":      "engineer",
  "data scientist":       "engineer",
  "ml engineer":          "engineer",
  "civil engineer":       "civil",
  "structural engineer":  "civil",
  "site engineer":        "civil",
  "mechanical engineer":  "mechanical",
  "automobile engineer":  "mechanical",
  "production engineer":  "mechanical",
  "finance analyst":      "finance",
  "investment analyst":   "finance",
  "credit analyst":       "finance",
  "electrical engineer":  "electrical",
  "embedded engineer":    "electrical",
  "vlsi engineer":        "electrical",
};

interface ThemeState {
  theme:    ThemeId;
  setTheme: (t: ThemeId) => void;
  autoDetect: (jobTitle: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "universal",
      setTheme: (theme) => set({ theme }),
      autoDetect: (jobTitle) => {
        const lower = jobTitle.toLowerCase();
        for (const [key, val] of Object.entries(THEME_MAP)) {
          if (lower.includes(key)) {
            set({ theme: val });
            return;
          }
        }
        set({ theme: "universal" });
      },
    }),
    { name: "hireflow-theme" }
  )
);