"""
backend/seed_admin_recruiter.py
Seeds admin@hireflow.com as a Recruiter linked to their company.
Run once.
"""
import sqlite3, uuid

conn = sqlite3.connect("hireflow_dev.db")
cur = conn.cursor()

ADMIN_ID = "8bf64245-459f-42d3-8ca8-58a5046c050b"

# Find their company via HRMSMember
cur.execute("SELECT company_id FROM hrms_members WHERE user_id = ?", (ADMIN_ID,))
row = cur.fetchone()
if not row:
    print("No HRMSMember found for admin — check seed_admin_hrms.py was run")
    conn.close()
    exit()

company_id = row[0]
print(f"Company ID: {company_id}")

# Check if Recruiter record already exists
cur.execute("SELECT id FROM recruiters WHERE user_id = ? AND company_id = ?", (ADMIN_ID, company_id))
existing = cur.fetchone()
if existing:
    print("Recruiter record already exists — nothing to do")
    conn.close()
    exit()

# Create Recruiter record
rec_id = str(uuid.uuid4())
cur.execute(
    "INSERT INTO recruiters (id, user_id, company_id) VALUES (?, ?, ?)",
    (rec_id, ADMIN_ID, company_id)
)
conn.commit()
print(f"✅ Recruiter record created: {rec_id}")

# Verify
cur.execute("""
    SELECT r.id, u.email, c.name
    FROM recruiters r
    JOIN users u ON u.id = r.user_id
    JOIN companies c ON c.id = r.company_id
    WHERE r.user_id = ?
""", (ADMIN_ID,))
print("Recruiter record:", cur.fetchone())

conn.close()
print("Done!")