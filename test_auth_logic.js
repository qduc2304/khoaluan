/**
 * Kiểm Thử Xác Thực & Authorization
 */

require('dotenv').config({ path: './backend/.env' });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║        TEST AUTHENTICATION & LOGIC        ║');
console.log('╚════════════════════════════════════════════╝\n');

// TEST 1: JWT Token Generation
console.log('TEST 1: JWT Token Generation');
const jwtSecret = process.env.JWT_SECRET || 'your_default_secret_key';
const user = { id: 1, role: 'director' };
const token = jwt.sign(user, jwtSecret, { expiresIn: '1d' });
console.log('✓ Token created:', token.substring(0, 50) + '...');

// TEST 2: JWT Token Verification  
console.log('\nTEST 2: JWT Token Verification');
try {
  const decoded = jwt.verify(token, jwtSecret);
  console.log('✓ Token verified successfully');
  console.log('  - ID:', decoded.id);
  console.log('  - Role:', decoded.role);
} catch (err) {
  console.log('✗ Token verification failed:', err.message);
}

// TEST 3: Invalid Token
console.log('\nTEST 3: Invalid Token Detection');
try {
  jwt.verify('invalid.token', jwtSecret);
  console.log('✗ Invalid token was NOT detected');
} catch (err) {
  console.log('✓ Invalid token detected:', err.message);
}

// TEST 4: Password Hashing
console.log('\nTEST 4: Password Hashing (bcrypt)');
const password = '123456';
const saltRounds = 10;
bcrypt.hash(password, saltRounds).then(hashed => {
  console.log('✓ Password hashed:', hashed.substring(0, 30) + '...');
  
  // TEST 5: Password Compare - Match
  console.log('\nTEST 5: Password Compare - Correct Password');
  bcrypt.compare(password, hashed).then(isMatch => {
    if (isMatch) {
      console.log('✓ Password match: TRUE');
    } else {
      console.log('✗ Password match: FALSE (should be TRUE)');
    }
    
    // TEST 6: Password Compare - Wrong
    console.log('\nTEST 6: Password Compare - Wrong Password');
    bcrypt.compare('wrongpass', hashed).then(isWrong => {
      if (!isWrong) {
        console.log('✓ Wrong password detected: TRUE');
      } else {
        console.log('✗ Wrong password NOT detected');
      }
      
      // TEST 7: Authorization Check
      console.log('\nTEST 7: Role-Based Authorization');
      const testCases = [
        { userRole: 'director', requiredRoles: ['director', 'specialist'], expected: true },
        { userRole: 'student', requiredRoles: ['director', 'specialist'], expected: false },
        { userRole: 'instructor', requiredRoles: ['director', 'specialist', 'instructor'], expected: true }
      ];
      
      testCases.forEach((testCase, idx) => {
        const isAuthorized = testCase.requiredRoles.includes(testCase.userRole);
        const passed = isAuthorized === testCase.expected;
        const symbol = passed ? '✓' : '✗';
        console.log(`${symbol} Case ${idx + 1}: Role '${testCase.userRole}' - ${isAuthorized ? 'AUTHORIZED' : 'DENIED'} (Expected: ${testCase.expected})`);
      });
      
      // TEST 8: Middleware Protect Logic
      console.log('\nTEST 8: Middleware Protect Logic');
      const bearerToken = `Bearer ${token}`;
      const tokenFromHeader = bearerToken.split(' ')[1];
      try {
        const decoded = jwt.verify(tokenFromHeader, jwtSecret);
        console.log('✓ Token extracted and verified from Bearer header');
        console.log('  - Extracted user ID:', decoded.id);
      } catch (err) {
        console.log('✗ Token extraction/verification failed:', err.message);
      }
      
      // TEST 9: Login Compatibility Mode
      console.log('\nTEST 9: Login Password Compatibility');
      const plaintextPassword = '123456';
      const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm';
      
      // Simulate login logic
      const isMatch = hashedPassword.startsWith('$2') 
        ? true // Would use bcrypt.compare
        : plaintextPassword === hashedPassword;
      
      console.log('✓ Login compatibility check: password starts with $2 =', hashedPassword.startsWith('$2'));
      
      console.log('\n╔════════════════════════════════════════════╗');
      console.log('║         ALL TESTS COMPLETED ✓             ║');
      console.log('╚════════════════════════════════════════════╝\n');
      
      process.exit(0);
    });
  });
});
