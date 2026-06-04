/**
 * Validation utilities cho toàn bộ hệ thống
 */

// Các khoa chính thức của Thai Binh University
const VALID_FACULTIES = [
  'Khoa Công nghệ và Kỹ thuật',
  'Khoa Kinh tế và Quản trị',
  'Khoa Luật, Chính trị học và Quan hệ Quốc tế',
  'Khoa Khoa học Cơ bản'
];

const VALID_ROLES = ['director', 'admin', 'specialist', 'instructor', 'student', 'council'];
const VALID_TOPIC_STATUS = ['pending', 'approved', 'rejected', 'grading', 'completed'];
const TOPIC_STATUSES_FOR_SCORING = ['approved', 'grading'];

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength (minimum 6 characters)
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mật khẩu không hợp lệ' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  return { valid: true };
};

// Validate faculty name
const validateFaculty = (faculty) => {
  if (!faculty) return { valid: true }; // Faculty là optional
  if (!VALID_FACULTIES.includes(faculty)) {
    return {
      valid: false,
      error: `Khoa không hợp lệ. Các khoa hợp lệ: ${VALID_FACULTIES.join(', ')}`
    };
  }
  return { valid: true };
};

// Validate role
const validateRole = (role) => {
  if (!VALID_ROLES.includes(role)) {
    return { valid: false, error: `Vai trò không hợp lệ. Các vai trò hợp lệ: ${VALID_ROLES.join(', ')}` };
  }
  return { valid: true };
};

// Validate topic status
const validateTopicStatus = (status) => {
  if (!VALID_TOPIC_STATUS.includes(status)) {
    return { valid: false, error: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${VALID_TOPIC_STATUS.join(', ')}` };
  }
  return { valid: true };
};

// Validate that topic is in valid status for scoring
const canScoreTopic = (status) => {
  return TOPIC_STATUSES_FOR_SCORING.includes(status);
};

// Validate required fields
const validateRequired = (obj, fields) => {
  const missingFields = [];
  fields.forEach(field => {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  if (missingFields.length > 0) {
    return { valid: false, error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}` };
  }
  return { valid: true };
};

// Validate score values (0-100)
const validateScore = (score) => {
  if (score === null || score === undefined) return { valid: true };
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return { valid: false, error: 'Điểm phải là số từ 0 đến 100' };
  }
  return { valid: true };
};

// Validate date format (YYYY-MM-DD)
const validateDateFormat = (dateStr) => {
  if (!dateStr) return { valid: true };
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: 'Định dạng ngày phải là YYYY-MM-DD' };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFaculty,
  validateRole,
  validateTopicStatus,
  validateRequired,
  validateScore,
  validateDateFormat,
  canScoreTopic,
  VALID_FACULTIES,
  VALID_ROLES,
  VALID_TOPIC_STATUS,
  TOPIC_STATUSES_FOR_SCORING
};
