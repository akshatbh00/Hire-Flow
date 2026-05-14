"""
chunker.py — splits resume text into section-aware chunks
Each chunk carries: section label, content, chunk_index

FIXES:
- BUG 1: _split_sections() now falls back to regex-based section detection
         when no ## markers are present (plain TXT resumes, PDFs where
         headers weren't bold). Prevents entire resume collapsing to one
         "other" chunk with no section signal.
- BUG 2: empty body no longer silently stores just the header word as chunk
         content. If body is empty after splitting, the section is skipped
         so we don't pollute the vector index with single-word chunks.
"""
import re
from dataclasses import dataclass

SECTION_PATTERNS = [
    (r"experience|work history|employment", "experience"),
    (r"education|academics|qualification", "education"),
    (r"skills|technical skills|technologies", "skills"),
    (r"projects|personal projects|side projects", "projects"),
    (r"certifications?|courses?|training", "certifications"),
    (r"summary|objective|profile|about", "summary"),
    (r"achievements?|awards?|honors?", "achievements"),
    (r"publications?|research", "research"),
]

# Matches common section headers on their own line (no ## required)
_FALLBACK_SECTION_RE = re.compile(
    r"^[ \t]*("
    r"summary|objective|profile|about(?: me)?|career goal"
    r"|experience|work history|employment|internship"
    r"|education|academics?|qualifications?"
    r"|skills|technical skills|technologies|tech stack|tools"
    r"|projects?|personal projects?|side projects?"
    r"|certifications?|courses?|training"
    r"|achievements?|awards?|honors?"
    r"|publications?|research"
    r"|languages?|interests?|references?"
    r")[ \t]*$",
    re.IGNORECASE | re.MULTILINE,
)


@dataclass
class Chunk:
    section: str
    content: str
    chunk_index: int


class ResumeChunker:
    MAX_CHUNK_TOKENS = 300  # ~300 tokens per chunk

    def chunk(self, raw_text: str) -> list[Chunk]:
        sections = self._split_sections(raw_text)
        chunks = []
        idx = 0
        for section_name, section_text in sections:
            for part in self._split_long(section_text):
                part = part.strip()
                # FIX BUG 2: skip empty or near-empty chunks entirely
                if len(part) < 10:
                    continue
                chunks.append(Chunk(
                    section=section_name,
                    content=part,
                    chunk_index=idx,
                ))
                idx += 1
        return chunks

    def _split_sections(self, text: str) -> list[tuple[str, str]]:
        """
        Split on ## headers (inserted by ingestion.py for PDF/DOCX).
        FIX BUG 1: if no ## markers exist (plain TXT, un-bolded headers),
        fall back to regex detection of common section headings on their
        own line — so we still produce section-labelled chunks rather than
        one giant "other" blob.
        """
        if "\n##" in text:
            return self._split_by_markers(text)
        return self._split_by_regex(text)

    def _split_by_markers(self, text: str) -> list[tuple[str, str]]:
        """Original path: ## markers from ingestion.py."""
        raw_sections = re.split(r"\n##\s*", text)
        result = []
        for raw in raw_sections:
            if not raw.strip():
                continue
            lines = raw.strip().split("\n", 1)
            header = lines[0].strip().lower()
            body = lines[1].strip() if len(lines) > 1 else ""
            # FIX BUG 2: skip sections with no real body content
            if not body:
                continue
            label = self._classify(header)
            result.append((label, body))
        return result

    def _split_by_regex(self, text: str) -> list[tuple[str, str]]:
        """
        FIX BUG 1 fallback: detect section headers by regex when no ##
        markers exist. Splits on lines that look like headers and labels
        each resulting block.
        """
        boundaries = [m.start() for m in _FALLBACK_SECTION_RE.finditer(text)]

        if not boundaries:
            # No recognisable headers at all — return full text as one chunk
            stripped = text.strip()
            if stripped:
                return [("other", stripped)]
            return []

        result = []
        # Text before the first recognised header (contact info, name, etc.)
        preamble = text[: boundaries[0]].strip()
        if preamble:
            result.append(("contact", preamble))

        for i, start in enumerate(boundaries):
            end = boundaries[i + 1] if i + 1 < len(boundaries) else len(text)
            block = text[start:end].strip()
            lines = block.split("\n", 1)
            header = lines[0].strip()
            body = lines[1].strip() if len(lines) > 1 else ""
            # FIX BUG 2: skip if body is empty
            if not body:
                continue
            label = self._classify(header.lower())
            result.append((label, body))

        return result

    def _classify(self, header: str) -> str:
        for pattern, label in SECTION_PATTERNS:
            if re.search(pattern, header, re.IGNORECASE):
                return label
        return "other"

    def _split_long(self, text: str, max_chars: int = 900) -> list[str]:
        """Split section text into ≤max_chars chunks on sentence/bullet boundaries."""
        if len(text) <= max_chars:
            return [text]
        parts, current = [], ""
        for line in text.split("\n"):
            if len(current) + len(line) > max_chars and current:
                parts.append(current)
                current = line
            else:
                current += "\n" + line
        if current.strip():
            parts.append(current)
        return parts