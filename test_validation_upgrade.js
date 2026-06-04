/**
 * 🧪 COMPREHENSIVE VALIDATION & LOGIC TEST
 * Test validation, auth, data integrity after upgrades
 */

require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validators = require('./backend/validators');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
  title: (msg) => console.log(`\n${colors.magenta}╔${'═'.repeat(msg.length + 2)}╗${colors.reset}\n${colors.magenta}║ ${msg} ║${colors.reset}\n${colors.magenta}╚${'═'.repeat(msg.length + 2)}╝${colors.reset}\n`)
};

let testsPassed = 0;
let testsFailed = 0;

// ═══════════════════════════════════════════════════════════════════

log.title('ADVANCED VALIDATION & LOGIC TESTING SUITE');

// TEST 1: Email Validation
async function test1EmailValidation() {
  log.section('TEST 1: Email Validation');
  try {
    const testCases = [
      { email: 'valid@example.com', expected: true, name: 'Valid email' },
      { email: 'invalid.email', expected: false, name: 'Missing @domain' },
      { email: 'test@', expected: false, name: 'Missing domain' },
      { email: '@example.com', expected: false, name: 'Missing local part' },
      { email: 'test user@example.com', expected: false, name: 'Space in email' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateEmail(tc.email);
      if (result === tc.expected) {
        log.success(`${tc.name}: "${tc.email}" → ${result}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: "${tc.email}" → Expected ${tc.expected}, got ${result}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 2: Password Validation
async function test2PasswordValidation() {
  log.section('TEST 2: Password Validation');
  try {
    const testCases = [
      { pass: '123456', expected: true, name: 'Valid password (6 chars)' },
      { pass: '12345', expected: false, name: 'Too short (5 chars)' },
      { pass: 'mySecurePassword123', expected: true, name: 'Valid strong password' },
      { pass: '', expected: false, name: 'Empty password' },
      { pass: '     ', expected: false, name: 'Only spaces' }
    ];

    testCases.forEach(tc => {
      const result = validators.validatePassword(tc.pass);
      const isValid = result.valid;
      if (isValid === tc.expected) {
        log.success(`${tc.name}: ${isValid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${isValid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 3: Faculty Validation
async function test3FacultyValidation() {
  log.section('TEST 3: Faculty Validation (TBU Faculties)');
  try {
    const validFaculties = validators.VALID_FACULTIES;
    log.info(`Valid faculties in system: ${validFaculties.length}`);
    validFaculties.forEach(f => log.info(`  • ${f}`));

    const testCases = [
      { faculty: 'Khoa Công nghệ và Kỹ thuật', expected: true, name: 'Valid faculty 1' },
      { faculty: 'Khoa Kinh tế và Quản trị', expected: true, name: 'Valid faculty 2' },
      { faculty: 'Invalid Faculty', expected: false, name: 'Invalid faculty' },
      { faculty: null, expected: true, name: 'Null (optional field)' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateFaculty(tc.faculty);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 4: Role Validation
async function test4RoleValidation() {
  log.section('TEST 4: Role Validation');
  try {
    const validRoles = validators.VALID_ROLES;
    log.info(`Valid roles: ${validRoles.join(', ')}`);

    const testCases = [
      { role: 'director', expected: true, name: 'Director role' },
      { role: 'student', expected: true, name: 'Student role' },
      { role: 'council', expected: true, name: 'Council role' },
      { role: 'superadmin', expected: false, name: 'Invalid role' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateRole(tc.role);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 5: Score Validation
async function test5ScoreValidation() {
  log.section('TEST 5: Score Validation (0-100 range)');
  try {
    const testCases = [
      { score: 50, expected: true, name: 'Valid score 50' },
      { score: 0, expected: true, name: 'Valid score 0 (minimum)' },
      { score: 100, expected: true, name: 'Valid score 100 (maximum)' },
      { score: 150, expected: false, name: 'Invalid score > 100' },
      { score: -10, expected: false, name: 'Invalid score < 0' },
      { score: null, expected: true, name: 'Null score (optional)' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateScore(tc.score);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 6: Date Format Validation
async function test6DateValidation() {
  log.section('TEST 6: Date Format Validation (YYYY-MM-DD)');
  try {
    const testCases = [
      { date: '2026-05-20', expected: true, name: 'Valid date' },
      { date: '2026-12-31', expected: true, name: 'Valid date end of year' },
      { date: '2026-01-01', expected: true, name: 'Valid date start of year' },
      { date: '20-05-2026', expected: false, name: 'Invalid format (DD-MM-YYYY)' },
      { date: '2026/05/20', expected: false, name: 'Invalid format (slashes)' },
      { date: null, expected: true, name: 'Null date (optional)' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateDateFormat(tc.date);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 7: Required Fields Validation
async function test7RequiredValidation() {
  log.section('TEST 7: Required Fields Validation');
  try {
    const testCases = [
      {
        obj: { title: 'My Topic', description: 'A description' },
        fields: ['title', 'description'],
        expected: true,
        name: 'All required fields present'
      },
      {
        obj: { title: 'My Topic' },
        fields: ['title', 'description'],
        expected: false,
        name: 'Missing required field'
      },
      {
        obj: { title: '', description: 'A description' },
        fields: ['title', 'description'],
        expected: false,
        name: 'Empty required field'
      },
      {
        obj: { title: '   ', description: 'A description' },
        fields: ['title', 'description'],
        expected: false,
        name: 'Only whitespace in required field'
      }
    ];

    testCases.forEach(tc => {
      const result = validators.validateRequired(tc.obj, tc.fields);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'OK' : 'VALIDATION_ERROR'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 8: Topic Status Validation
async function test8TopicStatusValidation() {
  log.section('TEST 8: Topic Status Validation');
  try {
    const validStatuses = validators.VALID_TOPIC_STATUS;
    log.info(`Valid topic statuses: ${validStatuses.join(', ')}`);

    const testCases = [
      { status: 'pending', expected: true, name: 'Valid status: pending' },
      { status: 'approved', expected: true, name: 'Valid status: approved' },
      { status: 'grading', expected: true, name: 'Valid status: grading' },
      { status: 'rejected', expected: true, name: 'Valid status: rejected' },
      { status: 'completed', expected: true, name: 'Valid status: completed' },
      { status: 'submitted', expected: false, name: 'Invalid status: submitted' }
    ];

    testCases.forEach(tc => {
      const result = validators.validateTopicStatus(tc.status);
      if (result.valid === tc.expected) {
        log.success(`${tc.name}: ${result.valid ? 'VALID' : 'INVALID'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.expected}, got ${result.valid}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 9: Scoring Status Check
async function test9ScoringStatusCheck() {
  log.section('TEST 9: Topic Status for Scoring Validation');
  try {
    const validStatuses = validators.TOPIC_STATUSES_FOR_SCORING;
    log.info(`Valid statuses for scoring: ${validStatuses.join(', ')}`);

    const testCases = [
      { status: 'approved', canScore: true, name: 'Can score approved topic' },
      { status: 'grading', canScore: true, name: 'Can score grading topic' },
      { status: 'pending', canScore: false, name: 'Cannot score pending topic' },
      { status: 'rejected', canScore: false, name: 'Cannot score rejected topic' },
      { status: 'completed', canScore: false, name: 'Cannot score completed topic' }
    ];

    testCases.forEach(tc => {
      const result = validators.canScoreTopic(tc.status);
      if (result === tc.canScore) {
        log.success(`${tc.name}: ${result ? 'ALLOWED' : 'NOT_ALLOWED'}`);
        testsPassed++;
      } else {
        log.error(`${tc.name}: Expected ${tc.canScore}, got ${result}`);
        testsFailed++;
      }
    });
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 10: JWT Token Generation & Validation
async function test10JWTValidation() {
  log.section('TEST 10: JWT Token Generation & Validation');
  try {
    const secret = process.env.JWT_SECRET || 'your_default_secret_key';

    // Generate token
    const payload = { id: 1, role: 'director', email: 'test@example.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    log.success('Token generated successfully');
    testsPassed++;

    // Verify token
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.id === 1 && decoded.role === 'director') {
        log.success('Token verified successfully with correct payload');
        testsPassed++;
      } else {
        log.error('Token payload mismatch');
        testsFailed++;
      }
    } catch (err) {
      log.error(`Token verification failed: ${err.message}`);
      testsFailed++;
    }

    // Test invalid token
    try {
      jwt.verify('invalid.token', secret);
      log.error('Invalid token was NOT detected');
      testsFailed++;
    } catch (err) {
      log.success('Invalid token correctly detected and rejected');
      testsPassed++;
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed++;
  }
}

// TEST 11: Database Connection
async function test11DatabaseConnection() {
  log.section('TEST 11: Database Connection & Integrity');
  try {
    const connection = await pool.getConnection();
    log.success('Database connection established');
    testsPassed++;

    // Check users table
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    log.success(`Users table accessible: ${users[0].count} users found`);
    testsPassed++;

    // Check topics table
    const [topics] = await pool.execute('SELECT COUNT(*) as count FROM topics');
    log.success(`Topics table accessible: ${topics[0].count} topics found`);
    testsPassed++;

    // Check scores table
    const [scores] = await pool.execute('SELECT COUNT(*) as count FROM scores');
    log.success(`Scores table accessible: ${scores[0].count} scores found`);
    testsPassed++;

    connection.release();
  } catch (error) {
    log.error(`Database error: ${error.message}`);
    testsFailed += 4;
  }
}

// TEST 12: Bcrypt Password Hashing
async function test12BcryptHashing() {
  log.section('TEST 12: Bcrypt Password Hashing Security');
  try {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    log.success(`Password hashed successfully: ${hashedPassword.substring(0, 30)}...`);
    testsPassed++;

    // Test correct password
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch) {
      log.success('Correct password verified successfully');
      testsPassed++;
    } else {
      log.error('Correct password verification failed');
      testsFailed++;
    }

    // Test wrong password
    const isWrong = await bcrypt.compare('wrongpassword', hashedPassword);
    if (!isWrong) {
      log.success('Wrong password correctly rejected');
      testsPassed++;
    } else {
      log.error('Wrong password incorrectly accepted');
      testsFailed++;
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
    testsFailed += 3;
  }
}

// RUN ALL TESTS
async function runAllTests() {
  try {
    await test1EmailValidation();
    await test2PasswordValidation();
    await test3FacultyValidation();
    await test4RoleValidation();
    await test5ScoreValidation();
    await test6DateValidation();
    await test7RequiredValidation();
    await test8TopicStatusValidation();
    await test9ScoringStatusCheck();
    await test10JWTValidation();
    await test11DatabaseConnection();
    await test12BcryptHashing();

    // Final Summary
    log.title('TEST SUMMARY');
    log.success(`Tests Passed: ${testsPassed}`);
    if (testsFailed > 0) {
      log.error(`Tests Failed: ${testsFailed}`);
    }

    const totalTests = testsPassed + testsFailed;
    const passRate = ((testsPassed / totalTests) * 100).toFixed(2);
    log.info(`Pass Rate: ${passRate}% (${testsPassed}/${totalTests})`);

    if (testsFailed === 0) {
      console.log(`\n${colors.green}╔════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.green}║  ✓ ALL TESTS PASSED - 100% SUCCESS ║${colors.reset}`);
      console.log(`${colors.green}╚════════════════════════════════════╝${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}╔════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.yellow}║  ⚠ SOME TESTS FAILED - FIX NEEDED  ║${colors.reset}`);
      console.log(`${colors.yellow}╚════════════════════════════════════╝${colors.reset}\n`);
    }

    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

runAllTests();
