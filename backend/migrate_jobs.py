import sqlite3

conn = sqlite3.connect('hireflow_dev.db')
c = conn.cursor()
cols = [row[1] for row in c.execute('PRAGMA table_info(jobs)').fetchall()]
print('Existing columns:', cols)

to_add = [
    ('status',           'VARCHAR DEFAULT "live"'),
    ('source',           'VARCHAR DEFAULT "internal"'),
    ('source_url',       'VARCHAR'),
    ('budget_approved',  'BOOLEAN DEFAULT 1'),
    ('headcount',        'INTEGER'),
    ('approved_by',      'VARCHAR(36)'),
    ('approved_at',      'DATETIME'),
    ('rejection_reason', 'TEXT'),
]

for col, typedef in to_add:
    if col not in cols:
        c.execute(f'ALTER TABLE jobs ADD COLUMN {col} {typedef}')
        print(f'Added: {col}')
    else:
        print(f'Already exists: {col}')

conn.commit()
conn.close()
print('Done')