import {
  AppstoreOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EditOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, ConfigProvider, Dropdown, Layout, Menu, Typography, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin user từ LocalStorage
  const role = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');

  // Tự động đăng xuất nếu trạng thái đăng nhập không hợp lệ
  useEffect(() => {
    if (localStorage.getItem('accessToken') && !role) {
      handleLogout();
    }
  }, [role]);

  // Nếu chưa có role, chờ useEffect xử lý
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
      icon: <UploadOutlined />,
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
      icon: <AppstoreOutlined />,
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
      icon: <DatabaseOutlined />,
      label: 'Kho Báo Cáo',
      roles: ['student', 'instructor', 'specialist', 'director', 'council']
    }
  ].filter(item => item.roles.includes(role));
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ của tôi', onClick: () => navigate('/profile') },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout }
  ];

 return (
  <ConfigProvider 
    theme={{ 
      algorithm: theme.compactAlgorithm,
      token: {
        fontSize: 13,
      }
    }}
  >
    <Layout hasSider style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={200} 
        theme="light" 
        style={{ 
          overflow: 'auto',
          height: '100vh',
          background: '#ffffff', 
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)', 
          zIndex: 10 
        }}
      >
        <div 
          onClick={() => navigate('/')}
          style={{ 
            height: 56, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: collapsed ? '4px 8px' : '8px 16px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {/* FIX LỖI LOGO: Thêm borderRadius 50% để tự cắt góc viền đen vuông */}
          <img 
            src="/logo.png" 
            alt="Logo Đại học Thái Bình" 
            style={{ 
              height: collapsed ? '26px' : '36px', 
              width: collapsed ? '26px' : '36px',
              maxWidth: '100%', 
              objectFit: 'cover', 
              display: 'block', 
              transition: 'all 0.2s',
              borderRadius: '60%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ 
            fontSize: '13px', 
            fontWeight: 500, 
            borderRight: 0, 
            background: 'transparent',
            marginTop: 10
          }}
        />
      </Sider>
      
      {/* FIX LỖI Ô TRỐNG: Đổi chiều cao Layout con thành 100% ăn theo Layout tổng */}
      <Layout style={{ background: '#f0f2f5', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header style={{ height: 56, flexShrink: 0, padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', zIndex: 2 }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 56, height: 56 }} />
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 8, transition: 'all 0.3s' }} className="user-dropdown">
              <Avatar size={32} style={{ backgroundColor: '#1890ff', fontSize: '14px' }} icon={<UserOutlined />}>{userName ? userName.charAt(0).toUpperCase() : ''}</Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{userName || 'Người dùng'}</span>
                <span className="notranslate" style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 400 }}>{role.toUpperCase()}</span>
              </div>
            </div>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '16px', flex: '1 1 auto', overflowY: 'auto' }}>
          <Outlet />
        </Content>

      </Layout>
    </Layout>
  </ConfigProvider>
  );
};

export default MainLayout;