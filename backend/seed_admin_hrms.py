"""
backend/seed_admin_hrms.py
Run once to make admin@hireflow.com a company_admin in hrms_members
"""
import sqlite3, uuid
from datetime import datetime

conn = sqlite3.connect("hireflow_dev.db")
cur = conn.cursor()

# Find admin user
cur.execute("SELECT id FROM users WHERE email = 'admin@hireflow.com'")
admin = cur.fetchone()
if not admin:
    print("admin@hireflow.com not found")
    conn.close()
    exit()

admin_id = admin[0]
print(f"Admin user id: {admin_id}")

# Find their company
cur.execute("SELECT company_id FROM recruiters WHERE user_id = ?", (admin_id,))
rec = cur.fetchone()
if not rec:
    cur.execute("SELECT id FROM companies LIMIT 1")
    rec = cur.fetchone()
    company_id = rec[0] if rec else None
else:
    company_id = rec[0]

if not company_id:
    print("No company found")
    conn.close()
    exit()

print(f"Company id: {company_id}")

# Check if already exists
cur.execute("SELECT id, hrms_role FROM hrms_members WHERE user_id = ?", (admin_id,))
existing = cur.fetchone()
if existing:
    cur.execute("UPDATE hrms_members SET hrms_role = 'company_admin' WHERE user_id = ?", (admin_id,))
    print(f"Updated existing record (was: {existing[1]}) → company_admin")
else:
    now = datetime.now()
    cur.execute(
        "INSERT INTO hrms_members (id, user_id, company_id, hrms_role, is_active, joined_at, created_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
        (str(uuid.uuid4()), admin_id, company_id, "company_admin", now, now)
    )
    print("Created company_admin hrms_member record")

# Also show all hrms_members for verification
print("\nAll hrms_members:")
cur.execute("""
    SELECT u.email, h.hrms_role, h.company_id
    FROM hrms_members h
    JOIN users u ON u.id = h.user_id
""")
for row in cur.fetchall():
    print(f"  {row[0]} — {row[1]} — company: {row[2]}")

conn.commit()
conn.close()
print("\nDone!")