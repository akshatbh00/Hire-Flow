"""
format_checker.py — detects ATS-breaking formatting issues
Checks: tables, columns, special chars, fonts, headers, file encoding
"""
import re
from dataclasses import dataclass, field


# Patterns that confuse ATS parsers
TABLE_PATTERN       = re.compile(r"\|.{2,}\|")
MULTI_COL_PATTERN   = re.compile(r"(.{1,60})\s{5,}(.{1,60})")
HEADER_FOOTER_HINTS = re.compile(r"page \d+|confidential|curriculum vitae", re.IGNORECASE)
URL_HEAVY           = re.compile(r"https?://\S+")
SPECIAL_BULLETS     = ["•", "●", "◆", "★", "→", "►", "▶", "✓", "✗", "✦"]
FANCY_QUOTES        = ["\u201c", "\u201d", "\u2018", "\u2019"]  # curly quotes
NON_ASCII_THRESHOLD = 0.03   # >3% non-ASCII chars = likely encoding issue


@dataclass
class FormatIssue:
    severity: str    # "high" | "medium" | "low"
    message:  str
    penalty:  int    # points deducted from format score


class FormatChecker:

    def check(self, raw_text: str) -> dict:
        """
        Returns format score (0–20) + list of issues found.
        """
        score  = 20
        issues: list[FormatIssue] = []

        # 1. Tables
        if TABLE_PATTERN.search(raw_text):
            issues.append(FormatIssue(
                "high",
                "Tables detected — ATS systems cannot parse table content reliably",
                8,
            ))

        # 2. Multi-column layout
        col_matches = MULTI_COL_PATTERN.findall(raw_text)
        if len(col_matches) > 4:
            issues.append(FormatIssue(
                "high",
                "Multi-column layout detected — ATS reads left-to-right, content may be scrambled",
                6,
            ))

        # 3. Excessive special bullet characters
        special_count = sum(raw_text.count(b) for b in SPECIAL_BULLETS)
        if special_count > 8:
            issues.append(FormatIssue(
                "medium",
                f"Special bullet characters ({special_count} found) — use plain hyphens instead",
                3,
            ))

        # 4. Fancy quotes
        fancy_count = sum(raw_text.count(q) for q in FANCY_QUOTES)
        if fancy_count > 5:
            issues.append(FormatIssue(
                "low",
                "Curly/smart quotes detected — may cause encoding issues in some ATS",
                1,
            ))

        # 5. Non-ASCII encoding issues
        non_ascii = sum(1 for c in raw_text if ord(c) > 127)
        ratio     = non_ascii / max(len(raw_text), 1)
        if ratio > NON_ASCII_THRESHOLD:
            issues.append(FormatIssue(
                "medium",
                f"High non-ASCII character ratio ({ratio:.1%}) — possible encoding or symbol issues",
                3,
            ))

        # 6. Header/footer text leaked into body
        if HEADER_FOOTER_HINTS.search(raw_text):
            issues.append(FormatIssue(
                "low",
                "Page numbers or header/footer text detected in resume body",
                1,
            ))

        # 7. Too many URLs (looks spammy to ATS)
        url_count = len(URL_HEAVY.findall(raw_text))
        if url_count > 4:
            issues.append(FormatIssue(
                "low",
                f"{url_count} URLs found — keep links minimal, ATS may truncate them",
                1,
            ))

        # calculate final score
        total_penalty = sum(i.penalty for i in issues)
        final_score   = max(0, score - total_penalty)

        return {
            "score":  final_score,
            "issues": [
                {
                    "severity": i.severity,
                    "message":  i.message,
                    "penalty":  i.penalty,
                }
                for i in issues
            ],
        }