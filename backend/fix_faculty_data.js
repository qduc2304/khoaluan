const pool = require('./db');

async function migrateFacultyNames() {
  try {
    const [result] = await pool.execute(
      "UPDATE users SET faculty_name = 'Khoa Công nghệ và Kỹ thuật' WHERE faculty_name = 'cntt' OR faculty_name = 'CNTT'"
    );
    console.log(`Cập nhật faculty_name trong bảng users thành công. Số dòng bị ảnh hưởng: ${result.affectedRows}`);

    const [resultTopics] = await pool.execute(
      "UPDATE topics SET field_of_study = 'Khoa Công nghệ và Kỹ thuật' WHERE field_of_study = 'cntt' OR field_of_study = 'CNTT'"
    );
    console.log(`Cập nhật field_of_study trong bảng topics thành công. Số dòng bị ảnh hưởng: ${resultTopics.affectedRows}`);
    
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
  } finally {
    pool.end();
  }
}

migrateFacultyNames();
