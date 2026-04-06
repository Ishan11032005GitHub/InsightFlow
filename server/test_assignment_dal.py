import unittest
import sqlite3
import os
from assignment_dal import UserDAL

class TestUserDALWhiteBox(unittest.TestCase):
    """
    White Box Testing (Glass Box Testing):
    Testing internal logic, handling of specific exceptions, internal state changes.
    The tester knows about the internal database structure and the code logic.
    """
    def setUp(self):
        self.test_db = "white_box_test.db"
        self.dal = UserDAL(self.test_db)

    def tearDown(self):
        try:
            if os.path.exists(self.test_db):
                os.remove(self.test_db)
        except PermissionError:
            pass

    def test_database_initialization(self):
        """Test internal table creation logic using direct database inspection."""
        # Connect directly to see if table was created properly
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        table = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(table, "Internal logic for table creation failed")

    def test_create_user_internal_integrity_exception(self):
        """Test the internal error handling of sqlite3.IntegrityError."""
        self.dal.create_user("Alice", "alice@example.com")
        # Trying to create another user with same email to trigger IntegrityError handling
        result = self.dal.create_user("Alice Clone", "alice@example.com")
        self.assertIsNone(result, "Internal exception catching for IntegrityError failed")


class TestUserDALBlackBox(unittest.TestCase):
    """
    Black Box Testing (Functional Testing):
    Testing functional requirements without caring about internal implementation.
    The tester evaluates based on inputs and expected outputs.
    """
    def setUp(self):
        self.test_db = "black_box_test.db"
        self.dal = UserDAL(self.test_db)

    def tearDown(self):
        try:
            if os.path.exists(self.test_db):
                os.remove(self.test_db)
        except PermissionError:
            pass

    def test_create_and_get_user(self):
        """Test functionally if we can add a user and retrieve them."""
        user_id = self.dal.create_user("Bob", "bob@example.com")
        self.assertIsNotNone(user_id)
        
        user = self.dal.get_user_by_id(user_id)
        self.assertIsNotNone(user)
        self.assertEqual(user['name'], "Bob")
        self.assertEqual(user['email'], "bob@example.com")

    def test_get_nonexistent_user(self):
        """Test retrieving a user that does not exist."""
        user = self.dal.get_user_by_id(999)
        self.assertIsNone(user)

    def test_delete_user(self):
        """Test deleting a user removes them from the system."""
        user_id = self.dal.create_user("Charlie", "charlie@example.com")
        
        # Verify deletion returns True on success
        success = self.dal.delete_user(user_id)
        self.assertTrue(success)
        
        # Verify user is actually gone
        user = self.dal.get_user_by_id(user_id)
        self.assertIsNone(user)

    def test_delete_nonexistent_user(self):
        """Test deleting a user that does not exist."""
        success = self.dal.delete_user(999)
        self.assertFalse(success)

if __name__ == '__main__':
    unittest.main()
