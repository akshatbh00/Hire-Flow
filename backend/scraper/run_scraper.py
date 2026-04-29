"""
backend/scraper/run_scraper.py
Run: ../venv313/Scripts/python.exe scraper/run_scraper.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from api.scraper.adzuna_scraper import seed_jobs

if __name__ == "__main__":
    db = SessionLocal()
    try:
        total = seed_jobs(db)
        print(f"Done. {total} jobs seeded.")
    finally:
        db.close()