"""
prompt_loader.py — loads prompt templates from /ai/prompts/*.txt
Caches them in memory so we don't hit disk on every request.
Supports variable substitution via {key} placeholders.
"""
from pathlib import Path
from functools import lru_cache

PROMPTS_DIR = Path(__file__).parent   # same folder as prompt .txt files


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    """
    Load a prompt template by filename (without .txt).
    e.g. load_prompt("ats_analysis") reads ats_analysis.txt
    Cached after first read.
    """
    path = PROMPTS_DIR / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def render_prompt(name: str, **kwargs) -> str:
    """
    Load prompt and substitute {key} placeholders.
    e.g. render_prompt("job_match", title="Engineer", skills="Python")
    """
    template = load_prompt(name)
    return template.format(**kwargs)


def list_prompts() -> list[str]:
    """Returns all available prompt names."""
    return [p.stem for p in PROMPTS_DIR.glob("*.txt")]