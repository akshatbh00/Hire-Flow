import sqlite3
conn = sqlite3.connect('hireflow_dev.db')
conn.execute("UPDATE jobs SET status = 'LIVE' WHERE status = 'live'")
conn.execute("UPDATE jobs SET status = 'LIVE' WHERE status IS NULL")
conn.commit()
print('Done')
conn.close()