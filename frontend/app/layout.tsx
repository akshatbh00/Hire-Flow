// //frontend/app/layout.tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import KarenWidget from "@/components/karen/karen-widget";
import MobileShell from "@/components/mobile/MobileShell";
import "./globals.css";
import ThemeProvider from "@/components/ui/theme-provider";
import KarenClientWrapper from "@/components/karen/KarenClientWrapper";
export const metadata: Metadata = {
  title: "HireFlow — Transparent Hiring for Everyone",
  description: "AI-powered hiring portal. Full pipeline transparency. No black boxes.",
  openGraph: {
    title: "HireFlow",
    description: "Find jobs 4x faster with AI matching and full hiring transparency",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const ua = headersList.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {isMobile ? (
            <MobileShell>{children}</MobileShell>
          ) : (
            children
          )}
        </ThemeProvider>
        {!isMobile && <KarenClientWrapper />}
      </body>
    </html>
  );
}
// import type { Metadata } from "next";
// import KarenWidget from "@/components/karen/karen-widget";
// import "./globals.css";
// import ThemeProvider from "@/components/ui/theme-provider";

// export const metadata: Metadata = {
//   title:       "HireFlow — Transparent Hiring for Everyone",
//   description: "AI-powered hiring portal. Full pipeline transparency. No black boxes.",
//   openGraph: {
//     title:       "HireFlow",
//     description: "Find jobs 4x faster with AI matching and full hiring transparency",
//     type:        "website",
//   },
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <ThemeProvider>
//           {children}
//         </ThemeProvider>
//         <KarenWidget />
//       </body>
//     </html>
//   );
// }
