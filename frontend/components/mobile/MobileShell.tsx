// frontend/components/mobile/MobileShell.tsx
import MobileNav from "./MobileNav";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0F; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Page content — padded bottom so nav doesn't overlap */}
      <main style={{ paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom Nav always visible */}
      <MobileNav />
    </div>
  );
}