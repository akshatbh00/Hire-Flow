"""
backend/migrate_hrms.py
Run once: adds hrms_members table + new columns to jobs table.

Usage:
    cd backend
    ..\venv313\Scripts\python.exe migrate_hrms.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "hireflow_dev.db")  # adjust if your DB file has a different name


def run():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── 1. Create hrms_members table ────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS hrms_members (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id),
            company_id  TEXT NOT NULL REFERENCES companies(id),
            hrms_role   TEXT NOT NULL DEFAULT 'recruiter',
            reports_to  TEXT REFERENCES hrms_members(id),
            is_active   INTEGER NOT NULL DEFAULT 1,
            invited_by  TEXT REFERENCES users(id),
            joined_at   DATETIME,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ hrms_members table ready")
    # Add missing columns to existing hrms_members table
    hrms_cols = {row[1] for row in cur.execute("PRAGMA table_info(hrms_members)")}
    for col, defn in [("joined_at", "DATETIME"), ("invited_by", "TEXT"), ("is_active", "INTEGER NOT NULL DEFAULT 1")]:
        if col not in hrms_cols:
            cur.execute(f"ALTER TABLE hrms_members ADD COLUMN {col} {defn}")
            print(f"✅ hrms_members.{col} added")

    # ── 2. Add columns to jobs table ─────────────────────────────────────────
    job_columns = {
        "assigned_hiring_manager_id": "TEXT REFERENCES hrms_members(id)",
        "assigned_recruiter_id":      "TEXT REFERENCES hrms_members(id)",
    }
    existing = {row[1] for row in cur.execute("PRAGMA table_info(jobs)")}
    for col, col_def in job_columns.items():
        if col not in existing:
            cur.execute(f"ALTER TABLE jobs ADD COLUMN {col} {col_def}")
            print(f"✅ jobs.{col} added")
        else:
            print(f"⏭️  jobs.{col} already exists")

    # ── 3. Seed existing Recruiters as HRMSMembers ───────────────────────────
    # Migrates current Recruiter rows so existing data isn't orphaned
    # cur.execute("SELECT id, user_id, company_id FROM recruiters")
    # recruiters = cur.fetchall()
    # migrated = 0
    # for rec_id, user_id, company_id in recruiters:
    #     cur.execute("SELECT id FROM hrms_members WHERE user_id = ? AND company_id = ?", (user_id, company_id))
    #     if not cur.fetchone():
    #         import uuid
    #         from datetime import datetime
    #         cur.execute("""
    #             INSERT INTO hrms_members (id, user_id, company_id, hrms_role, is_active, joined_at, created_at)
    #             VALUES (?, ?, ?, 'recruiter', 1, ?, ?)
    #         """, (str(uuid.uuid4()), user_id, company_id, datetime.utcnow(), datetime.utcnow()))
    #         migrated += 1
    # print(f"✅ Migrated {migrated} existing recruiter(s) to hrms_members")

    # conn.commit()
    # conn.close()
    # print("\n🎉 HRMS migration complete.")
    # ── 3. Seed existing Recruiters as HRMSMembers ───────────────────────────
    import uuid
    from datetime import datetime
    cur.execute("SELECT id, user_id, company_id FROM recruiters")
    recruiters = cur.fetchall()
    migrated = 0
    for rec_id, user_id, company_id in recruiters:
        cur.execute("SELECT id FROM hrms_members WHERE user_id = ? AND company_id = ?", (user_id, company_id))
        if not cur.fetchone():
            now = datetime.now()
            cur.execute("""
                INSERT INTO hrms_members (id, user_id, company_id, hrms_role, joined_at, created_at)
                VALUES (?, ?, ?, 'recruiter', ?, ?)
            """, (str(uuid.uuid4()), user_id, company_id, now, now))
            migrated += 1
    print(f"✅ Migrated {migrated} existing recruiter(s) to hrms_members")


if __name__ == "__main__":
    run()
