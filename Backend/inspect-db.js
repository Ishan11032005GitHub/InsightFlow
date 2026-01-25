#!/usr/bin/env node

/**
 * Database Inspector - View all contents of InsightFlow SQLite database
 * Usage: node inspect-db.js
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

// Get all table names
db.all(`SELECT name FROM sqlite_master WHERE type='table';`, (err, tables) => {
  if (err) {
    console.error('❌ Error fetching tables:', err.message);
    db.close();
    process.exit(1);
  }

  if (!tables || tables.length === 0) {
    console.log('📭 No tables found in database\n');
    db.close();
    process.exit(0);
  }

  console.log(`📊 Found ${tables.length} table(s):\n`);
  
  let completed = 0;
  tables.forEach((table, index) => {
    const tableName = table.name;
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📋 TABLE: "${tableName}"`);
    console.log(`${'═'.repeat(80)}`);

    // Get table info
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        console.error(`❌ Error fetching columns for ${tableName}:`, err.message);
        return;
      }

      if (columns && columns.length > 0) {
        console.log('\n📌 Schema:');
        console.table(columns.map(c => ({
          Name: c.name,
          Type: c.type,
          Null: c.notnull ? 'NO' : 'YES',
          PK: c.pk ? '✓' : ''
        })));
      }

      // Get all rows
      db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
        if (err) {
          console.error(`❌ Error fetching rows from ${tableName}:`, err.message);
        } else {
          console.log(`\n📊 Data (${rows.length} row${rows.length !== 1 ? 's' : ''}):`);
          if (rows.length === 0) {
            console.log('   (empty table)');
          } else {
            console.table(rows);
          }
        }

        completed++;
        if (completed === tables.length) {
          console.log(`\n${'═'.repeat(80)}`);
          console.log('✅ Database inspection complete!\n');
          db.close();
        }
      });
    });
  });
});
