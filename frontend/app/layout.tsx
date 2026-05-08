//frontend/app/layout.tsx
import type { Metadata } from "next";
import KarenWidget from "@/components/karen/karen-widget";
import "./globals.css";
import ThemeProvider from "@/components/ui/theme-provider";

export const metadata: Metadata = {
  title:       "HireFlow — Transparent Hiring for Everyone",
  description: "AI-powered hiring portal. Full pipeline transparency. No black boxes.",
  openGraph: {
    title:       "HireFlow",
    description: "Find jobs 4x faster with AI matching and full hiring transparency",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <KarenWidget />
      </body>
    </html>
  );
}