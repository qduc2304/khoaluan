const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
    console.log('Modifying scores table...');
    // We need to drop total_score first because it depends on the columns we are modifying? 
    // Actually MODIFY might not be allowed if a generated column depends on them, let's try dropping and re-adding.
    
    await pool.query('ALTER TABLE scores DROP COLUMN total_score');
    await pool.query('ALTER TABLE scores MODIFY urgency_score DECIMAL(5,2) DEFAULT NULL');
    await pool.query('ALTER TABLE scores MODIFY method_score DECIMAL(5,2) DEFAULT NULL');
    await pool.query('ALTER TABLE scores MODIFY result_score DECIMAL(5,2) DEFAULT NULL');
    await pool.query('ALTER TABLE scores ADD COLUMN total_score DECIMAL(5,2) GENERATED ALWAYS AS (urgency_score + method_score + result_score) STORED');
    
    // Also update existing rows where urgency_score = 0 and method_score = 0 and result_score = 0 to NULL
    await pool.query('UPDATE scores SET urgency_score = NULL, method_score = NULL, result_score = NULL WHERE total_score = 0 OR total_score IS NULL');

    console.log('Scores table modified successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();