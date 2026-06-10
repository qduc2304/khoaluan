require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function autoGrade() {
  try {
    console.log('🚀 Bắt đầu tự động chấm điểm Vòng Khoa...');
    
    // Lấy 1 tài khoản Giám khảo
    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy giám khảo!');
    const councilId = councils[0].id;

    // Lấy các đề tài đang chờ chấm ở Vòng 1
    const [topics] = await pool.execute("SELECT id FROM topics WHERE round_status = 1 AND status = 'grading'");
    
    if (topics.length === 0) {
      return console.log('⚠️ Không có đề tài nào đang chờ chấm ở Vòng Khoa!');
    }

    let countPassed = 0;
    let countFailed = 0;

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      // Cho 5 bài rớt (từ 35-49đ), còn lại đậu (từ 65-95đ)
      let score = i < 5 ? (Math.floor(Math.random() * 15) + 35) : (Math.floor(Math.random() * 31) + 65);

      // Cập nhật điểm cho Giám khảo ở Vòng 1
      await pool.execute('UPDATE scores SET result_score = ? WHERE topic_id = ? AND council_member_id = ? AND level = 1', [score, topic.id, councilId]);

      // Xử lý logic Đạt/Rớt
      if (score >= 50) {
        await pool.execute("UPDATE topics SET round_status = 2 WHERE id = ?", [topic.id]);
        countPassed++;
      } else {
        await pool.execute("UPDATE topics SET round_status = 0, status = 'completed' WHERE id = ?", [topic.id]);
        countFailed++;
      }
    }

    console.log(`✅ Đã chấm tự động xong ${topics.length} đề tài!`);
    console.log(`👉 Kết quả thực tế: ${countPassed} bài ĐẬU (Lên Vòng Trường), ${countFailed} bài RỚT (Dừng ở Khoa).`);
    console.log(`\n👉 Bạn hãy vào Web bằng tài khoản Quản trị, mở "Quản lý đề tài" để xem kết quả phân loại tuyệt đẹp nhé!`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}
autoGrade();