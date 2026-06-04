SET FOREIGN_KEY_CHECKS = 0;

-- Xóa các bảng cũ nếu tồn tại để reset sạch
DROP TABLE IF EXISTS scores, documents, student_reports, topic_assignments, topics, councils, campaigns, users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tạo bảng Tài khoản (Sinh viên, Giảng viên, Admin)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    student_code VARCHAR(20) UNIQUE,
    role ENUM('student', 'instructor', 'specialist', 'director', 'council') NOT NULL DEFAULT 'student',
    faculty_name VARCHAR(100),
    major VARCHAR(100) DEFAULT NULL,
    class_name VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 Bảng đợt thi/chiến dịch NCKH (Dành cho phòng QLKH)
CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE,
    submission_deadline DATE,
    council_date DATE,
    status ENUM('active', 'closed') DEFAULT 'active',
    award_structure JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Bảng Hội đồng (Danh mục hội đồng)
CREATE TABLE councils (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    campaign_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- 2. Tạo bảng Đề tài NCKH
CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    english_title VARCHAR(255),
    description TEXT,
    field_of_study VARCHAR(100),
    round_status INT DEFAULT 1,
    student_id INT NOT NULL,
    instructor_id INT,
    campaign_id INT,
    council_id INT,
    team_members TEXT,
    funding DECIMAL(15,2) DEFAULT 0,
    funding_status ENUM('pending', 'proposed', 'approved', 'rejected') DEFAULT 'pending',
    effectiveness TEXT,
    award VARCHAR(100),
    status ENUM('pending', 'instructor_approved', 'approved', 'grading', 'revision_requested', 'completed', 'rejected') DEFAULT 'pending',
    revision_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL
);

-- 3. Tạo bảng Tài liệu (Lưu link upload báo cáo, slide)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- 4. Tạo bảng Chấm điểm
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    council_member_id INT NOT NULL,
    level INT DEFAULT 1,
    urgency_score DECIMAL(5,2) DEFAULT NULL,
    method_score DECIMAL(5,2) DEFAULT NULL,
    result_score DECIMAL(5,2) DEFAULT NULL,
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (urgency_score + method_score + result_score) STORED,
    comment TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (council_member_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX unique_assignment (topic_id, council_member_id, level)
);

-- 5. Bảng nộp Báo cáo / Minh chứng (Student Reports)
CREATE TABLE student_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    topic_id INT NOT NULL,
    work_file_url VARCHAR(255),
    work_file_name VARCHAR(255),
    work_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pp_file_url VARCHAR(255),
    pp_file_name VARCHAR(255),
    pp_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_notes TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Bảng phân công giám khảo (Topic assignments)
CREATE TABLE topic_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    examiner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(topic_id, examiner_id)
);

-- 7. Chèn dữ liệu mẫu cho bảng users (Mật khẩu mặc định là: 123456)
INSERT IGNORE INTO users (id, full_name, email, password, role) VALUES
(1, 'Quản Trị Viên', 'quantri@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'director'),
(2, 'Giám Đốc', 'giamdoc@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'director'),
(3, 'Chuyên Viên Quản Lý', 'chuyenvien@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'specialist'),
(4, 'Giảng Viên Hướng Dẫn', 'giangvien@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'instructor'),
(5, 'Sinh Viên Nghiên Cứu', 'sinhvien@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'student'),
(6, 'Thành Viên Hội Đồng', 'hoidong@truong.vn', '$2b$10$w82z4Z18r7zC.41vjQ7L.uUj0HnQ2E3.B5jBw3j.D6pL9N9U2q3hC', 'council');

-- 8. Chèn dữ liệu mẫu cho bảng topics
INSERT IGNORE INTO topics (title, description, student_id, instructor_id, status) VALUES
('Nghiên cứu AI trong giáo dục', 'Phân tích tác động của ChatGPT đến sinh viên', 5, 4, 'pending');
