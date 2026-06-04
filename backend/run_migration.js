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
    ssl: { ca: fs.readFileSync(caPath) },
    multipleStatements: true // VERY IMPORTANT FOR RUNNING THE SCRIPT
  });

  try {
    console.log('Dropping existing tables...');
    await pool.query(`
      SET FOREIGN_KEY_CHECKS = 0;
      DROP TABLE IF EXISTS scores, documents, topics, councils, campaigns, users;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
    
    console.log('Reading database.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    console.log('Executing database.sql...');
    await pool.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();