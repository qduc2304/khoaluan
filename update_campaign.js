require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function updateCampaign() {
  try {
    const oldName = 'NCKH Sinh Viên Năm Học 2025-2026';
    const newName = 'NCKH sinh viên cấp trường quý 4 2026';

    console.log('🚀 Bắt đầu cập nhật đợt thi và reset trạng thái đề tài...');

    // 1. Tạo đợt thi mới (Trạng thái đang mở)
    let newCampaignId;
    const [existingNew] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [newName]);
    if (existingNew.length > 0) {
      newCampaignId = existingNew[0].id;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO campaigns (name, academic_year, status, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [newName, '2026-2027', 'active', '2026-10-01', '2026-12-31']
      );
      newCampaignId = result.insertId;
      console.log(`✅ Đã tạo đợt thi mới: "${newName}"`);
    }

    // 2. Tìm đợt thi cũ
    const [existingOld] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [oldName]);
    if (existingOld.length > 0) {
      const oldCampaignId = existingOld[0].id;

      // 3. Chuyển toàn bộ đề tài sang đợt mới & Reset trạng thái để test quy trình
      const [updateResult] = await pool.execute(
        `UPDATE topics 
         SET campaign_id = ?, 
             status = 'pending', 
             round_status = 1, 
             award = NULL,
             average_score = NULL,
             funding_status = 'pending'
         WHERE campaign_id = ?`,
        [newCampaignId, oldCampaignId]
      );
      console.log(`✅ Đã gán ${updateResult.affectedRows} đề tài sang đợt thi mới.`);
      console.log(`✅ Đã RESET trạng thái các đề tài về "SV mới nộp (Chờ GVHD duyệt)".`);

      // 4. Xóa đợt thi cũ
      await pool.execute('DELETE FROM campaigns WHERE id = ?', [oldCampaignId]);
      console.log(`✅ Đã xóa đợt thi cũ: "${oldName}"`);
    } else {
      console.log(`⚠️ Không tìm thấy đợt thi cũ "${oldName}", có thể bạn đã xóa từ trước.`);
    }

    console.log('🎉 Cập nhật hoàn tất! Giờ bạn có thể bắt đầu quy trình vận hành thực tế.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await pool.end();
  }
}

updateCampaign();