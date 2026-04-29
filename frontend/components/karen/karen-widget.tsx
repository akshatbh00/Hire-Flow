"use client";

import { useState, useRef, useEffect } from "react";
import { karenApi } from "@/lib/api";

interface Message {
  role: "user" | "karen";
  text: string;
  ts: Date;
}

const SUGGESTIONS = [
  "How strong is my resume?",
  "Which jobs should I apply to?",
  "Tips to improve my ATS score",
  "What stage am I at with Stripe?",
];

export default function KarenWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "karen",
      text: "Hey! I'm KAREN — your AI job search co-pilot 👋 Ask me anything about your applications, resume, or job matches.",
      ts: new Date(),
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg, ts: new Date() }]);
    setLoading(true);

    try {
      const res = await karenApi.chat(msg);
      setMessages((prev) => [
        ...prev,
        { role: "karen", text: res.reply ?? res.message ?? "Sorry, I didn't get that.", ts: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "karen", text: "Something went wrong. Please try again.", ts: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position:     "fixed",
          bottom:       28,
          right:        28,
          width:        52,
          height:       52,
          borderRadius: "50%",
          background:   open ? "#111" : "#2563eb",
          border:       open ? "1px solid #333" : "none",
          color:        "#fff",
          fontSize:     22,
          cursor:       "pointer",
          zIndex:       9999,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          boxShadow:    open ? "none" : "0 4px 24px rgba(37,99,235,0.4)",
          transition:   "all 0.2s",
          fontFamily:   "'DM Sans', sans-serif",
        }}
        title="Chat with KAREN"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position:     "fixed",
            bottom:       92,
            right:        28,
            width:        360,
            height:       480,
            background:   "#0a0a0a",
            border:       "1px solid #1e1e1e",
            borderRadius: 16,
            zIndex:       9998,
            display:      "flex",
            flexDirection:"column",
            overflow:     "hidden",
            boxShadow:    "0 24px 60px rgba(0,0,0,0.6)",
            fontFamily:   "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding:      "14px 16px",
              borderBottom: "1px solid #141414",
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              flexShrink:   0,
            }}
          >
            <div
              style={{
                width:        34,
                height:       34,
                borderRadius: "50%",
                background:   "#2563eb",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontSize:     14,
                fontWeight:   700,
                color:        "#fff",
                flexShrink:   0,
              }}
            >
              K
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                KAREN
              </p>
              <p style={{ fontSize: 11, color: "#2563eb" }}>
                AI job search assistant
              </p>
            </div>
            <div
              style={{
                marginLeft:   "auto",
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   "#00ff87",
              }}
            />
          </div>

          {/* Messages */}
          <div
            style={{
              flex:       1,
              overflowY:  "auto",
              padding:    "14px 14px 8px",
              display:    "flex",
              flexDirection: "column",
              gap:        10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display:       "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth:     "82%",
                    padding:      "9px 13px",
                    borderRadius: m.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background:   m.role === "user" ? "#2563eb" : "#141414",
                    border:       m.role === "user" ? "none" : "1px solid #1e1e1e",
                    fontSize:     13,
                    color:        m.role === "user" ? "#fff" : "#ccc",
                    lineHeight:   1.55,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding:      "10px 14px",
                    background:   "#141414",
                    border:       "1px solid #1e1e1e",
                    borderRadius: "14px 14px 14px 4px",
                    display:      "flex",
                    gap:          5,
                    alignItems:   "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width:            6,
                        height:           6,
                        borderRadius:     "50%",
                        background:       "#2563eb",
                        animation:        "bounce 1s infinite",
                        animationDelay:   `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only show when no user messages yet */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div
              style={{
                padding:    "0 14px 10px",
                display:    "flex",
                flexWrap:   "wrap",
                gap:        6,
                flexShrink: 0,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontSize:     11.5,
                    padding:      "5px 11px",
                    borderRadius: 20,
                    border:       "1px solid #1e1e1e",
                    background:   "#111",
                    color:        "#888",
                    cursor:       "pointer",
                    fontFamily:   "inherit",
                    transition:   "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2563eb";
                    (e.currentTarget as HTMLElement).style.color = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e";
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding:      "10px 12px",
              borderTop:    "1px solid #141414",
              display:      "flex",
              gap:          8,
              flexShrink:   0,
              background:   "#0a0a0a",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask KAREN anything..."
              style={{
                flex:        1,
                background:  "#111",
                border:      "1px solid #1e1e1e",
                borderRadius: 10,
                padding:     "9px 13px",
                fontSize:    13,
                color:       "#fff",
                fontFamily:  "inherit",
                outline:     "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width:        38,
                height:       38,
                borderRadius: 10,
                background:   input.trim() && !loading ? "#2563eb" : "#111",
                border:       "1px solid #1e1e1e",
                color:        input.trim() && !loading ? "#fff" : "#333",
                cursor:       input.trim() && !loading ? "pointer" : "not-allowed",
                fontSize:     16,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                transition:   "all 0.15s",
                flexShrink:   0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}