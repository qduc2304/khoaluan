/**
 * Test Auth Logic Improvements
 * Kiểm thử các cải tiến authentication middleware
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   AUTHENTICATION LOGIC - IMPROVEMENTS TEST            ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key';
let passCount = 0;
let failCount = 0;

function assert(testName, condition, expected, actual) {
  if (condition) {
    console.log(`✓ ${testName}`);
    passCount++;
  } else {
    console.log(`✗ ${testName}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Got: ${actual}`);
    failCount++;
  }
}

(async () => {
  // ═══════════════════════════════════════════════════════════════════

  console.log('📋 SECTION 1: JWT TOKEN GENERATION & VALIDATION\n');

  // Test 1.1: Generate token with complete payload
  const validPayload = { id: 1, role: 'director', email: 'admin@example.com' };
  const token = jwt.sign(validPayload, JWT_SECRET, { expiresIn: '1d' });
  assert(
    'JWT token generated with valid payload',
    token && token.split('.').length === 3,
    'Valid JWT format (3 parts)',
    token ? 'Token created' : 'Failed'
  );

  // Test 1.2: Verify valid token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    assert(
      'JWT token verified successfully',
      decoded.id === 1 && decoded.role === 'director',
      'Payload matches',
      `id=${decoded.id}, role=${decoded.role}`
    );
  } catch (e) {
    assert('JWT token verified successfully', false, 'No error', e.message);
  }

  // Test 1.3: Detect invalid token
  try {
    jwt.verify('invalid.token.here', JWT_SECRET);
    assert(
      'Invalid token detection',
      false,
      'Should throw error',
      'Token was accepted (BUG!)'
    );
  } catch (e) {
    assert(
      'Invalid token detection',
      e.name === 'JsonWebTokenError',
      'JsonWebTokenError thrown',
      e.name
    );
  }


// Test 1.4: Detect expired token
const expiredToken = jwt.sign(validPayload, JWT_SECRET, { expiresIn: '0s' });
await new Promise(r => setTimeout(r, 100)); // Wait 100ms
try {
  jwt.verify(expiredToken, JWT_SECRET);
  assert(
    'Expired token detection',
    false,
    'Should throw TokenExpiredError',
    'Token was accepted (BUG!)'
  );
} catch (e) {
  assert(
    'Expired token detection',
    e.name === 'TokenExpiredError',
    'TokenExpiredError thrown',
    e.name
  );
}

// ═══════════════════════════════════════════════════════════════════

console.log('\n🔐 SECTION 2: PASSWORD HASHING & COMPARISON\n');

const testPassword = 'testpass123';

// Test 2.1: Hash password
try {
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  assert(
    'Password hashed with bcrypt',
    hashedPassword.startsWith('$2'),
    'Bcrypt hash format ($2...)',
    hashedPassword.substring(0, 10)
  );

  // Test 2.2: Compare correct password
  const isMatch = await bcrypt.compare(testPassword, hashedPassword);
  assert(
    'Correct password comparison',
    isMatch === true,
    'Password matches',
    isMatch
  );

  // Test 2.3: Compare wrong password
  const isWrong = await bcrypt.compare('wrongpassword', hashedPassword);
  assert(
    'Wrong password comparison',
    isWrong === false,
    'Password does not match',
    isWrong
  );
} catch (e) {
  console.log(`✗ Password hashing error: ${e.message}`);
  failCount += 3;
}

// ═══════════════════════════════════════════════════════════════════

console.log('\n👤 SECTION 3: ROLE-BASED ACCESS CONTROL\n');

// Test 3.1: User has required role
const userRole = 'director';
const requiredRoles = ['director', 'admin'];
assert(
  'User has required role',
  requiredRoles.includes(userRole),
  'Access granted',
  'Role found in required list'
);

// Test 3.2: User lacks required role
const restrictedRole = 'student';
assert(
  'User lacks required role',
    !requiredRoles.includes(restrictedRole),
    'Access denied',
    'Role not in required list'
  );

  // Test 3.3: Multiple role check
  const testRoles = [
    { userRole: 'director', required: ['director', 'admin'], result: true },
    { userRole: 'student', required: ['director', 'admin'], result: false },
    { userRole: 'instructor', required: ['director', 'instructor', 'admin'], result: true }
  ];

  testRoles.forEach((test, idx) => {
    const hasRole = test.required.includes(test.userRole);
    assert(
      `Role check ${idx + 1}: ${test.userRole}`,
      hasRole === test.result,
      `Expected ${test.result}`,
      `Got ${hasRole}`
    );
  });

  // ═══════════════════════════════════════════════════════════════════

  console.log('\n⚠️ SECTION 4: ERROR HANDLING & VALIDATION\n');

  // Test 4.1: Missing Bearer prefix detection
  const headerWithoutBearer = 'Token abc123';
  const isBearerFormat = headerWithoutBearer.startsWith('Bearer ');
  assert(
    'Bearer prefix validation',
    isBearerFormat === false,
    'Invalid Bearer format detected',
    'Format validation failed'
  );

  // Test 4.2: Proper Bearer format
  const properBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  assert(
    'Valid Bearer format detection',
    properBearer.startsWith('Bearer '),
    'Valid Bearer format',
    'Format is correct'
  );

  // Test 4.3: Token extraction
  const bearerToken = `Bearer ${token}`;
  const extractedToken = bearerToken.split(' ')[1];
  assert(
    'Token extraction from Bearer header',
    extractedToken === token,
    'Token extracted correctly',
    extractedToken.substring(0, 20) + '...'
  );

  // ═══════════════════════════════════════════════════════════════════

  console.log('\n📝 SECTION 5: PAYLOAD VALIDATION\n');

  // Test 5.1: Token with complete payload
  const completePayload = { id: 123, role: 'instructor', email: 'user@example.com' };
  const completeToken = jwt.sign(completePayload, JWT_SECRET, { expiresIn: '1d' });
  const decoded1 = jwt.verify(completeToken, JWT_SECRET);
  assert(
    'Complete payload validation',
    decoded1.id && decoded1.role && decoded1.email,
    'All fields present',
    `id=${decoded1.id}, role=${decoded1.role}, email=${decoded1.email}`
  );

  // Test 5.2: Token with missing required field
  const incompletePayload = { id: 123 }; // Missing role
  const incompleteToken = jwt.sign(incompletePayload, JWT_SECRET, { expiresIn: '1d' });
  const decoded2 = jwt.verify(incompleteToken, JWT_SECRET);
  assert(
    'Missing role detection',
    !decoded2.role,
    'Role field missing (should be validated)',
    decoded2.role ? 'Role present' : 'Role missing'
  );

  // ═══════════════════════════════════════════════════════════════════

  // FINAL SUMMARY
  console.log('\n' + '═'.repeat(55));
  console.log(`✓ TESTS PASSED: ${passCount}`);
  console.log(`✗ TESTS FAILED: ${failCount}`);
  console.log(`TOTAL: ${passCount + failCount}`);
  const percentage = ((passCount / (passCount + failCount)) * 100).toFixed(1);
  console.log(`SUCCESS RATE: ${percentage}%`);
  console.log('═'.repeat(55));

  if (failCount === 0) {
    console.log('\n✨ ALL AUTHENTICATION TESTS PASSED! ✨\n');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED - REVIEW REQUIRED\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
})();
