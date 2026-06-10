require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function prepareManualTest() {
  try {
    const campaignName = 'NCKH Sinh Viên Năm Học 2025-2026';
    console.log(`🚀 Đang reset toàn bộ dữ liệu của đợt thi "${campaignName}" về Vòng Khoa để bạn tự tay test...`);
    
    // Tìm đợt thi
    const [camps] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (camps.length === 0) return console.log('❌ Không tìm thấy đợt thi.');
    const campaignId = camps[0].id;
    
    // Lấy 1 tài khoản Giám khảo
    const [councils] = await pool.execute("SELECT id, email FROM users WHERE role = 'council' LIMIT 1");
    if (councils.length === 0) return console.log('❌ Không tìm thấy giám khảo!');
    const councilId = councils[0].id;
    const councilEmail = councils[0].email;

    // Lấy tất cả đề tài của đợt thi
    const [topics] = await pool.execute('SELECT id FROM topics WHERE campaign_id = ?', [campaignId]);
    
    let count = 0;
    for (const topic of topics) {
      // Đưa về Vòng Khoa (level 1), trạng thái Đang chấm
      await pool.execute(
        "UPDATE topics SET status = 'grading', round_status = 1, award = NULL, effectiveness = NULL WHERE id = ?", 
        [topic.id]
      );
      
      // Xóa hết điểm và phân công cũ
      await pool.execute('DELETE FROM scores WHERE topic_id = ?', [topic.id]);
      
      // Phân công lại cho Giám khảo chấm Vòng 1
      await pool.execute(
        'INSERT INTO scores (topic_id, council_member_id, level) VALUES (?, ?, 1)', 
        [topic.id, councilId]
      );
      count++;
    }

    console.log(`✅ Đã reset thành công ${count} đề tài về Vòng Khoa!`);
    console.log(`\n👉 BƯỚC TIẾP THEO ĐỂ TEST:`);
    console.log(`1. Đăng nhập vào hệ thống bằng tài khoản Giám khảo: ${councilEmail} / Mật khẩu: 123456`);
    console.log(`2. Vào menu "Chấm điểm đề tài" -> Chọn Xem đề tài của đợt thi "${campaignName}".`);
    console.log(`3. Tự tay bấm "Chấm điểm" và nhập điểm cho từng bài.`);
    console.log(`   - Nhập < 50 điểm: Đề tài sẽ bị Dừng ở Khoa.`);
    console.log(`   - Nhập >= 50 điểm: Đề tài sẽ tự động Lên Vòng Trường.`);
    
  } catch (error) { 
    console.error('❌ Lỗi:', error); 
  } finally { 
    await pool.end(); 
  }
}

prepareManualTest();