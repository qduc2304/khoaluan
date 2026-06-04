# Report Submission Feature 📋

## Overview

A complete report submission system that allows students to submit work and PowerPoint files, which are then reviewed and approved by specialists/directors before being publicly shared.

## Features

### 🎓 For Students
- ✅ Submit work and/or PP files for each topic
- ✅ Track submission history and approval status
- ✅ View approval feedback from specialists
- ✅ Access publicly approved reports

### 👨‍💼 For Specialists/Directors
- ✅ Review all submitted reports
- ✅ Approve or reject work and PP separately
- ✅ Add feedback notes
- ✅ Track approval history

### 👥 For All Users
- ✅ Search and filter approved reports
- ✅ Download approved files
- ✅ View student and topic information
- ✅ Track approval metadata

## Architecture

### Database Schema

```sql
CREATE TABLE student_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                         -- Student who submitted
    topic_id INT,                                    -- Associated topic
    work_file_url VARCHAR(500),                      -- Work file location
    work_file_name VARCHAR(255),                     -- Original work filename
    pp_file_url VARCHAR(500),                        -- PP file location
    pp_file_name VARCHAR(255),                       -- Original PP filename
    work_approved ENUM('pending','approved','rejected') DEFAULT 'pending',
    pp_approved ENUM('pending','approved','rejected') DEFAULT 'pending',
    approval_notes TEXT,                             -- Feedback from approver
    approved_by INT,                                 -- Who approved it
    approved_at TIMESTAMP NULL,                      -- When approved
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### API Endpoints

#### 1. Submit Report
```http
POST /api/reports/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

Parameters:
- topic_id (required): ID of the topic
- work (optional): Work file
- pp (optional): PowerPoint file

Response:
{
  "message": "Báo cáo đã được nộp thành công!",
  "reportId": 123
}
```

#### 2. Get Reports
```http
GET /api/reports
Authorization: Bearer {token}

Query Parameters:
- student_id (optional): Only for specialist/director
- topic_id (optional): Filter by topic

Response:
[
  {
    "id": 1,
    "student_id": 4,
    "student_name": "Sinh Viên Nghiên Cứu",
    "topic_id": 1,
    "topic_title": "Nghiên cứu AI",
    "work_file_url": "/uploads/1234567-work.pdf",
    "work_approved": "pending",
    "pp_file_url": "/uploads/1234567-pp.pptx",
    "pp_approved": "approved",
    "submitted_at": "2026-05-25T10:30:00Z"
  }
]
```

#### 3. Approve Report
```http
PATCH /api/reports/{report_id}/approve
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "work_status": "approved|rejected",  // Optional
  "pp_status": "approved|rejected",    // Optional
  "notes": "Your feedback here"        // Optional
}

Response:
{
  "message": "Báo cáo đã được phê duyệt!"
}
```

#### 4. Get Approved Reports (Public)
```http
GET /api/reports/approved/list

Query Parameters:
- student_id (optional): Filter by student
- topic_id (optional): Filter by topic

Response:
[
  {
    "id": 1,
    "student_name": "Sinh Viên",
    "student_email": "sv@truong.vn",
    "topic_title": "Topic Name",
    "work_file_url": "/uploads/file-work.pdf",
    "work_file_name": "Report.pdf",
    "pp_file_url": "/uploads/file-pp.pptx",
    "pp_file_name": "Presentation.pptx",
    "work_approved": "approved",
    "pp_approved": "approved",
    "approval_notes": "Excellent work!",
    "approved_by_name": "Specialist Name",
    "approved_at": "2026-05-25T11:00:00Z"
  }
]
```

## Frontend Components

### 1. ReportSubmission.jsx
Student submission form with two tabs:
- **Submit Tab**: Upload work and/or PP files
- **History Tab**: View submission history and status

**Usage:**
```jsx
import ReportSubmission from './pages/Student/ReportSubmission';

// Route: /student/submit-report
```

### 2. ReportViewer.jsx
Public report viewer for all users:
- Search by student name/email
- Filter by file type (Work, PP, All)
- Download approved files
- View approval details

**Usage:**
```jsx
import ReportViewer from './pages/ReportViewer';

// Route: /reports/viewer
```

### 3. ReportApproval.jsx
Admin panel for approving reports:
- List pending reports
- Approve/reject with optional notes
- Modal confirmation
- Filter by status

**Usage:**
```jsx
import ReportApproval from './pages/Admin/ReportApproval';

// Route: /admin/approve-reports
```

## Role-Based Access Control

| Role | Submit | View Own | View All | Approve | View Public |
|------|:------:|:--------:|:--------:|:-------:|:-----------:|
| Student | ✅ | ✅ | ❌ | ❌ | ✅ |
| Instructor | ❌ | ❌ | ✅ | ✅ | ✅ |
| Specialist | ❌ | ❌ | ✅ | ✅ | ✅ |
| Director | ❌ | ❌ | ✅ | ✅ | ✅ |
| Council | ❌ | ❌ | ❌ | ❌ | ✅ |

## File Management

### Storage
- Location: `backend/uploads/`
- Naming convention: `{timestamp}-{random}.{ext}`
- Public URL: `/uploads/{filename}`

### Supported File Types
- Work: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xlsx`, `.xls`
- PP: `.pdf`, `.ppt`, `.pptx`

### Security
- Files are stored outside public directory
- Served through Express static middleware
- Automatic cascade delete with database records

## Implementation Details

### Backend Flow
1. Student submits form with files
2. Multer middleware validates and stores files
3. API creates/updates student_reports record
4. File URLs stored in database
5. Specialist retrieves and reviews
6. Specialist approves/rejects with feedback
7. Status updated in database
8. Public endpoint returns only approved reports

### Frontend Flow
1. Student logs in and navigates to submit page
2. Form validates topic and file selections
3. FormData sent with files to API
4. Success message displayed
5. History tab updated
6. Admin can navigate to approval page
7. Admin reviews and approves
8. Report appears in public viewer

## Installation & Setup

### 1. Database
```bash
cd backend
mysql -u root -p < database.sql
```

### 2. Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 4. Test
```bash
node test_report_submission.js
```

## Testing

### Test Cases
- ✅ Student login and topic retrieval
- ✅ Report submission with files
- ✅ Retrieve student's own reports
- ✅ Specialist login
- ✅ Report approval with feedback
- ✅ Public report listing (no auth required)
- ✅ Search and filter functionality

### Run Tests
```bash
node test_report_submission.js
```

Expected output:
```
✓ Student Login
✓ Get Topics
✓ Submit Report
✓ Get My Reports
✓ Specialist Login
✓ Approve Report
✓ Get Approved Reports
```

## File Structure

```
backend/
├── database.sql                    # DB schema with student_reports
├── controllers/
│   └── reportController.js         # API logic
├── routes/
│   └── reportRoutes.js             # API routes
├── uploads/                        # File storage
└── middleware/
    └── uploadMiddleware.js         # Multer config

frontend/
├── src/
│   ├── App.jsx                     # Routes (updated)
│   ├── pages/
│   │   ├── Student/
│   │   │   ├── ReportSubmission.jsx    # Student form
│   │   │   └── ReportSubmission.css
│   │   ├── Admin/
│   │   │   ├── ReportApproval.jsx      # Admin panel
│   │   │   └── ReportApproval.css
│   │   ├── ReportViewer.jsx            # Public viewer
│   │   └── ReportViewer.css
```

## Documentation

- `REPORT_SUBMISSION_GUIDE.md` - User guide (Vietnamese)
- `REPORT_SUBMISSION_SUMMARY.md` - Technical summary (Vietnamese)
- `QUICK_START_REPORT_FEATURE.md` - Quick start guide (Vietnamese)
- `FINAL_IMPLEMENTATION_REPORT.md` - Complete report (Vietnamese)
- `IMPLEMENTATION_CHECKLIST.txt` - Checklist (Vietnamese)

## Troubleshooting

### Upload Errors
- Check file size limits
- Verify file format
- Ensure `backend/uploads` directory has write permissions

### Permission Denied
- Only Specialist/Director/Instructor can approve
- Students can only submit for their own topics
- Check user role in localStorage

### Database Errors
- Run migration: `mysql -u root -p < database.sql`
- Verify MySQL connection details
- Check database user permissions

### API Connection
- Verify backend server is running
- Check API_URL in frontend .env
- Verify CORS configuration in server.js

## Security Considerations

✅ Token-based authentication  
✅ Role-based access control  
✅ File validation (type and size)  
✅ SQL injection prevention (parameterized queries)  
✅ File storage outside web root  
✅ Cascade delete for data integrity  
✅ User ownership verification  

## Future Enhancements

- 📧 Email notifications on approval
- 📊 Report statistics dashboard
- 💬 Comments/feedback on specific files
- 📅 Submission deadline enforcement
- 🔍 Full-text search on file contents
- 📥 Bulk import/export reports
- 🌐 Multi-language support
- 📱 Mobile app integration

## Support

For issues or questions, refer to:
1. `QUICK_START_REPORT_FEATURE.md` - Quick start
2. `REPORT_SUBMISSION_GUIDE.md` - Detailed guide
3. `test_report_submission.js` - Code examples
4. API documentation above

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-25  
**Status:** Production Ready ✅
