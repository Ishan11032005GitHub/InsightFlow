import sqlite3

class UserDAL:
    def __init__(self, db_path="users.db"):
        self.db_path = db_path
        self._initialize_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _initialize_db(self):
        """Create the database and necessary tables."""
        conn = self._get_connection()
        cursor = conn.cursor()
        # Creating a simple 'users' table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE
            )
        ''')
        conn.commit()
        conn.close()

    def create_user(self, name, email):
        """Insert a new user."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (name, email)
                VALUES (?, ?)
            ''', (name, email))
            conn.commit()
            user_id = cursor.lastrowid
            return user_id
        except sqlite3.IntegrityError:
            # Handle unique constraint violation on email
            return None
        finally:
            conn.close()

    def get_user_by_id(self, user_id):
        """Retrieve a user by ID."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, email FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return {"id": row[0], "name": row[1], "email": row[2]}
        return None

    def delete_user(self, user_id):
        """Delete a user by ID."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        return rows_affected > 0
