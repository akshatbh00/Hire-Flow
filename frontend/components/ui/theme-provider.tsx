"use client";

import { useEffect } from "react";
import { useThemeStore, ThemeId } from "@/store/theme.store";

const THEME_VARS: Record<ThemeId, Record<string, string>> = {
  universal: {
    "--bg":       "#ffffff",
    "--bg2":      "#f8fafc",
    "--surface":  "#ffffff",
    "--border":   "#e2e8f0",
    "--text":     "#0f172a",
    "--text2":    "#64748b",
    "--accent":   "#2563eb",
    "--accent2":  "#1d4ed8",
    "--success":  "#10b981",
    "--font":     "'DM Sans', sans-serif",
    "--radius":   "12px",
  },
  engineer: {
    "--bg":       "#0a0a0a",
    "--bg2":      "#0f0f0f",
    "--surface":  "#0f0f0f",
    "--border":   "#1e1e1e",
    "--text":     "#ffffff",
    "--text2":    "#555555",
    "--accent":   "#00ff87",
    "--accent2":  "#00e87a",
    "--success":  "#00ff87",
    "--font":     "'DM Mono', monospace",
    "--radius":   "2px",
  },
  recruiter: {
    "--bg":       "#f8f9fa",
    "--bg2":      "#ffffff",
    "--surface":  "#ffffff",
    "--border":   "#dee2e6",
    "--text":     "#212529",
    "--text2":    "#6c757d",
    "--accent":   "#6c5ce7",
    "--accent2":  "#5a4fcf",
    "--success":  "#28a745",
    "--font":     "'DM Sans', sans-serif",
    "--radius":   "8px",
  },
  civil: {
    "--bg":       "#f5f0e8",
    "--bg2":      "#ede8dc",
    "--surface":  "#ffffff",
    "--border":   "#d4c4a0",
    "--text":     "#2c3e2d",
    "--text2":    "#8b7355",
    "--accent":   "#8b6914",
    "--accent2":  "#2c3e2d",
    "--success":  "#2c3e2d",
    "--font":     "'Georgia', serif",
    "--radius":   "4px",
  },
  mechanical: {
    "--bg":       "#1a1a1a",
    "--bg2":      "#222222",
    "--surface":  "#222222",
    "--border":   "#333333",
    "--text":     "#ffffff",
    "--text2":    "#666666",
    "--accent":   "#ff6b1a",
    "--accent2":  "#e55a0a",
    "--success":  "#ff6b1a",
    "--font":     "'Arial Narrow', sans-serif",
    "--radius":   "2px",
  },
  finance: {
    "--bg":       "#0a0f1e",
    "--bg2":      "#0e1628",
    "--surface":  "#0e1628",
    "--border":   "#1e2d4a",
    "--text":     "#e8d5a3",
    "--text2":    "#4a6080",
    "--accent":   "#c9a84c",
    "--accent2":  "#b8963e",
    "--success":  "#c9a84c",
    "--font":     "'Georgia', serif",
    "--radius":   "4px",
  },
  electrical: {
    "--bg":       "#0d0d12",
    "--bg2":      "#111118",
    "--surface":  "#111118",
    "--border":   "#1a1a2e",
    "--text":     "#e0e0ff",
    "--text2":    "#4a4a6a",
    "--accent":   "#7b68ee",
    "--accent2":  "#6a57dd",
    "--success":  "#7b68ee",
    "--font":     "'Courier New', monospace",
    "--radius":   "4px",
  },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const vars = THEME_VARS[theme];
    const root  = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [theme]);

  return <>{children}</>;
}