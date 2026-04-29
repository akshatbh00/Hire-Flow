"""
chunker.py — splits resume text into section-aware chunks
Each chunk carries: section label, content, chunk_index
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
            # further split long sections into sub-chunks
            for part in self._split_long(section_text):
                chunks.append(Chunk(
                    section=section_name,
                    content=part.strip(),
                    chunk_index=idx
                ))
                idx += 1
        return chunks

    def _split_sections(self, text: str) -> list[tuple[str, str]]:
        """Split on ## headers inserted by ingestion.py"""
        raw_sections = re.split(r"\n##\s*", text)
        result = []
        for raw in raw_sections:
            if not raw.strip():
                continue
            lines = raw.strip().split("\n", 1)
            header = lines[0].strip().lower()
            body = lines[1].strip() if len(lines) > 1 else ""
            label = self._classify(header)
            result.append((label, body or header))
        return result

    def _classify(self, header: str) -> str:
        for pattern, label in SECTION_PATTERNS:
            if re.search(pattern, header, re.IGNORECASE):
                return label
        return "other"

    def _split_long(self, text: str, max_chars: int = 900) -> list[str]:
        """Split section text into ≤max_chars chunks on sentence/bullet boundaries"""
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