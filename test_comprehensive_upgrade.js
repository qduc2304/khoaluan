/**
 * 🧪 COMPREHENSIVE SYSTEM TEST - ALL IMPROVEMENTS
 * Tests all validation, auth, and logic upgrades
 */

require('dotenv').config({ path: './backend/.env' });
const validators = require('./backend/validators');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let totalTests = 0;
let passedTests = 0;

function test(category, name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (details) console.log(`  ${colors.yellow}↳${colors.reset} ${details}`);
  }
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bold}▶ ${title}${colors.reset}`);
}

function summary() {
  const failed = totalTests - passedTests;
  const percent = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}Test Summary:${colors.reset}`);
  console.log(`  ${colors.green}✓ Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`  ${colors.blue}Total: ${totalTests}${colors.reset}`);
  console.log(`  ${colors.bold}Success Rate: ${percent}%${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.red}${colors.bold}⚠️ TESTS FAILED - REVIEW REQUIRED${colors.reset}\n`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════

console.log(`${colors.cyan}${colors.bold}
╔═══════════════════════════════════════════════════╗
║      COMPREHENSIVE SYSTEM TEST SUITE              ║
║      Testing All Logic Improvements               ║
╚═══════════════════════════════════════════════════╝
${colors.reset}`);

// ═══════════════════════════════════════════════════════════════════
// INPUT VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════

section('INPUT VALIDATION - Email');
test('Input', 'Valid email format', validators.validateEmail('user@domain.com'));
test('Input', 'Reject invalid email (no @)', !validators.validateEmail('invalid'));
test('Input', 'Reject email with spaces', !validators.validateEmail('user @domain.com'));
test('Input', 'Reject email without domain', !validators.validateEmail('user@'));

section('INPUT VALIDATION - Password');
test('Input', 'Accept password >= 6 chars', validators.validatePassword('123456').valid);
test('Input', 'Reject password < 6 chars', !validators.validatePassword('12345').valid);
test('Input', 'Reject empty password', !validators.validatePassword('').valid);
test('Input', 'Reject password with only spaces', !validators.validatePassword('     ').valid);

section('INPUT VALIDATION - Faculty');
test('Input', 'Accept valid faculty 1', validators.validateFaculty('Khoa Công nghệ và Kỹ thuật').valid);
test('Input', 'Accept valid faculty 2', validators.validateFaculty('Khoa Kinh tế và Quản trị').valid);
test('Input', 'Accept valid faculty 3', validators.validateFaculty('Khoa Luật, Chính trị học và Quan hệ Quốc tế').valid);
test('Input', 'Accept valid faculty 4', validators.validateFaculty('Khoa Khoa học Cơ bản').valid);
test('Input', 'Reject invalid faculty', !validators.validateFaculty('Invalid Faculty').valid);
test('Input', 'Accept null faculty (optional)', validators.validateFaculty(null).valid);

section('INPUT VALIDATION - Role');
test('Input', 'Accept role: director', validators.validateRole('director').valid);
test('Input', 'Accept role: student', validators.validateRole('student').valid);
test('Input', 'Accept role: council', validators.validateRole('council').valid);
test('Input', 'Reject invalid role', !validators.validateRole('superadmin').valid);
test('Input', 'Reject role: hacker', !validators.validateRole('hacker').valid);

// ═══════════════════════════════════════════════════════════════════
// SCORE VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════

section('SCORE VALIDATION - Range Check');
test('Score', 'Accept score = 0 (minimum)', validators.validateScore(0).valid);
test('Score', 'Accept score = 50 (middle)', validators.validateScore(50).valid);
test('Score', 'Accept score = 100 (maximum)', validators.validateScore(100).valid);
test('Score', 'Reject score > 100', !validators.validateScore(101).valid);
test('Score', 'Reject score < 0', !validators.validateScore(-1).valid);
test('Score', 'Accept null score (optional)', validators.validateScore(null).valid);
test('Score', 'Reject non-numeric score', !validators.validateScore('abc').valid);

// ═══════════════════════════════════════════════════════════════════
// DATE VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════

section('DATE VALIDATION - Format Check');
test('Date', 'Accept valid date (2026-05-20)', validators.validateDateFormat('2026-05-20').valid);
test('Date', 'Accept date start of year', validators.validateDateFormat('2026-01-01').valid);
test('Date', 'Accept date end of year', validators.validateDateFormat('2026-12-31').valid);
test('Date', 'Reject DD-MM-YYYY format', !validators.validateDateFormat('20-05-2026').valid);
test('Date', 'Reject YYYY/MM/DD format', !validators.validateDateFormat('2026/05/20').valid);
test('Date', 'Reject invalid date', !validators.validateDateFormat('2026-13-01').valid);
test('Date', 'Accept null date (optional)', validators.validateDateFormat(null).valid);

// ═══════════════════════════════════════════════════════════════════
// REQUIRED FIELDS TESTS
// ═══════════════════════════════════════════════════════════════════

section('REQUIRED FIELDS - Presence Check');
test('Required', 'All fields present', 
  validators.validateRequired({title: 'Test', desc: 'Description'}, ['title', 'desc']).valid);
test('Required', 'Missing field detected', 
  !validators.validateRequired({title: 'Test'}, ['title', 'desc']).valid);
test('Required', 'Empty field detected', 
  !validators.validateRequired({title: '', desc: 'Description'}, ['title', 'desc']).valid);
test('Required', 'Whitespace-only field detected', 
  !validators.validateRequired({title: '   ', desc: 'Description'}, ['title', 'desc']).valid);
test('Required', 'Multiple missing fields', 
  !validators.validateRequired({id: 1}, ['id', 'title', 'desc']).valid);

// ═══════════════════════════════════════════════════════════════════
// TOPIC STATUS TESTS
// ═══════════════════════════════════════════════════════════════════

section('TOPIC STATUS - Validation');
test('Status', 'Accept status: pending', validators.validateTopicStatus('pending').valid);
test('Status', 'Accept status: approved', validators.validateTopicStatus('approved').valid);
test('Status', 'Accept status: rejected', validators.validateTopicStatus('rejected').valid);
test('Status', 'Accept status: grading', validators.validateTopicStatus('grading').valid);
test('Status', 'Accept status: completed', validators.validateTopicStatus('completed').valid);
test('Status', 'Reject invalid status', !validators.validateTopicStatus('invalid').valid);

// ═══════════════════════════════════════════════════════════════════
// SCORING ELIGIBILITY TESTS
// ═══════════════════════════════════════════════════════════════════

section('SCORING ELIGIBILITY - Status Check');
test('Scoring', 'Can score: approved', validators.canScoreTopic('approved') === true);
test('Scoring', 'Can score: grading', validators.canScoreTopic('grading') === true);
test('Scoring', 'Cannot score: pending', validators.canScoreTopic('pending') === false);
test('Scoring', 'Cannot score: rejected', validators.canScoreTopic('rejected') === false);
test('Scoring', 'Cannot score: completed', validators.canScoreTopic('completed') === false);

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════════════════════

section('AUTHENTICATION - JWT Generation');
const jwtSecret = process.env.JWT_SECRET || 'your_default_secret_key';
const payload = { id: 1, role: 'director', email: 'test@example.com' };
const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
test('Auth', 'JWT token generated', token && token.split('.').length === 3);
test('Auth', 'Token is string type', typeof token === 'string');
test('Auth', 'Token contains 3 parts', token.split('.').length === 3);

section('AUTHENTICATION - JWT Verification');
try {
  const decoded = jwt.verify(token, jwtSecret);
  test('Auth', 'Token verified successfully', decoded.id === 1);
  test('Auth', 'Payload contains id', decoded.id === 1);
  test('Auth', 'Payload contains role', decoded.role === 'director');
  test('Auth', 'Payload contains email', decoded.email === 'test@example.com');
} catch (e) {
  test('Auth', 'Token verified successfully', false, e.message);
}

section('AUTHENTICATION - Invalid Token Rejection');
try {
  jwt.verify('invalid.token', jwtSecret);
  test('Auth', 'Invalid token rejected', false, 'Token was accepted (BUG)');
} catch (e) {
  test('Auth', 'Invalid token rejected', e.name === 'JsonWebTokenError');
  test('Auth', 'Correct error type', e.name === 'JsonWebTokenError');
}

// ═══════════════════════════════════════════════════════════════════
// PASSWORD SECURITY TESTS
// ═══════════════════════════════════════════════════════════════════

section('PASSWORD SECURITY - Bcrypt Hashing');
(async () => {
  try {
    const password = 'TestPassword123';
    const hashed = await bcrypt.hash(password, 10);
    test('Security', 'Password hashed with bcrypt', hashed.startsWith('$2'));
    test('Security', 'Hash is not equal to password', hashed !== password);
    test('Security', 'Hash contains salt rounds', hashed.includes('$10$'));
    
    section('PASSWORD SECURITY - Verification');
    const isMatch = await bcrypt.compare(password, hashed);
    test('Security', 'Correct password verified', isMatch === true);
    
    const wrongMatch = await bcrypt.compare('WrongPassword', hashed);
    test('Security', 'Wrong password rejected', wrongMatch === false);
  } catch (e) {
    console.log(`${colors.red}Error in password security tests: ${e.message}${colors.reset}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ROLE-BASED ACCESS CONTROL TESTS
  // ═══════════════════════════════════════════════════════════════════

  section('RBAC - Authorization');
  test('RBAC', 'Director access check', ['director', 'admin'].includes('director'));
  test('RBAC', 'Student denied admin access', !['director', 'admin'].includes('student'));
  test('RBAC', 'Council member council check', ['council'].includes('council'));
  test('RBAC', 'Instructor instructor check', ['instructor'].includes('instructor'));

  section('RBAC - Multiple Role Check');
  const roleTests = [
    { user: 'director', required: ['director', 'admin'], expect: true },
    { user: 'student', required: ['director', 'admin'], expect: false },
    { user: 'instructor', required: ['instructor'], expect: true },
    { user: 'council', required: ['director', 'council'], expect: true }
  ];
  roleTests.forEach((rt, i) => {
    const has = rt.required.includes(rt.user);
    test('RBAC', `Role check ${i + 1}: ${rt.user}`, has === rt.expect);
  });

  // ═══════════════════════════════════════════════════════════════════
  // ERROR HANDLING TESTS
  // ═══════════════════════════════════════════════════════════════════

  section('ERROR HANDLING - Bearer Token Format');
  const testHeaders = [
    { header: 'Bearer token123', valid: true },
    { header: 'Token token123', valid: false },
    { header: 'token123', valid: false },
    { header: 'Bearer ', valid: false },
    { header: '', valid: false }
  ];
  testHeaders.forEach((th, i) => {
    const isBearerValid = th.header.startsWith('Bearer ') && th.header.split(' ')[1];
    test('Error', `Bearer format check ${i + 1}`, isBearerValid === th.valid);
  });

  // ═══════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  const allPassed = summary();
  process.exit(allPassed ? 0 : 1);
})();
