require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function resetTestFlow() {
  try {
    console.log('🚀 Bắt đầu làm mới dữ liệu điểm để test quy trình...');

    // 1. Xóa hẳn toàn bộ phân công và điểm của Vòng Trường để reset thật sạch
    const [deleteScores] = await pool.execute('DELETE FROM scores WHERE level > 1');
    console.log(`✅ Đã xóa ${deleteScores.affectedRows} bản ghi phân công của Vòng Trường.`);

    // 2. Xóa điểm nhưng GIỮ LẠI danh sách phân công giám khảo ở Vòng Khoa (level 1)
    const [updateScores] = await pool.execute(`
      UPDATE scores 
      SET urgency_score = 0, 
          method_score = 0, 
          result_score = NULL, 
          comment = NULL
      WHERE level = 1
    `);
    console.log(`✅ Đã làm trắng điểm của ${updateScores.affectedRows} bản ghi phân công Vòng Khoa.`);

    // 3. Đưa toàn bộ đề tài về trạng thái "Đang chấm" ở Vòng Khoa, xóa điểm TB và giải thưởng
    const [updateTopics] = await pool.execute(`
      UPDATE topics 
      SET average_score = NULL, 
          award = NULL,
          effectiveness = NULL,
          round_status = 1,
          status = 'grading'
    `);
    console.log(`✅ Đã reset ${updateTopics.affectedRows} đề tài về Vòng Khoa (Sẵn sàng chấm điểm).`);

    console.log('🎉 HOÀN TẤT! Quy trình test của bạn:');
    console.log('1. Đăng nhập Giám khảo/Thư ký -> Chấm điểm (Cần chấm cho ra điểm dưới 50 và trên 50 để test chức năng lọc).');
    console.log('2. Đăng nhập Chuyên viên -> Chốt điểm & Chuyển vòng (Tự động).');
    console.log('3. Phân công giám khảo Vòng Trường -> Đăng nhập lại Giám khảo chấm điểm tiếp.');
    console.log('4. Đăng nhập Chuyên viên -> Vào "Thống kê & Báo cáo" -> Tự động xét giải.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await pool.end();
  }
}

resetTestFlow();