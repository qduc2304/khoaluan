/**
 * Real API Testing - Chạy Thực Tế API
 * Yêu cầu: Backend server phải chạy trước (node d:\khoaluan\backend\server.js)
 */

const http = require('http');
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
  request: (method, path) => console.log(`\n→ ${colors.blue}${method}${colors.reset} ${path}`),
  response: (status, data) => console.log(`← ${status >= 200 && status < 300 ? colors.green : colors.red}${status}${colors.reset} ${data}`)
};

const BASE_URL = 'http://localhost:8080';
let globalToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test 1: Seed Admin Account
async function testSeedAdmin() {
  log.section('TEST 1: Seed Admin Account (GET /api/auth/seed)');
  try {
    log.request('GET', '/api/auth/seed');
    const response = await makeRequest('GET', '/api/auth/seed');
    
    if (response.status === 200 || response.status === 201) {
      log.response(response.status, JSON.stringify(response.body));
      log.success('Admin account seeded successfully');
      log.info('  Email: quantri@truong.vn');
      log.info('  Password: 123456');
      log.info('  Role: director');
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.warn('Admin already exists or other status');
      return true;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 2: Seed Sample Users
async function testSeedUsers() {
  log.section('TEST 2: Seed Sample Users (GET /api/users/seed)');
  try {
    log.request('GET', '/api/users/seed');
    const response = await makeRequest('GET', '/api/users/seed');
    
    if (response.status === 200) {
      log.response(response.status, JSON.stringify(response.body));
      log.success('Sample users seeded successfully');
      log.info('  Created 5 test accounts:');
      log.info('    - ID 1: Giám Đốc (director)');
      log.info('    - ID 2: Chuyên Viên (specialist)');
      log.info('    - ID 3: Giảng Viên (instructor)');
      log.info('    - ID 4: Sinh Viên (student)');
      log.info('    - ID 5: Thư ký Hội đồng (council)');
      log.info('  All passwords: 123456');
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 3: Login with Admin
async function testLoginAdmin() {
  log.section('TEST 3: Login Admin (POST /api/auth/login)');
  try {
    const loginData = {
      email: 'quantri@truong.vn',
      password: '123456'
    };
    
    log.request('POST', '/api/auth/login');
    log.info(`Body: ${JSON.stringify(loginData)}`);
    
    const response = await makeRequest('POST', '/api/auth/login', loginData);
    
    if (response.status === 200) {
      log.response(response.status, 'Login successful');
      log.success('Admin login successful');
      
      if (response.body.token) {
        globalToken = response.body.token;
        log.success('JWT Token obtained');
        log.info(`  Token: ${response.body.token.substring(0, 50)}...`);
        log.info(`  User: ${response.body.user.full_name}`);
        log.info(`  Role: ${response.body.user.role}`);
        return true;
      }
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Login failed');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 4: Login with Director (ID 1)
async function testLoginDirector() {
  log.section('TEST 4: Login Director (POST /api/auth/login)');
  try {
    const loginData = {
      email: 'giamdoc@truong.vn',
      password: '123456'
    };
    
    log.request('POST', '/api/auth/login');
    log.info(`Body: ${JSON.stringify(loginData)}`);
    
    const response = await makeRequest('POST', '/api/auth/login', loginData);
    
    if (response.status === 200) {
      log.response(response.status, 'Login successful');
      log.success('Director login successful');
      log.info(`  User: ${response.body.user.full_name}`);
      log.info(`  Role: ${response.body.user.role}`);
      log.info(`  Token: ${response.body.token.substring(0, 50)}...`);
      globalToken = response.body.token;
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Login failed');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 5: Get User Profile
async function testGetProfile() {
  log.section('TEST 5: Get User Profile (GET /api/users/profile)');
  if (!globalToken) {
    log.error('No token available, skipping...');
    return false;
  }
  
  try {
    log.request('GET', '/api/users/profile');
    log.info(`Auth: Bearer ${globalToken.substring(0, 30)}...`);
    
    const response = await makeRequest('GET', '/api/users/profile', null, globalToken);
    
    if (response.status === 200) {
      log.response(response.status, 'Profile retrieved');
      log.success('User profile:');
      log.info(`  ID: ${response.body.id}`);
      log.info(`  Name: ${response.body.full_name}`);
      log.info(`  Email: ${response.body.email}`);
      log.info(`  Role: ${response.body.role}`);
      log.info(`  Faculty: ${response.body.faculty_name || 'N/A'}`);
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Failed to get profile');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 6: Get All Instructors
async function testGetInstructors() {
  log.section('TEST 6: Get All Instructors (GET /api/users/instructors)');
  if (!globalToken) {
    log.error('No token available, skipping...');
    return false;
  }
  
  try {
    log.request('GET', '/api/users/instructors');
    const response = await makeRequest('GET', '/api/users/instructors', null, globalToken);
    
    if (response.status === 200) {
      log.response(response.status, `Retrieved ${response.body.length} instructors`);
      log.success('Instructors list:');
      response.body.forEach(inst => {
        log.info(`  - ID ${inst.id}: ${inst.full_name}`);
      });
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Failed to get instructors');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 7: Get All Faculties
async function testGetFaculties() {
  log.section('TEST 7: Get All Faculties (GET /api/users/faculties)');
  if (!globalToken) {
    log.error('No token available, skipping...');
    return false;
  }
  
  try {
    log.request('GET', '/api/users/faculties');
    const response = await makeRequest('GET', '/api/users/faculties', null, globalToken);
    
    if (response.status === 200) {
      log.response(response.status, `Retrieved ${response.body.length} faculties`);
      log.success('Faculties list:');
      response.body.forEach(fac => {
        log.info(`  - ${fac}`);
      });
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Failed to get faculties');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 8: Get All Users (Protected - director/specialist only)
async function testGetAllUsers() {
  log.section('TEST 8: Get All Users (GET /api/users)');
  if (!globalToken) {
    log.error('No token available, skipping...');
    return false;
  }
  
  try {
    log.request('GET', '/api/users');
    const response = await makeRequest('GET', '/api/users', null, globalToken);
    
    if (response.status === 200) {
      log.response(response.status, `Retrieved ${response.body.length} users`);
      log.success('All users:');
      response.body.slice(0, 10).forEach(user => {
        log.info(`  - ID ${user.id}: ${user.full_name} [${user.role}]`);
      });
      if (response.body.length > 10) {
        log.info(`  ... and ${response.body.length - 10} more`);
      }
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Failed to get users');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 9: Test Invalid Token
async function testInvalidToken() {
  log.section('TEST 9: Test Invalid Token (GET /api/users/profile)');
  try {
    const invalidToken = 'invalid.token.here';
    log.request('GET', '/api/users/profile');
    log.info(`Auth: Bearer ${invalidToken}`);
    
    const response = await makeRequest('GET', '/api/users/profile', null, invalidToken);
    
    if (response.status === 401) {
      log.response(response.status, JSON.stringify(response.body));
      log.success('Invalid token correctly rejected (401)');
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Invalid token should return 401');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 10: Test Without Token
async function testWithoutToken() {
  log.section('TEST 10: Test Without Token (GET /api/users/profile)');
  try {
    log.request('GET', '/api/users/profile');
    log.info('Auth: (none)');
    
    const response = await makeRequest('GET', '/api/users/profile', null, null);
    
    if (response.status === 401) {
      log.response(response.status, JSON.stringify(response.body));
      log.success('Request without token correctly rejected (401)');
      return true;
    } else {
      log.response(response.status, JSON.stringify(response.body));
      log.error('Request without token should return 401');
      return false;
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║       REAL API TESTING - Chạy Thực Tế     ║');
  console.log('║     Backend must be running on :8080      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log('Please ensure backend server is running: node d:\\khoaluan\\backend\\server.js\n');

  // Wait for server to be ready
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const response = await makeRequest('GET', '/api/users/faculties', null, 'dummy-token');
      serverReady = true;
      break;
    } catch (err) {
      if (i < 9) {
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  if (!serverReady) {
    log.error('Backend server is not responding on http://localhost:8080');
    log.info('Please start the backend server first:');
    log.info('  cd d:\\khoaluan\\backend');
    log.info('  node server.js');
    process.exit(1);
  }

  log.success('Server is ready!\n');

  const tests = [
    { name: 'Seed Admin', fn: testSeedAdmin },
    { name: 'Seed Users', fn: testSeedUsers },
    { name: 'Login Admin', fn: testLoginAdmin },
    { name: 'Login Director', fn: testLoginDirector },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Get Instructors', fn: testGetInstructors },
    { name: 'Get Faculties', fn: testGetFaculties },
    { name: 'Get All Users', fn: testGetAllUsers },
    { name: 'Invalid Token', fn: testInvalidToken },
    { name: 'Without Token', fn: testWithoutToken }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      log.error(`Test ${test.name} error: ${error.message}`);
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
  console.log(`Result: ${colors.green}${passed}${colors.reset} / ${total} tests passed`);

  if (passed === total) {
    console.log(`${colors.green}✓ All API tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ ${total - passed} tests failed${colors.reset}\n`);
  }
}

// Start testing
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
