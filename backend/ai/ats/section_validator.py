"""
section_validator.py — validates presence and quality of resume sections
Each section gets a presence score + quality check.

FIX BUG 2: _extract_section_text() now slices from the section header
until the NEXT section header (not a fixed 800-char window). This stops
the skills quality check from counting commas in experience bullets,
which previously made it almost always return True (never firing warnings).

Also fixed: skills quality check now counts commas OR line breaks
(some resumes list skills one-per-line instead of comma-separated).
"""
import re
from dataclasses import dataclass


SECTION_PATTERNS = {
    "contact": re.compile(
        r"([\w.\-+]+@[\w.\-]+\.\w+)"
        r"|((\+91|0)?[6-9]\d{9})"
        r"|(\+\d{1,3}[\s-]\d{3,})",
        re.IGNORECASE
    ),
    "summary": re.compile(
        r"\b(summary|objective|profile|about me|career goal|professional summary)\b",
        re.IGNORECASE
    ),
    "experience": re.compile(
        r"\b(experience|work history|employment|career|internship|worked at)\b",
        re.IGNORECASE
    ),
    "education": re.compile(
        r"\b(education|academic|qualification|degree|university|college|school|b\.?tech|m\.?tech|bsc|msc|mba)\b",
        re.IGNORECASE
    ),
    "skills": re.compile(
        r"\b(skills|technologies|tech stack|tools|competencies|expertise|proficient)\b",
        re.IGNORECASE
    ),
    "projects": re.compile(
        r"\b(projects|portfolio|personal projects|side projects|open.?source)\b",
        re.IGNORECASE
    ),
}

# Used to find the boundary of any section so we can stop extraction there
_ANY_SECTION_BOUNDARY = re.compile(
    r"\n\s*\b("
    r"summary|objective|profile|about me|career goal|professional summary"
    r"|experience|work history|employment|career|internship"
    r"|education|academic|qualification|degree|university|college|school"
    r"|skills|technologies|tech stack|tools|competencies|expertise|proficient"
    r"|projects|portfolio|certifications|awards|languages|references"
    r")\b",
    re.IGNORECASE
)

# Points per section (total = 25)
SECTION_WEIGHTS = {
    "contact":    6,
    "experience": 7,
    "education":  5,
    "skills":     5,
    "summary":    2,
}

QUALITY_CHECKS = {
    "experience": lambda text: len(re.findall(r"\d+", text)) >= 3,
    # FIX: count commas OR newlines — handles both inline and line-per-skill formats
    "skills":     lambda text: len(re.findall(r",|\n", text)) >= 4,
    "summary":    lambda text: len(text.split()) >= 20,
}


@dataclass
class SectionResult:
    present:      bool
    quality_ok:   bool
    points:       int
    suggestion:   str


class SectionValidator:

    def validate(self, raw_text: str, parsed_data: dict) -> dict:
        results  = {}
        total    = 0
        missing  = []
        warnings = []

        for section, weight in SECTION_WEIGHTS.items():
            pattern = SECTION_PATTERNS.get(section)
            present = bool(pattern and pattern.search(raw_text))

            if not present and parsed_data:
                if section == "contact" and (parsed_data.get("email") or parsed_data.get("phone")):
                    present = True
                elif parsed_data.get(section):
                    present = True

            quality_ok = True
            suggestion = ""
            if present:
                checker = QUALITY_CHECKS.get(section)
                if checker:
                    section_text = self._extract_section_text(raw_text, section)
                    quality_ok   = checker(section_text)
                    if not quality_ok:
                        suggestion = self._quality_suggestion(section)
                        warnings.append(suggestion)
                points = weight
            else:
                points     = 0
                suggestion = f'Add a "{section.title()}" section to improve ATS score'
                missing.append(section.title())

            total += points
            results[section] = SectionResult(
                present=present,
                quality_ok=quality_ok,
                points=points,
                suggestion=suggestion,
            ).__dict__

        return {
            "score":    min(total, 25),
            "sections": results,
            "missing":  missing,
            "warnings": warnings,
        }

    def _extract_section_text(self, text: str, section: str) -> str:
        """
        FIX BUG 2: Extract from the matched section header until the next
        section header — not a fixed 800-char window that bleeds into
        adjacent sections and inflates quality check pass rates.
        """
        pattern = SECTION_PATTERNS.get(section)
        if not pattern:
            return ""

        match = pattern.search(text)
        if not match:
            return ""

        start = match.start()
        # Find where the next section begins after our match
        next_boundary = _ANY_SECTION_BOUNDARY.search(text, match.end() + 1)
        end = next_boundary.start() if next_boundary else min(start + 1500, len(text))

        return text[start:end]

    def _quality_suggestion(self, section: str) -> str:
        suggestions = {
            "experience": "Add numbers and metrics to experience bullets (e.g. 'increased sales by 30%')",
            "skills":     "List at least 6–8 specific skills separated by commas or one per line",
            "summary":    "Expand your summary to at least 3 sentences describing your value proposition",
        }
        return suggestions.get(section, f"Improve the quality of your {section} section")
