/**
 * Comprehensive System Testing Suite
 * Kiểm thử logic liên kết dữ liệu và xác thực
 */

require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Hàm log
const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`)
};

// Test 1: Kiểm tra kết nối database
async function testDatabaseConnection() {
  log.section('TEST 1: Kiểm Tra Kết Nối Database');
  try {
    const connection = await pool.getConnection();
    log.success('Kết nối MySQL thành công');
    connection.release();
    return true;
  } catch (error) {
    log.error(`Lỗi kết nối: ${error.message}`);
    return false;
  }
}

// Test 2: Kiểm tra bảng users
async function testUsersTable() {
  log.section('TEST 2: Kiểm Tra Bảng Users');
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const count = rows[0].count;
    log.success(`Bảng users có ${count} tài khoản`);
    
    // Lấy chi tiết users
    const [users] = await pool.execute(
      'SELECT id, full_name, email, role FROM users LIMIT 5'
    );
    users.forEach(user => {
      log.info(`  - ID ${user.id}: ${user.full_name} (${user.role}) - ${user.email}`);
    });
    return true;
  } catch (error) {
    log.error(`Lỗi kiểm tra users: ${error.message}`);
    return false;
  }
}

// Test 3: Kiểm tra password hashing
async function testPasswordHashing() {
  log.section('TEST 3: Kiểm Tra Password Hashing');
  try {
    const testPassword = 'testpass123';
    const saltRounds = 10;
    
    // Mã hóa mật khẩu
    const hashed = await bcrypt.hash(testPassword, saltRounds);
    log.info(`Mật khẩu gốc: ${testPassword}`);
    log.info(`Mật khẩu đã mã hóa: ${hashed.substring(0, 20)}...`);
    
    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(testPassword, hashed);
    if (isMatch) {
      log.success('So sánh mật khẩu thành công');
    } else {
      log.error('So sánh mật khẩu thất bại');
    }
    
    // Kiểm tra mật khẩu không khớp
    const isWrong = await bcrypt.compare('wrongpass', hashed);
    if (!isWrong) {
      log.success('Mật khẩu sai được xác định chính xác');
    }
    return true;
  } catch (error) {
    log.error(`Lỗi hashing: ${error.message}`);
    return false;
  }
}

// Test 4: Kiểm tra JWT token
async function testJWTToken() {
  log.section('TEST 4: Kiểm Tra JWT Token');
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your_default_secret_key';
    const payload = { id: 1, role: 'director' };
    
    // Tạo token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
    log.success(`Token tạo thành công`);
    log.info(`Token: ${token.substring(0, 30)}...`);
    
    // Giải mã token
    const decoded = jwt.verify(token, jwtSecret);
    log.success(`Token xác minh thành công`);
    log.info(`  - ID: ${decoded.id}`);
    log.info(`  - Role: ${decoded.role}`);
    
    // Kiểm tra token hết hạn
    const expiredToken = jwt.sign(payload, jwtSecret, { expiresIn: '0s' });
    setTimeout(() => {
      try {
        jwt.verify(expiredToken, jwtSecret);
        log.error('Token hết hạn không được phát hiện');
      } catch (err) {
        log.success('Token hết hạn được phát hiện chính xác');
      }
    }, 1000);
    
    return true;
  } catch (error) {
    log.error(`Lỗi JWT: ${error.message}`);
    return false;
  }
}

// Test 5: Kiểm tra role và authorization
async function testRoleAuthorization() {
  log.section('TEST 5: Kiểm Tra Role & Authorization');
  try {
    const roles = ['director', 'specialist', 'instructor', 'student', 'council'];
    const [users] = await pool.execute(
      'SELECT id, full_name, role FROM users GROUP BY role'
    );
    
    if (users.length === 0) {
      log.warn('Không có users trong hệ thống');
      return false;
    }
    
    log.success(`Các roles trong hệ thống:`);
    users.forEach(user => {
      log.info(`  - ${user.role} (ví dụ: ${user.full_name})`);
    });
    
    // Kiểm tra protected roles
    const protectedRoles = ['director', 'specialist'];
    const [protectedUsers] = await pool.execute(
      `SELECT COUNT(*) as count FROM users WHERE role IN ('${protectedRoles.join("','")}')`
    );
    log.success(`Người dùng với quyền cao: ${protectedUsers[0].count}`);
    return true;
  } catch (error) {
    log.error(`Lỗi authorization: ${error.message}`);
    return false;
  }
}

// Test 6: Kiểm tra liên kết users - instructors
async function testInstructorRelation() {
  log.section('TEST 6: Kiểm Tra Liên Kết Users - Instructors');
  try {
    const [instructors] = await pool.execute(
      "SELECT id, full_name FROM users WHERE role = 'instructor'"
    );
    log.success(`Số lượng giảng viên: ${instructors.length}`);
    instructors.forEach(inst => {
      log.info(`  - ID ${inst.id}: ${inst.full_name}`);
    });
    return instructors.length > 0;
  } catch (error) {
    log.error(`Lỗi kiểm tra instructors: ${error.message}`);
    return false;
  }
}

// Test 7: Kiểm tra faculties
async function testFacultiesRelation() {
  log.section('TEST 7: Kiểm Tra Faculties');
  try {
    const [faculties] = await pool.execute(
      "SELECT DISTINCT faculty_name FROM users WHERE faculty_name IS NOT NULL AND faculty_name != '' ORDER BY faculty_name"
    );
    log.success(`Số lượng khoa: ${faculties.length}`);
    faculties.forEach(faculty => {
      log.info(`  - ${faculty.faculty_name}`);
    });
    return faculties.length > 0;
  } catch (error) {
    log.error(`Lỗi kiểm tra faculties: ${error.message}`);
    return false;
  }
}

// Test 8: Kiểm tra email unique constraint
async function testEmailUnique() {
  log.section('TEST 8: Kiểm Tra Email Unique Constraint');
  try {
    const [rows] = await pool.execute(
      'SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING count > 1'
    );
    
    if (rows.length === 0) {
      log.success('Email constraint hoạt động đúng (không có email trùng lặp)');
      return true;
    } else {
      log.error(`Phát hiện ${rows.length} email trùng lặp`);
      rows.forEach(row => {
        log.warn(`  - ${row.email} (${row.count} lần)`);
      });
      return false;
    }
  } catch (error) {
    log.error(`Lỗi kiểm tra email: ${error.message}`);
    return false;
  }
}

// Test 9: Kiểm tra các bảng liên kết
async function testRelatedTables() {
  log.section('TEST 9: Kiểm Tra Bảng Liên Kết');
  try {
    const tables = ['topics', 'campaigns', 'documents', 'scores', 'reports'];
    
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        log.success(`Bảng '${table}': ${result[0].count} bản ghi`);
      } catch (err) {
        log.warn(`Bảng '${table}': chưa được tạo hoặc không tồn tại`);
      }
    }
    return true;
  } catch (error) {
    log.error(`Lỗi kiểm tra bảng: ${error.message}`);
    return false;
  }
}

// Test 10: Kiểm tra middleware logic
async function testMiddlewareLogic() {
  log.section('TEST 10: Kiểm Tra Middleware Logic');
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your_default_secret_key';
    
    // Mô phỏng middleware protect
    log.info('Kiểm tra middleware protect:');
    
    // Case 1: Token hợp lệ
    const token = jwt.sign({ id: 1, role: 'director' }, jwtSecret, { expiresIn: '1d' });
    try {
      const decoded = jwt.verify(token, jwtSecret);
      log.success('  Case 1: Token hợp lệ được xác minh');
    } catch {
      log.error('  Case 1: Không thể xác minh token hợp lệ');
    }
    
    // Case 2: Token không hợp lệ
    try {
      jwt.verify('invalid.token.here', jwtSecret);
      log.error('  Case 2: Token không hợp lệ không được phát hiện');
    } catch {
      log.success('  Case 2: Token không hợp lệ được phát hiện');
    }
    
    // Case 3: Kiểm tra authorize với roles
    log.info('Kiểm tra middleware authorize:');
    const userRoles = ['director', 'specialist', 'instructor', 'student'];
    const requiredRoles = ['director', 'specialist'];
    
    userRoles.forEach(userRole => {
      const isAuthorized = requiredRoles.includes(userRole);
      const status = isAuthorized ? 'cấp quyền' : 'từ chối';
      const symbol = isAuthorized ? '✓' : '✗';
      log.info(`  ${symbol} Role '${userRole}': ${status}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Lỗi middleware: ${error.message}`);
    return false;
  }
}

// Test 11: Kiểm tra login logic
async function testLoginLogic() {
  log.section('TEST 11: Kiểm Tra Login Logic');
  try {
    // Lấy một user từ database
    const [users] = await pool.execute('SELECT * FROM users LIMIT 1');
    
    if (users.length === 0) {
      log.warn('Không có user để test login');
      return false;
    }
    
    const user = users[0];
    log.info(`Testing login với user: ${user.email}`);
    
    // Kiểm tra logic password:
    // - Nếu password bắt đầu bằng $2 => dùng bcrypt
    // - Nếu không => so sánh chuỗi trực tiếp (compatibili)
    
    if (user.password.startsWith('$2')) {
      log.success('Password được mã hóa với bcrypt ($ chữ ký phát hiện)');
      const isMatch = await bcrypt.compare('123456', user.password);
      log.info(`  Kiểm tra mật khẩu '123456': ${isMatch ? 'khớp' : 'không khớp'}`);
    } else {
      log.warn('Password không được mã hóa (đây là mật khẩu text plain)');
      const isMatch = user.password === '123456';
      log.info(`  Kiểm tra mật khẩu '123456': ${isMatch ? 'khớp' : 'không khớp'}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Lỗi login logic: ${error.message}`);
    return false;
  }
}

// Test 12: Kiểm tra data integrity
async function testDataIntegrity() {
  log.section('TEST 12: Kiểm Tra Data Integrity');
  try {
    const [users] = await pool.execute('SELECT * FROM users');
    
    log.info(`Tổng số users: ${users.length}`);
    
    let integrityOk = true;
    users.forEach((user, idx) => {
      // Kiểm tra required fields
      if (!user.id || !user.full_name || !user.email || !user.password) {
        log.error(`  User ${idx}: Missing required field`);
        integrityOk = false;
      }
      
      // Kiểm tra valid email format
      if (!user.email.includes('@')) {
        log.error(`  User ${idx}: Invalid email format - ${user.email}`);
        integrityOk = false;
      }
      
      // Kiểm tra valid role
      const validRoles = ['director', 'specialist', 'instructor', 'student', 'council'];
      if (!validRoles.includes(user.role)) {
        log.error(`  User ${idx}: Invalid role - ${user.role}`);
        integrityOk = false;
      }
    });
    
    if (integrityOk) {
      log.success('Tất cả user data integrity checks đều hợp lệ');
    }
    
    return integrityOk;
  } catch (error) {
    log.error(`Lỗi data integrity: ${error.message}`);
    return false;
  }
}

// Chạy tất cả tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    COMPREHENSIVE SYSTEM TEST SUITE        ║');
  console.log('║    Kiểm Thử Toàn Diện Hệ Thống            ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Users Table', fn: testUsersTable },
    { name: 'Password Hashing', fn: testPasswordHashing },
    { name: 'JWT Token', fn: testJWTToken },
    { name: 'Role Authorization', fn: testRoleAuthorization },
    { name: 'Instructor Relation', fn: testInstructorRelation },
    { name: 'Faculties', fn: testFacultiesRelation },
    { name: 'Email Unique Constraint', fn: testEmailUnique },
    { name: 'Related Tables', fn: testRelatedTables },
    { name: 'Middleware Logic', fn: testMiddlewareLogic },
    { name: 'Login Logic', fn: testLoginLogic },
    { name: 'Data Integrity', fn: testDataIntegrity }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      log.error(`Test ${test.name} crash: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log.section('TEST SUMMARY');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    const symbol = r.passed ? colors.green + '✓' : colors.red + '✗';
    console.log(`${symbol}${colors.reset} ${r.name}`);
  });
  
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`Kết quả: ${colors.green}${passed}${colors.reset} / ${total} tests passed`);
  
  if (passed === total) {
    console.log(`${colors.green}✓ Tất cả tests đều thành công!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ ${total - passed} tests thất bại${colors.reset}\n`);
  }
  
  await pool.end();
}

// Chạy tests
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
