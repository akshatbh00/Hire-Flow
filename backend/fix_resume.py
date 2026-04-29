import sqlite3
conn = sqlite3.connect('hireflow_dev.db')
c = conn.cursor()
# find the user
u = c.execute("SELECT id FROM users WHERE email='akshatinmyspace1@gmail.com'").fetchone()
print('User ID:', u[0])
# find all resumes for this user
r = c.execute("SELECT id, is_active FROM resumes WHERE user_id=?", (u[0],)).fetchall()
print('Resumes:', r)
# make sure latest is active
if r:
    c.execute("UPDATE resumes SET is_active=1 WHERE id=?", (r[-1][0],))
    conn.commit()
    print('Fixed: set resume', r[-1][0], 'as active')
conn.close()