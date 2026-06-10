require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function fixScores2025() {
  try {
    const campaignName = 'NCKH Sinh Viên Năm Học 2025-2026';
    console.log('🚀 Bắt đầu quét và bù điểm cho đợt thi:', campaignName);
    
    const [camps] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (camps.length === 0) return console.log('❌ Không tìm thấy đợt thi.');
    const campaignId = camps[0].id;

    const [councils] = await pool.execute("SELECT id FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy giám khảo trong hệ thống!');
    const councilId = councils[0].id;

    const [topics] = await pool.execute('SELECT id, award FROM topics WHERE campaign_id = ?', [campaignId]);

    let count = 0;
    for (const topic of topics) {
      // Xóa điểm cũ (nếu có)
      await pool.execute('DELETE FROM scores WHERE topic_id = ?', [topic.id]);

      // Bơm điểm tương ứng với giải thưởng
      let score = 65; // Không có giải thì 65đ
      if (topic.award) {
        if (topic.award.includes('Nhất')) score = 95;
        else if (topic.award.includes('Nhì')) score = 88;
        else if (topic.award.includes('Ba')) score = 80;
        else if (topic.award.includes('Khuyến khích')) score = 75;
      }
      
      await pool.execute(
        'INSERT INTO scores (topic_id, council_member_id, level, urgency_score, method_score, result_score) VALUES (?, ?, 2, 0, 0, ?)', 
        [topic.id, councilId, score]
      );
      await pool.execute("UPDATE topics SET round_status = 3, status = 'completed' WHERE id = ?", [topic.id]);
      count++;
    }
    console.log(`✅ Đã bù điểm thành công cho ${count} đề tài! Điểm đã được tự động tính chuẩn theo Giải thưởng.`);
  } catch (error) { console.error('❌ Lỗi:', error); } finally { await pool.end(); }
}
fixScores2025();