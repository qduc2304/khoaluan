/**
 * Quick Validator Test - Direct Testing
 */
const validators = require('./backend/validators');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   VALIDATION SYSTEM QUICK TEST            ║');
console.log('╚════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    failed++;
  }
}

// EMAIL TESTS
console.log('📧 EMAIL VALIDATION:');
test('Valid email', validators.validateEmail('user@example.com') === true);
test('Invalid email (no @)', validators.validateEmail('useremail') === false);
test('Invalid email (no domain)', validators.validateEmail('user@') === false);

// PASSWORD TESTS
console.log('\n🔐 PASSWORD VALIDATION:');
test('Valid password (6 chars)', validators.validatePassword('123456').valid === true);
test('Invalid password (5 chars)', validators.validatePassword('12345').valid === false);
test('Invalid password (empty)', validators.validatePassword('').valid === false);

// FACULTY TESTS
console.log('\n🏫 FACULTY VALIDATION:');
test('Valid faculty 1', validators.validateFaculty('Khoa Công nghệ và Kỹ thuật').valid === true);
test('Valid faculty 2', validators.validateFaculty('Khoa Kinh tế và Quản trị').valid === true);
test('Invalid faculty', validators.validateFaculty('Invalid Faculty').valid === false);
test('Null faculty (optional)', validators.validateFaculty(null).valid === true);

// ROLE TESTS
console.log('\n👤 ROLE VALIDATION:');
test('Valid role: director', validators.validateRole('director').valid === true);
test('Valid role: student', validators.validateRole('student').valid === true);
test('Invalid role: superadmin', validators.validateRole('superadmin').valid === false);

// SCORE TESTS
console.log('\n📊 SCORE VALIDATION:');
test('Valid score: 50', validators.validateScore(50).valid === true);
test('Valid score: 0', validators.validateScore(0).valid === true);
test('Valid score: 100', validators.validateScore(100).valid === true);
test('Invalid score: 150', validators.validateScore(150).valid === false);
test('Invalid score: -10', validators.validateScore(-10).valid === false);
test('Null score (optional)', validators.validateScore(null).valid === true);

// DATE TESTS
console.log('\n📅 DATE VALIDATION:');
test('Valid date: 2026-05-20', validators.validateDateFormat('2026-05-20').valid === true);
test('Invalid date: 20-05-2026', validators.validateDateFormat('20-05-2026').valid === false);
test('Invalid date: 2026/05/20', validators.validateDateFormat('2026/05/20').valid === false);
test('Null date (optional)', validators.validateDateFormat(null).valid === true);

// REQUIRED FIELDS TESTS
console.log('\n✓ REQUIRED FIELDS VALIDATION:');
test('All fields present', 
  validators.validateRequired({title: 'A', desc: 'B'}, ['title', 'desc']).valid === true);
test('Missing field', 
  validators.validateRequired({title: 'A'}, ['title', 'desc']).valid === false);
test('Empty field', 
  validators.validateRequired({title: '', desc: 'B'}, ['title', 'desc']).valid === false);

// TOPIC STATUS TESTS
console.log('\n📝 TOPIC STATUS VALIDATION:');
test('Valid status: pending', validators.validateTopicStatus('pending').valid === true);
test('Valid status: approved', validators.validateTopicStatus('approved').valid === true);
test('Valid status: grading', validators.validateTopicStatus('grading').valid === true);
test('Invalid status: submitted', validators.validateTopicStatus('submitted').valid === false);

// SCORING ELIGIBILITY TESTS
console.log('\n✍️ SCORING ELIGIBILITY:');
test('Can score approved topic', validators.canScoreTopic('approved') === true);
test('Can score grading topic', validators.canScoreTopic('grading') === true);
test('Cannot score pending topic', validators.canScoreTopic('pending') === false);
test('Cannot score rejected topic', validators.canScoreTopic('rejected') === false);

// SUMMARY
console.log('\n' + '═'.repeat(45));
console.log(`✓ PASSED: ${passed}`);
console.log(`✗ FAILED: ${failed}`);
console.log(`TOTAL: ${passed + failed}`);
const percentage = ((passed / (passed + failed)) * 100).toFixed(1);
console.log(`SUCCESS RATE: ${percentage}%`);
console.log('═'.repeat(45) + '\n');

if (failed === 0) {
  console.log('🎉 ALL VALIDATION TESTS PASSED!\n');
} else {
  console.log('⚠️ SOME TESTS FAILED - Please review\n');
}
