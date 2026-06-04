const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:8080/api';

// Biến lưu token và user info
let token = '';
let studentId = '';
let topicId = '';
let reportId = '';

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function log(title, status, message) {
  const color = status === 'success' ? colors.green : status === 'error' ? colors.red : colors.yellow;
  console.log(`\n${color}[${title}] ${message}${colors.reset}`);
}

// Test 1: Đăng nhập sinh viên
async function testStudentLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'sinhvien@truong.vn',
      password: '123456'
    });
    token = response.data.token;
    studentId = response.data.user.id;
    await log('LOGIN STUDENT', 'success', `✓ Đăng nhập thành công. Token: ${token.substring(0, 20)}...`);
    return true;
  } catch (error) {
    await log('LOGIN STUDENT', 'error', `✗ Lỗi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 2: Lấy danh sách đề tài của sinh viên
async function testGetStudentTopics() {
  try {
    const response = await axios.get(`${API_URL}/topics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentTopics = response.data.filter(t => t.student_id === studentId);
    if (studentTopics.length > 0) {
      topicId = studentTopics[0].id;
      await log('GET TOPICS', 'success', `✓ Lấy được ${studentTopics.length} đề tài. Chọn đề tài ID: ${topicId}`);
      return true;
    } else {
      await log('GET TOPICS', 'error', `✗ Không có đề tài nào`);
      return false;
    }
  } catch (error) {
    await log('GET TOPICS', 'error', `✗ Lỗi: ${error.message}`);
    return false;
  }
}

// Test 3: Nộp báo cáo (work file)
async function testSubmitReport() {
  try {
    // Tạo file test
    const workFilePath = path.join(__dirname, 'test_work.txt');
    const ppFilePath = path.join(__dirname, 'test_pp.ppt');
    
    fs.writeFileSync(workFilePath, 'This is a test work file');
    fs.writeFileSync(ppFilePath, 'This is a test PP file');

    const form = new FormData();
    form.append('topic_id', topicId);
    form.append('work', fs.createReadStream(workFilePath));
    form.append('pp', fs.createReadStream(ppFilePath));

    const response = await axios.post(`${API_URL}/reports/submit`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    reportId = response.data.reportId;
    await log('SUBMIT REPORT', 'success', `✓ Báo cáo đã nộp thành công. Report ID: ${reportId}`);
    
    // Xóa file test
    fs.unlinkSync(workFilePath);
    fs.unlinkSync(ppFilePath);
    return true;
  } catch (error) {
    await log('SUBMIT REPORT', 'error', `✗ Lỗi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 4: Lấy báo cáo của sinh viên
async function testGetMyReports() {
  try {
    const response = await axios.get(`${API_URL}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const myReports = response.data;
    if (myReports.length > 0) {
      await log('GET MY REPORTS', 'success', `✓ Lấy được ${myReports.length} báo cáo của sinh viên`);
      return true;
    } else {
      await log('GET MY REPORTS', 'warning', `⚠ Không có báo cáo nào từ sinh viên này`);
      return true;
    }
  } catch (error) {
    await log('GET MY REPORTS', 'error', `✗ Lỗi: ${error.message}`);
    return false;
  }
}

// Test 5: Đăng nhập specialist để phê duyệt
async function testSpecialistLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'chuyenvien@truong.vn',
      password: '123456'
    });
    token = response.data.accessToken;
    await log('LOGIN SPECIALIST', 'success', `✓ Đăng nhập specialist thành công`);
    return true;
  } catch (error) {
    await log('LOGIN SPECIALIST', 'error', `✗ Lỗi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 6: Phê duyệt báo cáo
async function testApproveReport() {
  try {
    const response = await axios.patch(`${API_URL}/reports/${reportId}/approve`, {
      work_status: 'approved',
      pp_status: 'approved',
      notes: 'Báo cáo rất tốt!'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await log('APPROVE REPORT', 'success', `✓ Báo cáo đã được phê duyệt`);
    return true;
  } catch (error) {
    await log('APPROVE REPORT', 'error', `✗ Lỗi: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Xem báo cáo đã phê duyệt (public)
async function testGetApprovedReports() {
  try {
    const response = await axios.get(`${API_URL}/reports/approved/list`);
    if (response.data.length > 0) {
      await log('GET APPROVED REPORTS', 'success', `✓ Lấy được ${response.data.length} báo cáo đã phê duyệt`);
      return true;
    } else {
      await log('GET APPROVED REPORTS', 'warning', `⚠ Không có báo cáo đã phê duyệt`);
      return true;
    }
  } catch (error) {
    await log('GET APPROVED REPORTS', 'error', `✗ Lỗi: ${error.message}`);
    return false;
  }
}

// Chạy tất cả tests
async function runAllTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   TEST REPORT SUBMISSION FEATURE${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const tests = [
    { name: 'Student Login', fn: testStudentLogin },
    { name: 'Get Student Topics', fn: testGetStudentTopics },
    { name: 'Submit Report', fn: testSubmitReport },
    { name: 'Get My Reports', fn: testGetMyReports },
    { name: 'Specialist Login', fn: testSpecialistLogin },
    { name: 'Approve Report', fn: testApproveReport },
    { name: 'Get Approved Reports', fn: testGetApprovedReports }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
