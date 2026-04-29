"""
ingestion.py — converts uploaded resume file → clean raw text
Supports: PDF (PyMuPDF), DOCX (python-docx), TXT
"""
import fitz  # PyMuPDF
import docx
import re
from pathlib import Path
from loguru import logger


class ResumeIngester:

    def ingest(self, file_path: str) -> str:
        path = Path(file_path)
        suffix = path.suffix.lower()

        if suffix == ".pdf":
            text = self._from_pdf(file_path)
        elif suffix in (".docx", ".doc"):
            text = self._from_docx(file_path)
        elif suffix == ".txt":
            text = path.read_text(encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        return self._clean(text)

    # ── PDF ────────────────────────────────────────────────────────────────

    def _from_pdf(self, path: str) -> str:
        doc = fitz.open(path)
        pages = []
        for page in doc:
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if b["type"] == 0:  # text block
                    for line in b["lines"]:
                        line_text = " ".join(s["text"] for s in line["spans"])
                        # detect section headers by font size / boldness
                        is_bold = any(s["flags"] & 16 for s in line["spans"])
                        if is_bold and len(line_text.strip()) < 60:
                            pages.append(f"\n## {line_text.strip()}")
                        else:
                            pages.append(line_text)
        doc.close()
        return "\n".join(pages)

    # ── DOCX ───────────────────────────────────────────────────────────────

    def _from_docx(self, path: str) -> str:
        doc = docx.Document(path)
        lines = []
        for para in doc.paragraphs:
            if not para.text.strip():
                continue
            is_bold = any(run.bold for run in para.runs if run.text.strip())
            is_heading = para.style.name.startswith("Heading")
            if is_bold or is_heading:
                lines.append(f"\n## {para.text.strip()}")
            else:
                lines.append(para.text.strip())
        return "\n".join(lines)

    # ── Clean ──────────────────────────────────────────────────────────────

    def _clean(self, text: str) -> str:
        # collapse multiple spaces / weird unicode
        text = re.sub(r"[^\S\n]+", " ", text)
        # collapse 3+ newlines to 2
        text = re.sub(r"\n{3,}", "\n\n", text)
        # remove form feeds, null bytes
        text = re.sub(r"[\x0c\x00]", "", text)
        return text.strip()