# 📋 Hướng Dẫn Nộp Báo Cáo - Report Submission Feature

## 📌 Giới Thiệu

Chức năng **Nộp Báo Cáo** cho phép sinh viên nộp hai loại file:
- **📄 Work**: Tài liệu báo cáo công việc
- **📊 PP**: Slide PowerPoint/thuyết trình

Các báo cáo sẽ được:
1. **Lưu trữ** trên hệ thống
2. **Chấm điểm** bởi giáo viên hướng dẫn/chuyên viên
3. **Phê duyệt** trước khi công bố
4. **Chia sẻ công khai** cho tất cả user xem (sau phê duyệt)

---

## 🎯 Quy Trình Công Việc

### 1️⃣ **Sinh Viên Nộp Báo Cáo**
- Vào **"Nộp Báo Cáo"** trong menu
- Chọn đề tài
- Upload file work và/hoặc pp
- Click **"📤 Nộp Báo Cáo"**

### 2️⃣ **Kiểm Tra Lịch Sử**
- Vào tab **"Lịch Sử Nộp"**
- Xem trạng thái báo cáo:
  - ⏳ **Chờ duyệt** (pending)
  - ✅ **Được phê duyệt** (approved)
  - ❌ **Bị từ chối** (rejected)

### 3️⃣ **Specialist/Director Phê Duyệt**
- Vào **"Phê Duyệt Báo Cáo"** (Admin)
- Lọc theo trạng thái: Chờ Phê Duyệt / Đã Phê Duyệt
- Click **✅ Phê Duyệt** hoặc **❌ Từ Chối**
- Thêm ghi chú (tùy chọn)

### 4️⃣ **Tất Cả Xem Báo Cáo Đã Phê Duyệt**
- Vào **"Kho Báo Cáo Đã Phê Duyệt"**
- Tìm kiếm theo tên sinh viên/email
- Lọc: Tất cả / Chỉ Work / Chỉ PP
- Tải về file báo cáo

---

## 🔧 Cấu Trúc Cơ Sở Dữ Liệu

### Bảng: `student_reports`

```sql
CREATE TABLE student_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                    -- ID sinh viên
    topic_id INT,                               -- ID đề tài
    work_file_url VARCHAR(500),                 -- URL file work
    work_file_name VARCHAR(255),                -- Tên file work
    pp_file_url VARCHAR(500),                   -- URL file PP
    pp_file_name VARCHAR(255),                  -- Tên file PP
    work_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    pp_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_notes TEXT,                        -- Ghi chú phê duyệt
    approved_by INT,                            -- ID người phê duyệt
    approved_at TIMESTAMP NULL,                 -- Thời gian phê duyệt
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

---

## 🔌 API Endpoints

### 📤 **Nộp Báo Cáo**
```http
POST /api/reports/submit
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- topic_id: {id}          (required)
- work: {file}            (optional)
- pp: {file}              (optional)
```

### 📋 **Lấy Báo Cáo Của Sinh Viên**
```http
GET /api/reports
Authorization: Bearer {token}

Query params:
- student_id: {id}  (optional, chỉ specialist/director)
- topic_id: {id}    (optional)
```

### ✅ **Phê Duyệt Báo Cáo**
```http
PATCH /api/reports/{report_id}/approve
Authorization: Bearer {token}

Body:
{
  "work_status": "approved|rejected",  (optional)
  "pp_status": "approved|rejected",    (optional)
  "notes": "Ghi chú..."               (optional)
}
```

### 📚 **Xem Báo Cáo Đã Phê Duyệt (Public)**
```http
GET /api/reports/approved/list

Query params:
- student_id: {id}  (optional)
- topic_id: {id}    (optional)
```

---

## 📱 Frontend Routes

| Route | Role | Component | Mô Tả |
|-------|------|-----------|-------|
| `/student/submit-report` | Student | ReportSubmission | Nộp báo cáo |
| `/reports/viewer` | Tất cả | ReportViewer | Xem báo cáo công khai |
| `/admin/approve-reports` | Specialist/Director/Instructor | ReportApproval | Phê duyệt báo cáo |

---

## 🧪 Chạy Test

### 1. Bắt đầu Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Chạy Test Script
```bash
cd ..
node test_report_submission.js
```

### Test Cases:
✓ Login sinh viên
✓ Lấy danh sách đề tài
✓ Nộp báo cáo (work + pp)
✓ Lấy báo cáo của sinh viên
✓ Login specialist
✓ Phê duyệt báo cáo
✓ Xem báo cáo đã phê duyệt (public)

---

## 🚀 Hệ Thống Phân Quyền

| Role | Quyền |
|------|--------|
| **Student** | ✓ Nộp báo cáo<br>✓ Xem báo cáo của mình<br>✓ Xem báo cáo công khai |
| **Instructor** | ✓ Phê duyệt báo cáo<br>✓ Xem tất cả báo cáo<br>✓ Xem báo cáo công khai |
| **Specialist** | ✓ Phê duyệt báo cáo<br>✓ Xem tất cả báo cáo<br>✓ Xem báo cáo công khai |
| **Director** | ✓ Phê duyệt báo cáo<br>✓ Xem tất cả báo cáo<br>✓ Xem báo cáo công khai |
| **Council** | ✓ Xem báo cáo công khai |

---

## 📦 Files Mới Được Thêm

### Backend
- `backend/database.sql` - Bảng `student_reports` (updated)
- `backend/routes/reportRoutes.js` - Routes báo cáo (updated)
- `backend/controllers/reportController.js` - Controller (updated)

### Frontend
- `frontend/src/pages/Student/ReportSubmission.jsx` - Form nộp báo cáo
- `frontend/src/pages/Student/ReportSubmission.css` - Style form
- `frontend/src/pages/ReportViewer.jsx` - Xem báo cáo công khai
- `frontend/src/pages/ReportViewer.css` - Style viewer
- `frontend/src/pages/Admin/ReportApproval.jsx` - Phê duyệt báo cáo
- `frontend/src/pages/Admin/ReportApproval.css` - Style approval
- `frontend/src/App.jsx` - Routes (updated)

---

## ✨ Tính Năng Chính

✅ **Nộp báo cáo** - Sinh viên có thể nộp work và/hoặc pp  
✅ **Lưu trữ** - Các file được lưu trong thư mục `/uploads`  
✅ **Phê duyệt hai bước** - Work và pp phê duyệt riêng biệt  
✅ **Ghi chú** - Specialist/Director có thể thêm ghi chú phê duyệt  
✅ **Chia sẻ công khai** - Báo cáo đã phê duyệt công khai cho tất cả  
✅ **Tìm kiếm & lọc** - Tìm theo tên sinh viên, lọc theo loại file  

---

## 🐛 Troubleshooting

### Lỗi: "Đề tài không tồn tại"
- Kiểm tra ID đề tài có đúng không
- Đảm bảo sinh viên là người sáng lập đề tài

### Lỗi: "Bạn không có quyền phê duyệt"
- Chỉ Specialist/Director/Instructor mới phê duyệt được
- Kiểm tra token trong localStorage

### File không upload được
- Kiểm tra kích thước file (nên < 50MB)
- Kiểm tra định dạng file hỗ trợ
- Đảm bảo thư mục `/uploads` có quyền ghi

---

**Cập nhật: 25/05/2026**  
**Version: 1.0.0**
