const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caPath = path.join(__dirname, 'ca.pem');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { ca: fs.readFileSync(caPath) }
  });

  try {
    console.log('Adding revision_reason column to topics table if not exists...');
    await pool.query(`
      ALTER TABLE topics 
      ADD COLUMN revision_reason TEXT AFTER status;
    `);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();