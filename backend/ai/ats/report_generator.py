"""
report_generator.py — assembles the final ATS report JSON
from all module outputs. Single source of truth for ATS report shape.

No API calls in this file — Groq is handled inside keyword_extractor.py
"""
from dataclasses import dataclass
from ai.ats.keyword_extractor import KeywordExtractor   # already converted to Groq
from ai.ats.format_checker    import FormatChecker      # no API, unchanged
from ai.ats.section_validator import SectionValidator   # no API, unchanged


@dataclass
class ATSReport:
    score:            float
    grade:            str        # A / B / C / D / F
    breakdown:        dict
    issues:           list[str]
    warnings:         list[str]
    missing_sections: list[str]
    keyword_match:    dict
    format_issues:    list[dict]
    section_results:  dict
    improvement_tips: list[str]


GRADE_THRESHOLDS = [
    (90, "A"), (75, "B"), (60, "C"), (45, "D"), (0, "F")
]


class ATSReportGenerator:

    def __init__(self):
        self.keyword_extractor = KeywordExtractor()
        self.format_checker    = FormatChecker()
        self.section_validator = SectionValidator()

    def generate(
        self,
        raw_text:    str,
        parsed_data: dict,
        jd_text:     str = "",
        llm_scores:  dict = None,   # from scorer.py LLM call
    ) -> dict:
        # 1. Section validation
        section_result = self.section_validator.validate(raw_text, parsed_data)

        # 2. Format check
        format_result  = self.format_checker.check(raw_text)

        # 3. Keyword extraction + comparison
        resume_kw = self.keyword_extractor.extract_from_resume(raw_text, parsed_data)
        if jd_text:
            jd_kw          = self.keyword_extractor.extract_from_jd(jd_text)
            keyword_result = self.keyword_extractor.compare(jd_kw, resume_kw)
        else:
            keyword_result = {
                "matched":  [],
                "missing":  [],
                "score":    llm_scores.get("keyword_density", 20) if llm_scores else 20,
                "coverage": 0.0,
            }

        # 4. Length score
        length_score = self._length_score(raw_text)

        # 5. Clarity score from LLM
        clarity_score = (llm_scores or {}).get("clarity_score", 7)

        # 6. Assemble total
        breakdown = {
            "sections": section_result["score"],    # 0–25
            "keywords": keyword_result["score"],    # 0–35
            "format":   format_result["score"],     # 0–20
            "length":   length_score,               # 0–10
            "clarity":  clarity_score,              # 0–10
        }
        total = min(sum(breakdown.values()), 100)

        # 7. Grade
        grade = next(g for threshold, g in GRADE_THRESHOLDS if total >= threshold)

        # 8. Collect all issues + tips
        all_issues = (
            [i["message"] for i in format_result["issues"] if i["severity"] == "high"]
            + (llm_scores or {}).get("issues", [])
        )
        warnings = (
            section_result["warnings"]
            + [i["message"] for i in format_result["issues"] if i["severity"] in ("medium", "low")]
        )

        improvement_tips = self._build_tips(
            breakdown, section_result, keyword_result
        )

        return ATSReport(
            score=round(total, 1),
            grade=grade,
            breakdown=breakdown,
            issues=all_issues,
            warnings=warnings,
            missing_sections=section_result["missing"],
            keyword_match=keyword_result,
            format_issues=format_result["issues"],
            section_results=section_result["sections"],
            improvement_tips=improvement_tips,
        ).__dict__

    # ── Helpers ────────────────────────────────────────────────────────────

    def _length_score(self, text: str) -> float:
        words = len(text.split())
        if   400 <= words <= 900:  return 10
        elif 300 <= words <  400:  return 7
        elif 900 <  words <= 1200: return 7
        elif 200 <= words <  300:  return 4
        else:                      return 2

    def _build_tips(
        self,
        breakdown:      dict,
        section_result: dict,
        keyword_result: dict,
    ) -> list[str]:
        tips = []

        if breakdown["sections"] < 20:
            missing = section_result.get("missing", [])
            if missing:
                tips.append(f"Add missing sections: {', '.join(missing)}")

        if breakdown["keywords"] < 25:
            missing_kw = keyword_result.get("missing", [])[:5]
            if missing_kw:
                tips.append(f"Include these keywords from the JD: {', '.join(missing_kw)}")
            else:
                tips.append("Use more industry-specific keywords throughout your resume")

        if breakdown["format"] < 15:
            tips.append("Remove tables and multi-column layouts — use single-column format")

        if breakdown["length"] < 7:
            tips.append("Aim for 400–900 words — expand experience descriptions with metrics")

        if breakdown["clarity"] < 7:
            tips.append("Use clear, concise sentences with strong action verbs")

        return tips[:5]


# """
# report_generator.py — assembles the final ATS report JSON
# from all module outputs. Single source of truth for ATS report shape.
# """
# from dataclasses import dataclass
# from ai.ats.keyword_extractor import KeywordExtractor
# from ai.ats.format_checker    import FormatChecker
# from ai.ats.section_validator import SectionValidator


# @dataclass
# class ATSReport:
#     score:            float
#     grade:            str        # A / B / C / D / F
#     breakdown:        dict
#     issues:           list[str]
#     warnings:         list[str]
#     missing_sections: list[str]
#     keyword_match:    dict
#     format_issues:    list[dict]
#     section_results:  dict
#     improvement_tips: list[str]


# GRADE_THRESHOLDS = [
#     (90, "A"), (75, "B"), (60, "C"), (45, "D"), (0, "F")
# ]


# class ATSReportGenerator:

#     def __init__(self):
#         self.keyword_extractor = KeywordExtractor()
#         self.format_checker    = FormatChecker()
#         self.section_validator = SectionValidator()

#     def generate(
#         self,
#         raw_text:    str,
#         parsed_data: dict,
#         jd_text:     str = "",
#         llm_scores:  dict = None,   # from scorer.py LLM call
#     ) -> dict:
#         """
#         Full ATS report assembly.
#         jd_text is optional — if provided, keyword matching is JD-specific.
#         """
#         # 1. Section validation
#         section_result = self.section_validator.validate(raw_text, parsed_data)

#         # 2. Format check
#         format_result  = self.format_checker.check(raw_text)

#         # 3. Keyword extraction + comparison
#         resume_kw = self.keyword_extractor.extract_from_resume(raw_text, parsed_data)
#         if jd_text:
#             jd_kw         = self.keyword_extractor.extract_from_jd(jd_text)
#             keyword_result = self.keyword_extractor.compare(jd_kw, resume_kw)
#         else:
#             # no JD — score based on keyword density alone
#             keyword_result = {
#                 "matched":  [],
#                 "missing":  [],
#                 "score":    llm_scores.get("keyword_density", 20) if llm_scores else 20,
#                 "coverage": 0.0,
#             }

#         # 4. Length score
#         length_score = self._length_score(raw_text)

#         # 5. Clarity score from LLM
#         clarity_score = (llm_scores or {}).get("clarity_score", 7)

#         # 6. Assemble total
#         breakdown = {
#             "sections": section_result["score"],    # 0–25
#             "keywords": keyword_result["score"],    # 0–35
#             "format":   format_result["score"],     # 0–20
#             "length":   length_score,               # 0–10
#             "clarity":  clarity_score,              # 0–10
#         }
#         total = min(sum(breakdown.values()), 100)

#         # 7. Grade
#         grade = next(g for threshold, g in GRADE_THRESHOLDS if total >= threshold)

#         # 8. Collect all issues + tips
#         all_issues = (
#             [i["message"] for i in format_result["issues"] if i["severity"] == "high"]
#             + (llm_scores or {}).get("issues", [])
#         )
#         warnings = (
#             section_result["warnings"]
#             + [i["message"] for i in format_result["issues"] if i["severity"] in ("medium","low")]
#         )

#         improvement_tips = self._build_tips(
#             breakdown, section_result, keyword_result
#         )

#         return ATSReport(
#             score=round(total, 1),
#             grade=grade,
#             breakdown=breakdown,
#             issues=all_issues,
#             warnings=warnings,
#             missing_sections=section_result["missing"],
#             keyword_match=keyword_result,
#             format_issues=format_result["issues"],
#             section_results=section_result["sections"],
#             improvement_tips=improvement_tips,
#         ).__dict__

#     # ── Helpers ────────────────────────────────────────────────────────────

#     def _length_score(self, text: str) -> float:
#         words = len(text.split())
#         if   400 <= words <= 900:  return 10
#         elif 300 <= words < 400:   return 7
#         elif 900 < words <= 1200:  return 7
#         elif 200 <= words < 300:   return 4
#         else:                      return 2

#     def _build_tips(
#         self,
#         breakdown:      dict,
#         section_result: dict,
#         keyword_result: dict,
#     ) -> list[str]:
#         tips = []

#         if breakdown["sections"] < 20:
#             missing = section_result.get("missing", [])
#             if missing:
#                 tips.append(f"Add missing sections: {', '.join(missing)}")

#         if breakdown["keywords"] < 25:
#             missing_kw = keyword_result.get("missing", [])[:5]
#             if missing_kw:
#                 tips.append(f"Include these keywords from the JD: {', '.join(missing_kw)}")
#             else:
#                 tips.append("Use more industry-specific keywords throughout your resume")

#         if breakdown["format"] < 15:
#             tips.append("Remove tables and multi-column layouts — use single-column format")

#         if breakdown["length"] < 7:
#             tips.append("Aim for 400–900 words — expand experience descriptions with metrics")

#         if breakdown["clarity"] < 7:
#             tips.append("Use clear, concise sentences with strong action verbs")

#         return tips[:5]   # top 5 tips only