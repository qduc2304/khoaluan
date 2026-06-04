# 🚀 Hướng Dẫn Chạy API Thực Tế

## Bước 1: Khởi Động Backend Server

**Option A - Windows Command Line:**
```bash
cd d:\khoaluan\backend
node server.js
```

**Option B - Double-click batch file:**
```
d:\khoaluan\start_server.bat
```

**Option C - Using npm:**
```bash
cd d:\khoaluan\backend
npm start
```

**Option D - Development mode (auto-restart):**
```bash
cd d:\khoaluan\backend
npm run dev
```

Bạn sẽ thấy:
```
Đã kết nối tới MySQL!
Backend Server đang chạy tại http://0.0.0.0:8080 (Truy cập được từ mạng LAN)
```

---

## Bước 2: Chạy API Tests (Terminal/CMD mới)

```bash
cd d:\khoaluan
node test_real_api.js
```

---

## 📋 API Endpoints Kiểm Thử

### 1. **Seed Endpoints** (Tạo dữ liệu mẫu)
```
GET /api/auth/seed
- Tạo tài khoản admin
- Email: quantri@truong.vn
- Password: 123456

GET /api/users/seed
- Tạo 5 tài khoản mẫu
- director, specialist, instructor, student, council
```

### 2. **Authentication** (Đăng nhập)
```
POST /api/auth/login
Body: { "email": "giamdoc@truong.vn", "password": "123456" }
Response: { "message": "...", "token": "jwt_token", "user": {...} }
```

### 3. **Protected Routes** (Cần JWT Token)
```
GET /api/users/profile
- Lấy thông tin cá nhân

GET /api/users/instructors
- Danh sách giảng viên

GET /api/users/faculties
- Danh sách khoa

GET /api/users/council
- Danh sách giám khảo (chỉ director/specialist)

GET /api/users
- Tất cả users (chỉ director/specialist)
```

---

## 🧪 Test Accounts

| Email | Password | Role | Tên |
|-------|----------|------|-----|
| quantri@truong.vn | 123456 | director | Quản Trị Viên |
| giamdoc@truong.vn | 123456 | director | Giám Đốc |
| chuyenvien@truong.vn | 123456 | specialist | Chuyên Viên |
| giangvien@truong.vn | 123456 | instructor | Giảng Viên |
| sinhvien@truong.vn | 123456 | student | Sinh Viên |
| hoidong@truong.vn | 123456 | council | Hội Đồng |

---

## 🔒 Authorization Levels

| Role | Có thể |
|------|--------|
| **director** | Tất cả API |
| **specialist** | Quản lý campaigns, topics, council members |
| **instructor** | Xem topics, update status, hướng dẫn SV |
| **student** | Tạo/sửa topic riêng, xem hướng dẫn |
| **council** | Xem assigned topics, scoring |

---

## 📊 Test Results Examples

```
╔════════════════════════════════════════════╗
║       REAL API TESTING - Chạy Thực Tế     ║
║     Backend must be running on :8080      ║
╚════════════════════════════════════════════╝

═══ TEST 1: Seed Admin Account (GET /api/auth/seed) ═══

→ GET /api/auth/seed
← 200 {"message":"Đã tạo tài khoản quantri@truong.vn/123456 thành công!"}
✓ Admin account seeded successfully
  Email: quantri@truong.vn
  Password: 123456
  Role: director

═══ TEST 2: Seed Sample Users (GET /api/users/seed) ═══

→ GET /api/users/seed
← 200 {"message":"Đã cập nhật/tạo 5 tài khoản mẫu thành công"}
✓ Sample users seeded successfully
  Created 5 test accounts:
    - ID 1: Giám Đốc (director)
    - ID 2: Chuyên Viên (specialist)
    - ID 3: Giảng Viên (instructor)
    - ID 4: Sinh Viên (student)
    - ID 5: Thành Viên Hội Đồng (council)

═══ TEST 3: Login Admin (POST /api/auth/login) ═══

→ POST /api/auth/login
Body: {"email":"quantri@truong.vn","password":"123456"}
← 200 Login successful
✓ Admin login successful
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  User: Quản Trị Viên
  Role: director

═══ TEST 4: Get User Profile (GET /api/users/profile) ═══

→ GET /api/users/profile
← 200 Profile retrieved
✓ User profile:
  ID: 1
  Name: Quản Trị Viên
  Email: quantri@truong.vn
  Role: director

...

═══ TEST SUMMARY ═══

✓ Seed Admin
✓ Seed Users
✓ Login Admin
✓ Get Profile
✓ Get Instructors
✓ Get Faculties
✓ Get All Users
✓ Invalid Token
✓ Without Token

═══════════════════════════════════════════
Result: 10 / 10 tests passed
✓ All API tests passed!
```

---

## 🐛 Troubleshooting

### Backend không khởi động
```
❌ Lỗi: ECONNREFUSED
✓ Giải pháp: Kiểm tra cổng 8080 có bị chiếm không
  netstat -ano | findstr :8080
  (Nếu có process, kill nó)
  taskkill /PID <PID> /F
```

### Database connection error
```
❌ Lỗi: Cannot find file `ca.pem`
✓ Giải pháp: Download ca.pem từ Aiven Cloud Dashboard
  - Đặt vào d:\khoaluan\backend\ca.pem
```

### JWT Token invalid
```
❌ Lỗi: "Not authorized, token failed"
✓ Giải pháp: 
  - Kiểm tra JWT_SECRET trong .env
  - Token có thể hết hạn (default: 1 ngày)
```

---

## 📊 Cấu Trúc Response

### Login Success (200)
```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "Quản Trị Viên",
    "email": "quantri@truong.vn",
    "role": "director"
  }
}
```

### Get Profile Success (200)
```json
{
  "id": 1,
  "full_name": "Quản Trị Viên",
  "email": "quantri@truong.vn",
  "student_code": null,
  "role": "director",
  "faculty_name": null,
  "major": null,
  "class_name": null,
  "created_at": "2026-05-18T10:30:00.000Z"
}
```

### Get Instructors Success (200)
```json
[
  { "id": 3, "full_name": "Giảng Viên Hướng Dẫn" }
]
```

### Unauthorized Error (401)
```json
{
  "message": "Not authorized, no token"
}
```

---

## 📝 Logging & Debugging

Backend logs sẽ hiện:
```
[Backend Error] Lỗi khi Login: ...
[Backend Error] Lỗi khi lấy danh sách giảng viên: ...
```

Test logs sẽ hiện (với màu):
```
✓ Admin account seeded successfully
✗ Connection failed
ⓘ Fetching data...
⚠ Token expiring soon
```

---

## 🔗 Full Testing Flow

1. **Seed dữ liệu**: `/api/auth/seed`, `/api/users/seed`
2. **Login**: `/api/auth/login` → nhận JWT token
3. **Protected routes**: Sử dụng token từ bước 2
4. **Authorization checks**: Director/specialist-only routes
5. **Verify data**: Query database trực tiếp

---

Chúc bạn kiểm thử thành công! 🚀
