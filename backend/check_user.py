import sqlite3
conn = sqlite3.connect('hireflow_dev.db')
c = conn.cursor()
users = c.execute('SELECT id, email, role FROM users').fetchall()
for u in users:
    resumes = c.execute('SELECT id, is_active FROM resumes WHERE user_id=?', (u[0],)).fetchall()
    print(u[1], u[2], '| resumes:', resumes)
conn.close()