require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');
const bcrypt = require('./backend/node_modules/bcrypt');

const data = [
  {
    title: 'Xây dựng trang web đăng ký học tin học, ngoại ngữ cho trung tâm tin học, ngoại ngữ và giáo dục nghề nghiệp, GD thường xuyên Trường Đại học Thái Bình',
    leader: { name: 'Nguyễn Thị Thu Hiền', code: '2200308', major: 'Công nghệ thông tin', class_name: 'Khóa 11' },
    members: 'Nguyễn Tiến Hoàng (2200559), Bùi Duy Đạt (2200501)',
    instructor: 'Nguyễn Thị Sinh',
    award: 'Giải Nhất'
  },
  {
    title: 'Tích hợp AI xây dựng ứng dụng trên Website lên lịch công tác tuần cho Trường Đại học Thái Bình',
    leader: { name: 'Trần Thị Thanh Huyền', code: '2300223', major: 'Công nghệ thông tin', class_name: 'Khóa 12' },
    members: 'Cao Văn Tuyên (2300365), Trần Văn Long (2300273), Phạm Như Quỳnh (2300331)',
    instructor: 'Trần Hữu Anh',
    award: 'Giải Nhì'
  },
  {
    title: 'Xây dựng hệ thống kiểm soát xe ra vào tự động của Cán bộ/Học sinh - sinh viên Trường Đại Học Thái Bình',
    leader: { name: 'Đặng Văn Thành', code: '2400350', major: 'Công nghệ kỹ thuật Điện, Điện tử', class_name: 'Khóa 13' },
    members: 'Tạ Quang Đạt (2400559), Nguyễn Đức Mạnh (2400264), Nguyễn Thế Vinh (2400502)',
    instructor: 'Nguyễn Văn Hiến',
    award: 'Giải Nhì'
  },
  {
    title: 'Xây dựng phần mềm quản lý các khóa đào tạo ngắn hạn tại trường đại học Thái Bình',
    leader: { name: 'Bùi Anh Văn', code: '2300204', major: 'Công nghệ thông tin', class_name: 'Khóa 12' },
    members: 'Hà Quang Anh (2300972), Hoàng Văn Phúc (2300183)',
    instructor: 'Lê Thanh Hùng',
    award: 'Giải Ba'
  },
  {
    title: 'Thiết kế, chế tạo hệ thống điều khiển giám sát thiết bị điện năng tiêu thụ của toà nhà ứng dụng IoT',
    leader: { name: 'Phạm Văn Bảo', code: '2200461', major: 'Công nghệ kỹ thuật Điện, Điện tử', class_name: 'Khóa 11' },
    members: 'Đoàn Minh Tuấn (2200389), Trần Ngọc Thao (2200470), Hà Huy Hoàng (2200745)',
    instructor: 'Nguyễn Thị Nga',
    award: 'Giải Ba'
  },
  {
    title: 'Ứng dụng công nghệ truyền thông LORA trong hệ thống tưới tiêu thông minh trường ĐH Thái Bình',
    leader: { name: 'Nguyễn Ngọc Hải', code: '2300425', major: 'Công nghệ kỹ thuật Điện, Điện tử', class_name: 'Khóa 12' },
    members: 'Đào Văn Tình (2300472), Đoàn Văn Nam (2300441)',
    instructor: 'Tống Thị Lan',
    award: 'Giải Ba'
  },
  {
    title: 'Nghiên cứu, thiết kế máy vát mép cạnh đầu gỗ tự động',
    leader: { name: 'Trần Ngọc Anh', code: '2200111', major: 'Công nghệ kỹ thuật Cơ khí', class_name: 'Khóa 11' },
    members: 'Nguyễn Văn Hướng, Nguyễn Văn Luyện, Phan Hải Đăng, Phan Văn Đức Thịnh',
    instructor: 'Trần Công Thức',
    award: 'Giải Khuyến khích'
  },
  {
    title: 'Nghiên cứu lắp đặt động cơ gắn máy thành máy bơm nước phục vụ trong lĩnh vực nông nghiệp',
    leader: { name: 'Tô Gia Huy', code: '2300285', major: 'Công nghệ kỹ thuật Cơ khí', class_name: 'Khóa 12' },
    members: 'Nguyễn Thành Huy (2300247), Nguyễn Văn Lượng (2300208), Hoàng Đình Thạch (2300408)',
    instructor: 'Phạm Thế Hùng',
    award: 'Giải Khuyến khích'
  },
  {
    title: 'Thiết kế, mô phỏng Robot trong dây chuyền công nghiệp và Robot pha chế đồ uống',
    leader: { name: 'Hà Huy Hoàng', code: '2200745', major: 'Công nghệ kỹ thuật Điện, Điện tử', class_name: 'Khóa 11' },
    members: 'Phạm Văn Bảo (2200461), Trần Ngọc Thao (2200470), Đoàn Minh Tuấn (2200389), Vũ Duy Phong (2200490)',
    instructor: 'Đào Thị Mơ',
    award: 'Giải Khuyến khích'
  },
  {
    title: 'Khảo sát hệ thống làm mát, và phương pháp kiểm tra sửa chữa, bảo dưỡng hệ thống làm mát của động cơ TOYOTA 4SFE',
    leader: { name: 'Nguyễn Ngọc Minh', code: '2300319', major: 'Công nghệ kỹ thuật Cơ khí', class_name: 'Khóa 12' },
    members: 'Nguyễn Như Ngọc (2300371), Vũ Mạnh Hưng (2300818), Bùi Tiến Dũng (2300418)',
    instructor: 'Phạm Sỹ Liên',
    award: 'Giải Khuyến khích'
  },
  {
    title: 'Khảo sát biến mô thủy lực trên hộp số tự động 4 số trên động cơ (4 speend AT/4SE)',
    leader: { name: 'Lê Thanh Hoàng', code: '2300211', major: 'Công nghệ kỹ thuật Cơ khí', class_name: 'Khóa 13' },
    members: 'Đỗ Đình Thành Công (2300353), Bùi Thành Đạt (2300412)',
    instructor: 'Phạm Sỹ Liên',
    award: 'Giải Khuyến khích'
  },
  {
    title: 'Nghiên cứu ảnh hưởng của việc sử dụng nhiên liệu sinh học đến đặc tính vận hành của động cơ đốt trong',
    leader: { name: 'Trần Hoàng Năng', code: '2300448', major: 'Công nghệ ô Tô', class_name: 'Khóa 12' },
    members: 'Nguyễn Thế An (2300254), Phạm Tiến Đạt (2300322), Đặng Tiến Duy (2300263)',
    instructor: 'Phạm Thế Hùng',
    award: null
  },
  {
    title: 'Nghiên cứu, thiết kế hệ thống đèn pha, gạt nước rửa kính tự động trên ô tô',
    leader: { name: 'Nguyễn Thành Huy', code: '2300247_2', major: 'Công nghệ ô Tô', class_name: 'Khóa 12' },
    members: 'Nguyễn Văn Lượng, Hoàng Đình Thạch, Phạm Trường Giang, Phạm Hoàng Thái',
    instructor: 'Lê Mạnh Hùng',
    award: null
  }
];

const defaultPassword = '123456';
const facultyName = 'Khoa Công nghệ và Kỹ thuật';

const generateEmail = (name, prefix) => {
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s/g, '');
  return `${prefix}_${cleanName}@truong.vn`;
};

async function importData() {
  try {
    console.log('🚀 Bắt đầu import dữ liệu NCKH - Khoa CN&KT...');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Tạo Đợt Tuyển Chọn
    const campaignName = 'NCKH Sinh Viên Năm Học 2025-2026';
    let campaignId;
    const [existingCamp] = await pool.execute('SELECT id FROM campaigns WHERE name = ?', [campaignName]);
    if (existingCamp.length > 0) {
      campaignId = existingCamp[0].id;
    } else {
      const [campResult] = await pool.execute(
        'INSERT INTO campaigns (name, academic_year, status, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [campaignName, '2025-2026', 'closed', '2025-01-01', '2026-06-01']
      );
      campaignId = campResult.insertId;
      console.log(`✅ Đã tạo đợt tuyển chọn: ${campaignName} (ID: ${campaignId})`);
    }

    // 2. Lặp qua danh sách đề tài để chèn Instructor, Student và Topic
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      // Xử lý Giảng viên (Instructor)
      let instructorId;
      const instructorEmail = generateEmail(item.instructor, 'gv');
      const [existingInst] = await pool.execute('SELECT id FROM users WHERE email = ?', [instructorEmail]);
      
      if (existingInst.length > 0) {
        instructorId = existingInst[0].id;
      } else {
        const [instResult] = await pool.execute(
          'INSERT INTO users (full_name, email, password, role, faculty_name) VALUES (?, ?, ?, ?, ?)',
          [item.instructor, instructorEmail, hashedPassword, 'instructor', facultyName]
        );
        instructorId = instResult.insertId;
      }

      // Xử lý Sinh viên (Student Chủ nhiệm)
      let studentId;
      const studentEmail = `${item.leader.code}@truong.vn`;
      const [existingStu] = await pool.execute('SELECT id FROM users WHERE email = ? OR student_code = ?', [studentEmail, item.leader.code]);
      
      if (existingStu.length > 0) {
        studentId = existingStu[0].id;
      } else {
        const [stuResult] = await pool.execute(
          'INSERT INTO users (full_name, email, password, role, student_code, faculty_name, major, class_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.leader.name, studentEmail, hashedPassword, 'student', item.leader.code, facultyName, item.leader.major, item.leader.class_name]
        );
        studentId = stuResult.insertId;
      }

      // Xử lý Đề tài (Topic)
      const [existingTopic] = await pool.execute('SELECT id FROM topics WHERE title = ?', [item.title]);
      if (existingTopic.length === 0) {
        await pool.execute(
          `INSERT INTO topics (title, field_of_study, student_id, instructor_id, team_members, campaign_id, status, award) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.title, 
            facultyName, 
            studentId, 
            instructorId, 
            item.members, 
            campaignId, 
            'completed', // Chuyển trạng thái sang completed vì đã có giải thưởng
            item.award
          ]
        );
        console.log(`✅ Đã thêm đề tài: ${item.title.substring(0, 40)}...`);
      }
    }

    console.log('🎉 Import toàn bộ 13 đề tài Khoa Công nghệ & Kỹ thuật thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
  } finally {
    await pool.end();
  }
}

importData();