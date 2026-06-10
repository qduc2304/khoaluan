require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function seedScores() {
  try {
    const campaignName = 'NCKH sinh viên cấp trường quý 4 2026';
    console.log('🚀 Bắt đầu gán điểm giả lập cho đợt thi:', campaignName);

    // 1. Tìm đợt thi
    const [camps] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (camps.length === 0) {
      console.log('❌ Không tìm thấy đợt thi. Hãy chắc chắn bạn đã tạo đợt thi đúng tên.');
      return;
    }
    const campaignId = camps[0].id;

    // 2. Lấy 1 tài khoản Giám khảo (council)
    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) {
      console.log('❌ Không tìm thấy tài khoản Giám khảo nào trong hệ thống!');
      return;
    }
    const councilId = councils[0].id;

    // 3. Lấy tất cả đề tài của đợt thi này
    const [topics] = await pool.execute('SELECT id FROM topics WHERE campaign_id = ?', [campaignId]);
    
    // Xóa điểm cũ (nếu có)
    for (const topic of topics) {
      await pool.execute('DELETE FROM scores WHERE topic_id = ?', [topic.id]);
    }

    // 4. Gán điểm ngẫu nhiên giảm dần (95, 93, 92...)
    let currentScore = 95;
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      
      // Thêm điểm vào bảng scores (level 2: Vòng Trường)
      await pool.execute(
        'INSERT INTO scores (topic_id, council_member_id, level, urgency_score, method_score, result_score) VALUES (?, ?, ?, 0, 0, ?)', 
        [topic.id, councilId, 2, currentScore]
      );
      // Đẩy đề tài lên trạng thái Hoàn thành ở Vòng 3
      await pool.execute("UPDATE topics SET status = 'completed', round_status = 3 WHERE id = ?", [topic.id]);
      
      currentScore -= (Math.floor(Math.random() * 3) + 1);
    }

    console.log(`✅ Đã bơm điểm thành công cho ${topics.length} đề tài! Các đề tài đã sẵn sàng để xét giải.`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}

seedScores();