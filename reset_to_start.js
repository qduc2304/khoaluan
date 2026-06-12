require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function resetToStart() {
  try {
    console.log('🚀 Bắt đầu reset hệ thống về trạng thái MỚI TINH (Vạch xuất phát)...');

    // 1. Xóa toàn bộ điểm và phân công
    const [deleteScores] = await pool.execute('DELETE FROM scores');
    console.log(`✅ Đã xóa sạch ${deleteScores.affectedRows} bản ghi phân công giám khảo và điểm số.`);

    // 2. Reset toàn bộ đề tài về "Mới nộp", Vòng 1, chưa có điểm
    const [updateTopics] = await pool.execute(`
      UPDATE topics 
      SET average_score = NULL, 
          award = NULL,
          effectiveness = NULL,
          round_status = 1,
          status = 'pending',
          funding_status = 'pending'
    `);
    console.log(`✅ Đã đưa ${updateTopics.affectedRows} đề tài về Vòng Khoa (Mới nộp, chờ Duyệt).`);

    console.log('\n🎉 HOÀN TẤT! BẠN CÓ THỂ TEST QUY TRÌNH CHUẨN TỪ A-Z:');
    console.log('1. [Chuyên viên] Bấm "Duyệt" các đề tài -> Chuyển sang trạng thái "Đã duyệt".');
    console.log('2. [Chuyên viên] Bấm "Phân công" Hội đồng Vòng Khoa -> Đổi sang "Đã phân công".');
    console.log('3. [Hội đồng] Chấm điểm (Cố tình chấm < 50 và >= 50) -> Điểm đẩy về Chuyên viên.');
    console.log('4. [Chuyên viên] Bấm "Chốt điểm tự động" -> Bài đậu lên Vòng Trường (mất điểm), Bài rớt Dừng ở Khoa.');
    console.log('5. [Chuyên viên] Bấm "Phân công" lại cho các bài Vòng Trường.');
    console.log('6. [Hội đồng] Chấm điểm Vòng Trường -> Điểm đẩy về Chuyên viên.');
    console.log('7. [Chuyên viên] Bấm nút "Hoàn thành" (màu xanh) cho các bài Vòng Trường đã chấm xong.');
    console.log('8. [Chuyên viên] Vào "Thống kê & Báo cáo" -> Bấm "Tự động xét giải".');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await pool.end();
  }
}

resetToStart();