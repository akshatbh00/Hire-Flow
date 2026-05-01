"""
local.py — dev storage backend (saves files to /tmp/hireflow_uploads/)
Mirrors the same interface as s3.py so pipeline.py works identically in both modes.
"""
import shutil
from pathlib import Path
from config import settings

UPLOAD_DIR = Path("tmp/hireflow_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def upload_file(file_key: str, content: bytes) -> str:
    """Save bytes to local disk. Returns the full local path."""
    dest = UPLOAD_DIR / file_key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    return str(dest)


def download_file(file_key: str) -> str:
    """Return the local path to a file. Raises if missing."""
    path = UPLOAD_DIR / file_key
    if not path.exists():
        raise FileNotFoundError(f"File not found locally: {file_key}")
    return str(path)


def delete_file(file_key: str) -> None:
    path = UPLOAD_DIR / file_key
    if path.exists():
        path.unlink()