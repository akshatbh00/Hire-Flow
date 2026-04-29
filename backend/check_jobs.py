import sqlite3
conn = sqlite3.connect('hireflow_dev.db')
c = conn.cursor()
print('Total jobs:', c.execute('SELECT COUNT(*) FROM jobs').fetchone()[0])
print('Active jobs:', c.execute('SELECT COUNT(*) FROM jobs WHERE is_active=1').fetchone()[0])
print('Status values:', c.execute('SELECT DISTINCT status FROM jobs').fetchall())

job_id = '3e18253b-8748-4554-a3e5-fc17d4296728'
result = c.execute('SELECT id, title, is_active, status FROM jobs WHERE id=?', (job_id,)).fetchone()
print('Job found:', result)

conn.close()