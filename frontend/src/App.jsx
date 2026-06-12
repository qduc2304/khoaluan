import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CampaignManagement from './pages/Admin/CampaignManagement'; // Thêm import module Đợt thi
import FacultyTopicManagement from './pages/Admin/FacultyTopicManagement'; // Thêm import Quản lý cấp Khoa
import ReportApproval from './pages/Admin/ReportApproval';
import Reports from './pages/Admin/Reports'; // Thêm import module Báo cáo
import UserManagement from './pages/Admin/UserManagement'; // Thêm import
import GradeTopics from './pages/Council/GradeTopics'; // Thêm import module Chấm điểm
import Dashboard from './pages/Dashboard';
import ApproveTopics from './pages/Instructor/ApproveTopics'; // Đã trả về đúng thư mục
import Login from './pages/Login';
import Profile from './pages/Profile'; // Thêm import Profile
import ReportSubmission from './pages/ReportSubmission'; // Thêm import module Nộp báo cáo
import ReportViewer from './pages/ReportViewer'; // Thêm import module Xem báo cáo
import MyTopics from './pages/Student/MyTopics'; // Thêm import
import TopicRegistration from './pages/Student/TopicRegistration';

// Component bảo vệ Route kèm theo kiểm tra quyền (Role-based Authorization)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole'); 

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Nếu user không có quyền hợp lệ, đá về trang báo lỗi 403
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// Component tạm thời cho các tính năng chưa phát triển
const ComingSoon = ({ title }) => <div style={{ padding: 50, textAlign: 'center' }}><h2>{title}</h2><p>Tính năng đang trong quá trình phát triển.</p></div>;

// Cấu hình các route được bảo mật
const protectedRoutes = [
  // DÀNH CHO TẤT CẢ MỌI NGƯỜI
  { path: 'profile', component: <Profile />, roles: ['student', 'instructor', 'specialist', 'director', 'council'] },
  { path: 'reports/viewer', component: <ReportViewer />, roles: ['student', 'instructor', 'specialist', 'director', 'council'] },
  // CHỈ DÀNH CHO SINH VIÊN
  { path: 'student/register-topic', component: <TopicRegistration />, roles: ['student'] },
  { path: 'student/my-topics', component: <MyTopics />, roles: ['student'] },
  { path: 'student/submit-report', component: <ReportSubmission />, roles: ['student'] },
  // CHỈ DÀNH CHO GIẢNG VIÊN (GVHD)
  { path: 'teacher/approve-topics', component: <ApproveTopics />, roles: ['instructor'] },
  // CHỈ DÀNH CHO HỘI ĐỒNG
  { path: 'council/grade-topics', component: <GradeTopics />, roles: ['council'] },
  // CHỈ DÀNH CHO CHUYÊN VIÊN & GIÁM ĐỐC
  { path: 'faculty/topics', component: <FacultyTopicManagement />, roles: ['director', 'specialist'] },
  { path: 'admin/campaigns', component: <CampaignManagement />, roles: ['director', 'specialist'] },
  { path: 'admin/users', component: <UserManagement />, roles: ['director', 'specialist'] },
  { path: 'admin/reports', component: <Reports />, roles: ['director', 'specialist'] },
  { path: 'teacher/report-approval', component: <ReportApproval />, roles: ['instructor'] },
];

const RoleBasedHome = () => {
  const role = localStorage.getItem('userRole');
  if (['director', 'specialist'].includes(role)) return <Dashboard />;
  if (role === 'student') return <Navigate to="/student/my-topics" replace />;
  if (role === 'instructor') return <Navigate to="/teacher/approve-topics" replace />;
  if (role === 'council') return <Navigate to="/council/grade-topics" replace />;
  return <Navigate to="/profile" replace />;
};

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Nhóm các route có dùng MainLayout */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<RoleBasedHome />} />
          
          {/* Render các tuyến đường từ mảng cấu hình */}
          {protectedRoutes.map(({ path, component, roles }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={roles}>
                  {component}
                </ProtectedRoute>
              }
            />
          ))}

          {/* Trang cảnh báo không có quyền */}
          <Route path="unauthorized" element={<div style={{ padding: 50, textAlign: 'center' }}><h2>403 - Bạn không có quyền truy cập chức năng này!</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}