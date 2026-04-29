"""
ai/ats/scorer.py — ATS scoring orchestrator
Now uses all 4 submodules for modular, accurate scoring.
Replaces the old monolithic scorer.py
"""
import json
from openai import OpenAI
from config import settings
from ai.ats.report_generator import ATSReportGenerator

client    = OpenAI(api_key=settings.OPENAI_API_KEY)
generator = ATSReportGenerator()

CLARITY_PROMPT = """Rate this resume for clarity and keyword density. Return JSON only:
{
  "keyword_density": <int 0-35>,
  "clarity_score":   <int 0-10>,
  "issues":          ["<plain English issue>"]
}
Resume (first 4000 chars):
"""


class ATSScorer:

    def score(
        self,
        raw_text:    str,
        parsed_data: dict,
        jd_text:     str = "",      # optional — if provided, JD-specific keyword match
    ) -> dict:
        """
        Main entry point. Called by pipeline.py after parse step.
        Returns full ATS report dict.
        """
        llm_scores = self._llm_clarity(raw_text)
        report     = generator.generate(
            raw_text=raw_text,
            parsed_data=parsed_data,
            jd_text=jd_text,
            llm_scores=llm_scores,
        )
        return report

    def score_against_jd(
        self,
        raw_text:    str,
        parsed_data: dict,
        jd_text:     str,
    ) -> dict:
        """
        Premium path — score resume specifically against a job description.
        More accurate keyword matching.
        """
        return self.score(raw_text, parsed_data, jd_text=jd_text)

    def _llm_clarity(self, text: str) -> dict:
        try:
            resp = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": CLARITY_PROMPT + text[:4000]}],
                response_format={"type": "json_object"},
                temperature=0,
            )
            return json.loads(resp.choices[0].message.content)
        except Exception:
            return {"keyword_density": 20, "clarity_score": 7, "issues": []}
```

---

**Batch 9 — Retriever Layer + Prompt Loader**
```
backend/ai/
├── retriever/
│   ├── vector_retriever.py     ← new
│   ├── hybrid_retriever.py     ← new
│   └── reranker.py             ← new
├── prompts/
│   └── prompt_loader.py        ← new
└── matching/
    └── job_matcher.py          ← update (wire retriever in)