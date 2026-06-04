/**
 * 🔍 VERIFY LOGIC UPGRADE - Kiểm tra tất cả các file được cải tiến
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}║  VERIFICATION: Logic Upgrade Implementation         ║${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

let checksPassed = 0;
let checksFailed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    checksPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    checksFailed++;
  }
}

function section(title) {
  console.log(`\n${colors.blue}${colors.bold}▶ ${title}${colors.reset}`);
}

// ═══════════════════════════════════════════════════════════════════

section('FILE EXISTENCE CHECKS');

const filesToCheck = [
  { path: 'backend/validators.js', name: 'Validators utility file' },
  { path: 'backend/middleware/authMiddleware.js', name: 'Enhanced Auth Middleware' },
  { path: 'backend/controllers/authController.js', name: 'Enhanced Auth Controller' },
  { path: 'backend/controllers/scoreController.js', name: 'Enhanced Score Controller' },
  { path: 'backend/controllers/topicController.js', name: 'Enhanced Topic Controller' },
  { path: 'test_validators_quick.js', name: 'Quick Validator Test' },
  { path: 'test_auth_improvements.js', name: 'Auth Improvements Test' },
  { path: 'test_comprehensive_upgrade.js', name: 'Comprehensive Upgrade Test' },
  { path: 'UPGRADE_SUMMARY.md', name: 'Upgrade Summary Documentation' }
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  const exists = fs.existsSync(fullPath);
  check(`${file.name}`, exists);
});

// ═══════════════════════════════════════════════════════════════════

section('VALIDATORS FILE CONTENT CHECKS');

try {
  const validatorsPath = path.join(__dirname, 'backend/validators.js');
  const validatorsContent = fs.readFileSync(validatorsPath, 'utf8');

  check('Contains validateEmail', validatorsContent.includes('validateEmail'));
  check('Contains validatePassword', validatorsContent.includes('validatePassword'));
  check('Contains validateFaculty', validatorsContent.includes('validateFaculty'));
  check('Contains validateRole', validatorsContent.includes('validateRole'));
  check('Contains validateScore', validatorsContent.includes('validateScore'));
  check('Contains validateDateFormat', validatorsContent.includes('validateDateFormat'));
  check('Contains validateRequired', validatorsContent.includes('validateRequired'));
  check('Contains validateTopicStatus', validatorsContent.includes('validateTopicStatus'));
  check('Contains canScoreTopic', validatorsContent.includes('canScoreTopic'));
  check('Exports module.exports', validatorsContent.includes('module.exports'));
  check('Defines VALID_FACULTIES', validatorsContent.includes('VALID_FACULTIES'));
  check('Defines VALID_ROLES', validatorsContent.includes('VALID_ROLES'));
  check('Defines VALID_TOPIC_STATUS', validatorsContent.includes('VALID_TOPIC_STATUS'));
} catch (e) {
  console.log(`${colors.red}Error reading validators file: ${e.message}${colors.reset}`);
  checksFailed += 13;
}

// ═══════════════════════════════════════════════════════════════════

section('AUTH MIDDLEWARE ENHANCEMENTS');

try {
  const middlewarePath = path.join(__dirname, 'backend/middleware/authMiddleware.js');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

  check('Check Bearer format validation', middlewareContent.includes('Bearer '));
  check('Token extraction logic', middlewareContent.includes('split(\' \')'));
  check('Validate required token fields', middlewareContent.includes('decoded.id'));
  check('TokenExpiredError handling', middlewareContent.includes('TokenExpiredError'));
  check('JsonWebTokenError handling', middlewareContent.includes('JsonWebTokenError'));
  check('Authorize middleware enhanced', middlewareContent.includes('authorize'));
  check('Error code standardization', middlewareContent.includes("'code'"));
  check('Prevent accessing without token', middlewareContent.includes('NO_TOKEN'));
} catch (e) {
  console.log(`${colors.red}Error reading middleware file: ${e.message}${colors.reset}`);
  checksFailed += 8;
}

// ═══════════════════════════════════════════════════════════════════

section('AUTH CONTROLLER ENHANCEMENTS');

try {
  const authPath = path.join(__dirname, 'backend/controllers/authController.js');
  const authContent = fs.readFileSync(authPath, 'utf8');

  check('Requires validators module', authContent.includes("require('../validators')"));
  check('Email validation on login', authContent.includes('validateEmail'));
  check('Password validation on login', authContent.includes('validatePassword'));
  check('Check required fields', authContent.includes('MISSING_CREDENTIALS'));
  check('Generic auth error message', authContent.includes('Email hoặc mật khẩu không chính xác'));
  check('Success response format', authContent.includes("'success': true"));
  check('Error code in response', authContent.includes("'code'"));
  check('User role validation', authContent.includes('INVALID_ROLE'));
} catch (e) {
  console.log(`${colors.red}Error reading auth controller file: ${e.message}${colors.reset}`);
  checksFailed += 8;
}

// ═══════════════════════════════════════════════════════════════════

section('SCORE CONTROLLER ENHANCEMENTS');

try {
  const scorePath = path.join(__dirname, 'backend/controllers/scoreController.js');
  const scoreContent = fs.readFileSync(scorePath, 'utf8');

  check('Requires validators', scoreContent.includes("require('../validators')"));
  check('Validate required fields', scoreContent.includes('validateRequired'));
  check('Validate score values', scoreContent.includes('validateScore'));
  check('Check canScoreTopic', scoreContent.includes('canScoreTopic'));
  check('Validate topic exists', scoreContent.includes('TOPIC_NOT_FOUND'));
  check('Check council assignment', scoreContent.includes('NOT_ASSIGNED'));
  check('Topic status validation', scoreContent.includes('INVALID_TOPIC_STATUS'));
  check('Error code responses', scoreContent.includes("'code'"));
  check('Success response format', scoreContent.includes("'success': true"));
} catch (e) {
  console.log(`${colors.red}Error reading score controller file: ${e.message}${colors.reset}`);
  checksFailed += 9;
}

// ═══════════════════════════════════════════════════════════════════

section('TOPIC CONTROLLER ENHANCEMENTS');

try {
  const topicPath = path.join(__dirname, 'backend/controllers/topicController.js');
  const topicContent = fs.readFileSync(topicPath, 'utf8');

  check('Requires validators', topicContent.includes("require('../validators')"));
  check('Validate faculty in filters', topicContent.includes('validateFaculty'));
  check('Validate date format', topicContent.includes('validateDateFormat'));
  check('Validate required fields', topicContent.includes('validateRequired'));
  check('Check instructor exists', topicContent.includes('INVALID_INSTRUCTOR'));
  check('Check campaign exists', topicContent.includes('INVALID_CAMPAIGN'));
  check('Check topic ownership', topicContent.includes('UNAUTHORIZED'));
  check('Success response format', topicContent.includes("'success': true"));
  check('Error code responses', topicContent.includes("'code'"));
} catch (e) {
  console.log(`${colors.red}Error reading topic controller file: ${e.message}${colors.reset}`);
  checksFailed += 9;
}

// ═══════════════════════════════════════════════════════════════════

section('TEST SUITES AVAILABILITY');

try {
  const tests = [
    { path: 'test_validators_quick.js', keyword: 'validateEmail' },
    { path: 'test_auth_improvements.js', keyword: 'JWT' },
    { path: 'test_comprehensive_upgrade.js', keyword: 'INPUT VALIDATION' }
  ];

  tests.forEach(test => {
    const testPath = path.join(__dirname, test.path);
    if (fs.existsSync(testPath)) {
      const content = fs.readFileSync(testPath, 'utf8');
      check(`${test.path} contains test logic`, content.includes(test.keyword));
    } else {
      check(`${test.path} exists`, false);
    }
  });
} catch (e) {
  console.log(`${colors.red}Error checking test files: ${e.message}${colors.reset}`);
  checksFailed += 3;
}

// ═══════════════════════════════════════════════════════════════════

section('DOCUMENTATION CHECKS');

try {
  const docPath = path.join(__dirname, 'UPGRADE_SUMMARY.md');
  if (fs.existsSync(docPath)) {
    const docContent = fs.readFileSync(docPath, 'utf8');

    check('UPGRADE_SUMMARY.md exists', true);
    check('Documents validators framework', docContent.includes('validators.js'));
    check('Documents auth improvements', docContent.includes('Authentication'));
    check('Documents error standardization', docContent.includes('ERROR_CODE'));
    check('Includes before/after comparison', docContent.includes('Before'));
    check('Lists all test suites', docContent.includes('test_'));
    check('Provides usage examples', docContent.includes('```'));
  } else {
    check('UPGRADE_SUMMARY.md exists', false);
  }
} catch (e) {
  console.log(`${colors.red}Error checking documentation: ${e.message}${colors.reset}`);
  checksFailed += 6;
}

// ═══════════════════════════════════════════════════════════════════

console.log(`\n${colors.cyan}${'═'.repeat(55)}${colors.reset}`);
console.log(`${colors.bold}Verification Summary:${colors.reset}`);
console.log(`  ${colors.green}✓ Checks Passed: ${checksPassed}${colors.reset}`);
console.log(`  ${colors.red}✗ Checks Failed: ${checksFailed}${colors.reset}`);
console.log(`  ${colors.blue}Total: ${checksPassed + checksFailed}${colors.reset}`);

const percentage = ((checksPassed / (checksPassed + checksFailed)) * 100).toFixed(1);
console.log(`  ${colors.bold}Success Rate: ${percentage}%${colors.reset}`);
console.log(`${colors.cyan}${'═'.repeat(55)}${colors.reset}\n`);

if (checksFailed === 0) {
  console.log(`${colors.green}${colors.bold}✨ ALL VERIFICATION CHECKS PASSED! ✨${colors.reset}\n`);
  console.log(`${colors.green}The logic upgrade is complete and ready for testing.${colors.reset}\n`);
  console.log(`${colors.blue}Next steps:${colors.reset}`);
  console.log(`  1. Run: node test_validators_quick.js`);
  console.log(`  2. Run: node test_auth_improvements.js`);
  console.log(`  3. Run: node test_comprehensive_upgrade.js\n`);
} else {
  console.log(`${colors.red}${colors.bold}⚠️ SOME CHECKS FAILED - REVIEW REQUIRED${colors.reset}\n`);
  console.log(`${colors.yellow}Please verify the implementation files match the upgrade requirements.${colors.reset}\n`);
}

process.exit(checksFailed > 0 ? 1 : 0);
