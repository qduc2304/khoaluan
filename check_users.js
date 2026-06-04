const pool = require('./backend/db');

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT id, full_name, email, password, role FROM users');
    console.log(rows);
  } catch (error) {
    console.error('Lỗi khi truy vấn:', error);
  } finally {
    pool.end();
  }
}

checkUsers();
