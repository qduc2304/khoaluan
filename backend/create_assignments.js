const pool = require('./db');

async function run() {
  try {
    await pool.query(`
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
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
}

run();
