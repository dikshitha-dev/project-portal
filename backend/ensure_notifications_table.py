import sqlite3

con = sqlite3.connect('portal.db')
con.execute('''
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME
)
''')
con.commit()
print("notifications table successfully created/ensured.")
