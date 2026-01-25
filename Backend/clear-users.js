#!/usr/bin/env node

/**
 * Clear Users Table - Remove all user records from database
 * Usage: node clear-users.js
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'insightflow.sqlite'), (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database\n');
});

// Clear Users table
console.log('🧹 Clearing Users table...\n');

db.run('DELETE FROM Users', function(err) {
  if (err) {
    console.error('❌ Error clearing Users table:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`✅ Deleted ${this.changes} user record(s) from Users table\n`);

  // Reset auto-increment counter
  db.run('DELETE FROM sqlite_sequence WHERE name="Users"', function(err) {
    if (err) {
      console.error('❌ Error resetting sequence:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('✅ Reset auto-increment counter\n');

    // Verify it's empty
    db.get('SELECT COUNT(*) as count FROM Users', (err, row) => {
      if (err) {
        console.error('❌ Error verifying:', err.message);
      } else {
        console.log(`📊 Users table now contains: ${row.count} records\n`);
        console.log('✨ Users table cleared successfully!\n');
      }

      db.close();
    });
  });
});
