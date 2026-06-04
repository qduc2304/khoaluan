#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE TEST SUITE RUNNER
 * Chạy tất cả tests kiểm thử hệ thống
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tests = [
  { name: 'test_auth_logic.js', desc: '🔐 Authentication & Encryption' },
  { name: 'test_api_integration.js', desc: '🔗 API Integration' },
  { name: 'test_complete_flow.js', desc: '✅ Complete Flow' },
  { name: 'test_system.js', desc: '🏢 System Tests' }
];

let passed = 0;
let failed = 0;
const results = [];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        🚀 COMPREHENSIVE TEST SUITE RUNNER 🚀              ║');
console.log('║         Chạy Tất Cả Tests - Hệ Thống Kiểm Thử             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

function runTest(index) {
  if (index >= tests.length) {
    printSummary();
    return;
  }

  const test = tests[index];
  const testPath = path.join(__dirname, test.name);

  if (!fs.existsSync(testPath)) {
    console.error(`❌ Test file not found: ${testPath}\n`);
    failed++;
    results.push(`${test.name}: NOT FOUND`);
    runTest(index + 1);
    return;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TEST ${index + 1}/${tests.length}: ${test.desc}`);
  console.log(`File: ${test.name}`);
  console.log('─'.repeat(60));

  const child = spawn('node', [testPath], { cwd: __dirname });
  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    process.stderr.write(text);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ PASSED\n`);
      passed++;
      results.push(`✓ ${test.name}`);
    } else {
      console.log(`❌ FAILED (exit code: ${code})\n`);
      failed++;
      results.push(`✗ ${test.name} (exit ${code})`);
    }
    runTest(index + 1);
  });

  child.on('error', (err) => {
    console.error(`❌ ERROR: ${err.message}\n`);
    failed++;
    results.push(`✗ ${test.name} (error: ${err.message})`);
    runTest(index + 1);
  });
}

function printSummary() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📊 TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  results.forEach((result) => console.log(`  ${result}`));

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('─'.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for production! 🎉\n');
    console.log('✅ Next Step: Start backend & run test_real_api.js');
    console.log('   Terminal 1: node d:\\khoaluan\\backend\\server.js');
    console.log('   Terminal 2: node d:\\khoaluan\\test_real_api.js\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the output above.\n`);
    process.exit(1);
  }
}

// Start running tests
runTest(0);
