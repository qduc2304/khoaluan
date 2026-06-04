import {
  BarChartOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  EditOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Typography, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin user từ LocalStorage
  const role = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');

  // Sáng tạo: Tự động đăng xuất nếu trạng thái đăng nhập không hợp lệ (mất role)
  useEffect(() => {
    if (localStorage.getItem('accessToken') && !role) {
      handleLogout();
    }
  }, [role]);

  // Nếu chưa có role, không render gì cả để chờ useEffect xử lý
  if (!role) {
    return null;
  }

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Bảng điều khiển',
      roles: ['specialist', 'director']
    },
    // DÀNH CHO SINH VIÊN
    {
      key: '/student/register-topic',
      icon: <FileAddOutlined />,
      label: 'Đăng ký đề tài',
      roles: ['student']
    },
    {
      key: '/student/my-topics',
      icon: <ProjectOutlined />,
      label: 'Đề tài của tôi',
      roles: ['student']
    },
    {
      key: '/student/submit-report',
      icon: <FileAddOutlined />,
      label: 'Nộp Báo Cáo',
      roles: ['student']
    },
    // DÀNH CHO GIẢNG VIÊN (GVHD)
    {
      key: '/teacher/approve-topics',
      icon: <CheckCircleOutlined />,
      label: 'Duyệt đề tài',
      roles: ['instructor']
    },
    // DÀNH CHO HỘI ĐỒNG (BAN GIÁM KHẢO)
    {
      key: '/council/grade-topics',
      icon: <EditOutlined />,
      label: 'Chấm điểm',
      roles: ['council']
    },
    // DÀNH CHO CHUYÊN VIÊN VÀ GIÁM ĐỐC
    {
      key: '/faculty/topics',
      icon: <CheckCircleOutlined />,
      label: 'Quản lý đề tài tổng thể',
      roles: ['specialist', 'director']
    },
    // DÀNH CHO GIÁM ĐỐC & CHUYÊN VIÊN
    {
      key: '/admin/campaigns',
      icon: <TrophyOutlined />,
      label: 'Quản lý đợt thi & Đề tài',
      roles: ['director', 'specialist']
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
      roles: ['director', 'specialist']
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Thống kê & Báo cáo',
      roles: ['director', 'specialist']
    },
    {
      key: '/teacher/report-approval',
      icon: <FileDoneOutlined />,
      label: 'Phê duyệt Báo cáo',
      roles: ['instructor']
    },
    {
      key: '/reports/viewer',
      icon: <FileDoneOutlined />,
      label: 'Kho Báo Cáo',
      roles: ['student', 'instructor', 'specialist', 'director', 'council']
    }
  ].filter(item => item.roles.includes(role)); // Cốt lõi của phân quyền: Tự động giấu Menu nếu không đúng quyền

  // XỬ LÝ ĐĂNG XUẤT
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ của tôi', onClick: () => navigate('/profile') },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={280} theme="light" style={{ boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)', zIndex: 10 }}>
        <div style={{ height: 80, margin: 16, background: 'rgba(24, 144, 255, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {collapsed ? 'NCKH' : 'Quản lý NCKH'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ fontSize: '16px', fontWeight: 500 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ height: 80, padding: '0 32px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '22px', width: 80, height: 80 }} />
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 8, transition: 'background 0.3s' }} className="user-dropdown">
              <Avatar size={48} style={{ backgroundColor: '#1890ff', fontSize: '20px' }} icon={<UserOutlined />}>{userName ? userName.charAt(0).toUpperCase() : ''}</Avatar>
              <span style={{ fontWeight: 600, fontSize: '17px' }}>{userName || 'Người dùng'} <br/><span style={{ color: 'gray', fontSize: '13px', fontWeight: 400 }}>{role.toUpperCase()}</span></span>
            </div>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '32px', padding: 32, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG, fontSize: '16px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;