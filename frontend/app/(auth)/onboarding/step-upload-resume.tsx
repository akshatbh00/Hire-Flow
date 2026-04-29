"use client";

import { useState, useRef } from "react";
import { resumeApi } from "@/lib/api";

interface Props {
  onDone: () => void;
}

export default function StepUploadResume({ onDone }: Props) {
  const [file,     setFile]     = useState<File | null>(null);
  const [status,   setStatus]   = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [errorMsg, setError]    = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setError("Only PDF or DOCX files are supported");
      return;
    }
    setFile(f);
    setError("");
  }

  async function upload() {
    if (!file) return;
    setStatus("uploading");
    try {
      await resumeApi.upload(file);
      setStatus("done");
      setTimeout(onDone, 1200);
    } catch (e: any) {
      // If AI analysis fails, show warning but still proceed
      if (e.message?.includes("analyse") || e.message?.includes("process") || e.message?.includes("500")) {
        setStatus("done");
        setError("Resume uploaded — AI analysis will run when available.");
        setTimeout(onDone, 2000);
      } else {
        setStatus("error");
        setError(e.message ?? "Upload failed. Please try again.");
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Upload your resume
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          PDF or DOCX · Max 5MB · We'll analyse it instantly
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
        onDragLeave={()  => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border:        `2px dashed ${dragging ? "#2563eb" : file ? "#93c5fd" : "#e2e8f0"}`,
          borderRadius:  14,
          padding:       "48px 24px",
          textAlign:     "center",
          cursor:        "pointer",
          background:    dragging ? "#eff6ff" : file ? "#f8fbff" : "#fafafa",
          transition:    "all 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 28, color: "#2563eb" }}>✓</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{file.name}</p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>{(file.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
              style={{
                background: "none", border: "none",
                fontSize: 12, color: "#94a3b8",
                cursor: "pointer", textDecoration: "underline",
                fontFamily: "inherit", marginTop: 4,
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 32, color: "#cbd5e1" }}>↑</div>
            <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
              Drop your resume here or click to browse
            </p>
            <p style={{ fontSize: 12, color: "#cbd5e1" }}>PDF · DOCX</p>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
          fontSize: 13, color: "#dc2626",
        }}>
          {errorMsg}
        </div>
      )}

      {/* Success */}
      {status === "done" && (
        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          fontSize: 13, color: "#16a34a", fontWeight: 500,
        }}>
          ✓ Resume uploaded — running AI analysis...
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={upload}
          disabled={!file || status === "uploading" || status === "done"}
          style={{
            flex:         1,
            padding:      "13px",
            background:   !file || status === "uploading" || status === "done" ? "#e2e8f0" : "#2563eb",
            color:        !file || status === "uploading" || status === "done" ? "#94a3b8" : "#fff",
            border:       "none",
            borderRadius: 12,
            fontSize:     14,
            fontWeight:   700,
            cursor:       !file || status === "uploading" || status === "done" ? "not-allowed" : "pointer",
            fontFamily:   "inherit",
            transition:   "all 0.15s",
          }}
        >
          {status === "uploading" ? "Uploading..." : status === "done" ? "Done ✓" : "Upload Resume →"}
        </button>
        <button
          onClick={onDone}
          style={{
            padding:      "13px 22px",
            border:       "1px solid #e2e8f0",
            borderRadius: 12,
            fontSize:     14,
            fontWeight:   500,
            color:        "#64748b",
            background:   "#fff",
            cursor:       "pointer",
            fontFamily:   "inherit",
            transition:   "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}