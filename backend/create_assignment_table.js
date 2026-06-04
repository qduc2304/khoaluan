const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS topic_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        examiner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(topic_id, examiner_id)
    )
  `);
  
  console.log('Created topic_assignments table');
  await connection.end();
}

run().catch(console.error);