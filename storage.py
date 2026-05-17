import sqlite3
import json
import os

class StorageManager:
    def __init__(self, db_path='divination.db'):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                gan_zhi TEXT,
                ben_gua TEXT,
                bian_gua TEXT,
                data_json TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def save_record(self, timestamp, gan_zhi, ben_gua, bian_gua, data_json):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO history (timestamp, gan_zhi, ben_gua, bian_gua, data_json)
            VALUES (?, ?, ?, ?, ?)
        ''', (timestamp, json.dumps(gan_zhi), ben_gua, bian_gua, json.dumps(data_json)))
        conn.commit()
        conn.close()

    def get_history(self, limit=50):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM history ORDER BY id DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'timestamp': row[1],
                'gan_zhi': json.loads(row[2]),
                'ben_gua': row[3],
                'bian_gua': row[4],
                'data_json': json.loads(row[5])
            })
        return history

    def delete_record(self, record_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM history WHERE id = ?', (record_id,))
        conn.commit()
        conn.close()
