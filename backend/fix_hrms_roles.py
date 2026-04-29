import sqlite3

conn = sqlite3.connect("hireflow_dev.db")
cur = conn.cursor()

cur.execute("UPDATE hrms_members SET hrms_role = 'COMPANY_ADMIN' WHERE hrms_role = 'company_admin'")
cur.execute("UPDATE hrms_members SET hrms_role = 'RECRUITER' WHERE hrms_role = 'recruiter'")
cur.execute("UPDATE hrms_members SET hrms_role = 'HIRING_MANAGER' WHERE hrms_role = 'hiring_manager'")
conn.commit()

cur.execute("SELECT user_id, hrms_role FROM hrms_members")
for r in cur.fetchall():
    print(r)

conn.close()
print("Done")