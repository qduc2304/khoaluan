# 🚀 QUICK START - REPORT SUBMISSION FEATURE

## ⚡ 5 Phút Khởi Động

### 1️⃣ Cập Nhật Database
```bash
cd backend
mysql -u root -p123456 < database.sql
```
✅ Bảng `student_reports` được tạo

### 2️⃣ Khởi Động Backend
```bash
cd backend
npm start
```
✅ Server chạy trên `http://localhost:8080`

### 3️⃣ Khởi Động Frontend
```bash
cd frontend
npm run dev
```
✅ App chạy trên `http://localhost:5173`

### 4️⃣ Test Feature
```bash
cd d:\khoaluan
node test_report_submission.js
```
✅ Tất cả 7 tests pass

---

## 📍 ROUTES CHÍNH

| URL | Role | Mục Đích |
|-----|------|----------|
| `/student/submit-report` | 👨‍🎓 Student | Nộp báo cáo |
| `/reports/viewer` | 👥 Tất Cả | Xem báo cáo công khai |
| `/admin/approve-reports` | 👨‍💼 Admin | Phê duyệt báo cáo |

---

## 👤 TEST ACCOUNTS

```
Student:
  Email: sinhvien@truong.vn
  Password: 123456

Specialist:
  Email: chuyenvien@truong.vn
  Password: 123456

Director:
  Email: giamdoc@truong.vn
  Password: 123456
```

---

## 📝 WORKFLOW

### Bước 1: Sinh Viên Nộp
```
1. Login: sinhvien@truong.vn / 123456
2. Vào: Student → Nộp Báo Cáo
3. Chọn đề tài
4. Upload file work (pdf/doc)
5. Upload file pp (ppt)
6. Click "📤 Nộp"
7. ✅ Báo cáo nộp thành công!
```

### Bước 2: Admin Phê Duyệt
```
1. Login: chuyenvien@truong.vn / 123456
2. Vào: Admin → Phê Duyệt Báo Cáo
3. Xem báo cáo "⏳ Chờ Duyệt"
4. Click "✅ Phê Duyệt"
5. Thêm ghi chú (tùy)
6. Click "✅ Phê Duyệt"
7. ✅ Báo cáo phê duyệt xong!
```

### Bước 3: Xem Công Khai
```
1. (Không cần login hoặc login bất cứ ai)
2. Vào: Kho Báo Cáo Đã Phê Duyệt
3. Tìm kiếm / lọc báo cáo
4. Download file cần thiết
5. ✅ Done!
```

---

## 🔍 API CHEAT SHEET

### Nộp Báo Cáo (Student)
```javascript
const formData = new FormData();
formData.append('topic_id', 1);
formData.append('work', workFile);
formData.append('pp', ppFile);

fetch('http://localhost:8080/api/reports/submit', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token },
  body: formData
});
```

### Phê Duyệt (Admin)
```javascript
fetch('http://localhost:8080/api/reports/1/approve', {
  method: 'PATCH',
  headers: { 
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    work_status: 'approved',
    pp_status: 'approved',
    notes: 'Rất tốt!'
  })
});
```

### Xem Công Khai
```javascript
fetch('http://localhost:8080/api/reports/approved/list')
  .then(r => r.json())
  .then(reports => console.log(reports));
```

---

## 📁 FILES CHÍNH

### Backend
- `database.sql` - Schema (bảng student_reports)
- `controllers/reportController.js` - 4 API functions
- `routes/reportRoutes.js` - 4 API routes

### Frontend
- `pages/Student/ReportSubmission.jsx` - Form nộp
- `pages/ReportViewer.jsx` - Xem công khai
- `pages/Admin/ReportApproval.jsx` - Phê duyệt
- `App.jsx` - Routes (updated)

---

## 🐛 TROUBLESHOOT

### ❌ "Đề tài không tồn tại"
→ Kiểm tra sinh viên là sáng lập đề tài

### ❌ "Không có quyền phê duyệt"
→ Chỉ Specialist/Director/Instructor phê duyệt được

### ❌ "File upload lỗi"
→ Kiểm tra định dạng (pdf/doc/ppt) và kích thước

### ❌ "Backend không chạy"
→ `npm start` trong thư mục `backend`

### ❌ "Database lỗi"
→ Chạy `mysql -u root -p < database.sql`

---

## 🎯 FEATURES

✅ Nộp 2 loại file (work + pp)  
✅ Phê duyệt riêng biệt  
✅ Ghi chú feedback  
✅ Chia sẻ công khai  
✅ Tìm kiếm & lọc  
✅ Role-based access  
✅ Upload file an toàn  
✅ Status tracking  

---

## 📊 DATABASE

**Bảng:** `student_reports`  
**Cột:** 12 (id, student_id, topic_id, work_*, pp_*, approved_*, notes, etc)  
**Relations:** users, topics

---

## 🧪 TESTING

```bash
# Run full test
node test_report_submission.js

# Expected output:
# ✓ Student Login
# ✓ Get Topics
# ✓ Submit Report
# ✓ Get My Reports
# ✓ Specialist Login
# ✓ Approve Report
# ✓ Get Approved Reports
```

---

## 📞 SUPPORT

Tham khảo:
- `REPORT_SUBMISSION_GUIDE.md` - Hướng dẫn chi tiết
- `REPORT_SUBMISSION_SUMMARY.md` - Tóm tắt kỹ thuật
- `FINAL_IMPLEMENTATION_REPORT.md` - Report hoàn thành
- `IMPLEMENTATION_CHECKLIST.txt` - Danh sách kiểm tra

---

**Status:** ✅ READY  
**Version:** 1.0.0  
**Happy Coding!** 🎉
