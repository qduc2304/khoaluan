/**
 * API Integration & Data Linking Test
 * Kiểm thử liên kết dữ liệu giữa các bảng
 */

require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

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
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`)
};

async function runTests() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   API INTEGRATION & DATA LINKING TESTS    ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // TEST 1: Users Table Structure
    log.section('TEST 1: Users Table Structure');
    try {
      const [users] = await pool.execute('DESCRIBE users');
      log.success('Users table columns:');
      users.forEach(col => {
        log.info(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? '[REQUIRED]' : '[OPTIONAL]'}`);
      });
    } catch (err) {
      log.error('Cannot describe users table: ' + err.message);
    }

    // TEST 2: Sample Users Data
    log.section('TEST 2: Sample Users Data');
    try {
      const [users] = await pool.execute('SELECT id, full_name, email, role FROM users LIMIT 5');
      if (users.length === 0) {
        log.error('No users found in database');
      } else {
        log.success(`Found ${users.length} users:`);
        users.forEach(user => {
          log.info(`  - ID ${user.id}: ${user.full_name} [${user.role}]`);
        });
      }
    } catch (err) {
      log.error('Error fetching users: ' + err.message);
    }

    // TEST 3: Role Distribution
    log.section('TEST 3: Role Distribution');
    try {
      const [roles] = await pool.execute(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY count DESC
      `);
      log.success('Role distribution:');
      roles.forEach(r => {
        log.info(`  - ${r.role.padEnd(15)}: ${r.count} users`);
      });
    } catch (err) {
      log.error('Error fetching roles: ' + err.message);
    }

    // TEST 4: Faculty Assignment
    log.section('TEST 4: Faculty Assignment');
    try {
      const [faculties] = await pool.execute(`
        SELECT faculty_name, COUNT(*) as count 
        FROM users 
        WHERE faculty_name IS NOT NULL AND faculty_name != ''
        GROUP BY faculty_name 
        ORDER BY faculty_name
      `);
      if (faculties.length === 0) {
        log.error('No users with faculty assignment');
      } else {
        log.success(`Faculties with users (${faculties.length} total):`);
        faculties.forEach(f => {
          log.info(`  - ${f.faculty_name}: ${f.count} users`);
        });
      }
    } catch (err) {
      log.error('Error fetching faculties: ' + err.message);
    }

    // TEST 5: Email Validation
    log.section('TEST 5: Email Validation');
    try {
      const [invalidEmails] = await pool.execute(`
        SELECT id, full_name, email 
        FROM users 
        WHERE email NOT LIKE '%@%'
      `);
      if (invalidEmails.length === 0) {
        log.success('All email addresses are valid');
      } else {
        log.error(`Found ${invalidEmails.length} invalid emails:`);
        invalidEmails.forEach(u => {
          log.info(`  - ID ${u.id}: "${u.email}"`);
        });
      }
    } catch (err) {
      log.error('Error validating emails: ' + err.message);
    }

    // TEST 6: Data Integrity - Required Fields
    log.section('TEST 6: Data Integrity - Required Fields');
    try {
      const [incomplete] = await pool.execute(`
        SELECT id, full_name, email, role, password 
        FROM users 
        WHERE full_name IS NULL OR full_name = ''
          OR email IS NULL OR email = ''
          OR role IS NULL OR role = ''
          OR password IS NULL OR password = ''
      `);
      if (incomplete.length === 0) {
        log.success('All users have required fields (full_name, email, role, password)');
      } else {
        log.error(`Found ${incomplete.length} users with missing required fields`);
      }
    } catch (err) {
      log.error('Error checking data integrity: ' + err.message);
    }

    // TEST 7: Password Format Check
    log.section('TEST 7: Password Format Check');
    try {
      const [allUsers] = await pool.execute('SELECT id, email, password FROM users LIMIT 10');
      let hashedCount = 0;
      let plainCount = 0;
      
      allUsers.forEach(user => {
        if (user.password.startsWith('$2')) {
          hashedCount++;
        } else {
          plainCount++;
        }
      });
      
      log.info(`Password format in sample (${allUsers.length} users):`);
      log.info(`  - Hashed (bcrypt): ${hashedCount}`);
      log.info(`  - Plain text: ${plainCount}`);
      
      if (plainCount > 0) {
        log.error('WARNING: Found plain text passwords (should be bcrypt hashed)');
      } else {
        log.success('All passwords properly hashed');
      }
    } catch (err) {
      log.error('Error checking password format: ' + err.message);
    }

    // TEST 8: Check Related Tables
    log.section('TEST 8: Related Tables Status');
    const tables = [
      { name: 'topics', dependsOn: 'users' },
      { name: 'campaigns', dependsOn: 'users' },
      { name: 'documents', dependsOn: 'topics' },
      { name: 'scores', dependsOn: 'topics' },
      { name: 'reports', dependsOn: 'topics' }
    ];

    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = result[0].count;
        if (count > 0) {
          log.success(`Table '${table.name}': ${count} records`);
        } else {
          log.info(`Table '${table.name}': empty (0 records)`);
        }
      } catch (err) {
        if (err.message.includes('Unknown table')) {
          log.error(`Table '${table.name}': NOT CREATED`);
        } else {
          log.error(`Table '${table.name}': ${err.message}`);
        }
      }
    }

    // TEST 9: Simulate GET /api/users/instructors
    log.section('TEST 9: Simulate GET /api/users/instructors');
    try {
      const [instructors] = await pool.execute(
        "SELECT id, full_name FROM users WHERE role = 'instructor' LIMIT 10"
      );
      log.success(`Found ${instructors.length} instructors`);
      instructors.forEach(inst => {
        log.info(`  - ID ${inst.id}: ${inst.full_name}`);
      });
    } catch (err) {
      log.error('Error fetching instructors: ' + err.message);
    }

    // TEST 10: Simulate GET /api/users/faculties
    log.section('TEST 10: Simulate GET /api/users/faculties');
    try {
      const [faculties] = await pool.execute(
        "SELECT DISTINCT faculty_name FROM users WHERE faculty_name IS NOT NULL AND faculty_name != '' ORDER BY faculty_name"
      );
      log.success(`Found ${faculties.length} unique faculties`);
      faculties.forEach(fac => {
        log.info(`  - ${fac.faculty_name}`);
      });
    } catch (err) {
      log.error('Error fetching faculties: ' + err.message);
    }

    // TEST 11: User Profile Data
    log.section('TEST 11: User Profile Data (Simulate GET /api/users/profile)');
    try {
      const [profile] = await pool.execute(
        'SELECT id, full_name, email, student_code, role, faculty_name, major, class_name, created_at FROM users LIMIT 1'
      );
      if (profile.length > 0) {
        const user = profile[0];
        log.success('Sample user profile:');
        log.info(`  - ID: ${user.id}`);
        log.info(`  - Name: ${user.full_name}`);
        log.info(`  - Email: ${user.email}`);
        log.info(`  - Student Code: ${user.student_code || 'N/A'}`);
        log.info(`  - Role: ${user.role}`);
        log.info(`  - Faculty: ${user.faculty_name || 'N/A'}`);
        log.info(`  - Major: ${user.major || 'N/A'}`);
        log.info(`  - Class: ${user.class_name || 'N/A'}`);
        log.info(`  - Created: ${user.created_at}`);
      }
    } catch (err) {
      log.error('Error fetching user profile: ' + err.message);
    }

    // TEST 12: Authorization Role Check
    log.section('TEST 12: Authorization Role Check');
    try {
      const protectedRoles = ['director', 'specialist'];
      const [admins] = await pool.execute(
        `SELECT COUNT(*) as count FROM users WHERE role IN ('${protectedRoles.join("','")}')`
      );
      log.success(`Users with protected roles (${protectedRoles.join(', ')}): ${admins[0].count}`);
      
      const [students] = await pool.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
      );
      log.success(`Students: ${students[0].count}`);
      
      const [councils] = await pool.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'council'"
      );
      log.success(`Council members: ${councils[0].count}`);
    } catch (err) {
      log.error('Error checking authorization roles: ' + err.message);
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         ALL TESTS COMPLETED ✓             ║');
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (error) {
    log.error('Test suite error: ' + error.message);
  } finally {
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
