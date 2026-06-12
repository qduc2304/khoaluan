import {
    AppstoreOutlined,
    BarChartOutlined,
    BellOutlined,
    DashboardOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    LogoutOutlined,
    PlusOutlined,
    ProjectOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Col, Input, Layout, Menu, Row, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- Dữ liệu mẫu (Mock Data) ---
const mockData = [
  {
    key: '1',
    stt: 1,
    title: 'Ứng dụng AI trong nhận diện hình ảnh y tế',
    instructor: 'TS. Nguyễn Văn A',
    academic_year: '2023-2024',
    campaign: 'Đợt 1',
    status: 'approved',
  },
  {
    key: '2',
    stt: 2,
    title: 'Nghiên cứu vật liệu polymer thân thiện với môi trường',
    instructor: 'PGS.TS. Trần Thị B',
    academic_year: '2023-2024',
    campaign: 'Đợt 1',
    status: 'pending',
  },
  {
    key: '3',
    stt: 3,
    title: 'Xây dựng hệ thống quản lý IoT cho Smart Home',
    instructor: 'ThS. Lê Hoàng C',
    academic_year: '2023-2024',
    campaign: 'Đợt 2',
    status: 'rejected',
  },
];

const SpecialistDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Hàm render tag trạng thái
  const renderStatusTag = (status) => {
    const statusMap = {
      approved: { color: 'green', text: 'Đã duyệt' },
      pending: { color: 'orange', text: 'Chờ duyệt' },
      rejected: { color: 'red', text: 'Bị từ chối' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: 'Không xác định' };
    return <Tag color={color}>{text.toUpperCase()}</Tag>;
  };

  // Cấu hình các cột của bảng
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 60,
      align: 'center',
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'GVHD',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 180,
    },
    {
      title: 'Năm học',
      dataIndex: 'academic_year',
      key: 'academic_year',
      width: 120,
      align: 'center',
    },
    {
      title: 'Đợt thi',
      dataIndex: 'campaign',
      key: 'campaign',
      width: 100,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (status) => renderStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      align: 'center',
      fixed: 'right', // Ghim cột này cố định ở bên phải
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined style={{ color: '#1677ff', fontSize: '16px' }} />} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />} />
          </Tooltip>
          <Tooltip title="Xóa đề tài">
            <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '16px' }} />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Xử lý khi chọn checkbox
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* --- CỘT BÊN TRÁI: SIDEBAR --- */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={220}
        theme="dark"
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        {/* Sidebar Header */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
          <Title level={5} style={{ color: '#fff', margin: 0, fontSize: collapsed ? '12px' : '16px', transition: 'all 0.3s' }}>
            {collapsed ? 'NCKH' : 'NGHIÊN CỨU KHOA HỌC'}
          </Title>
        </div>

        {/* Menu Điều hướng */}
        <Menu
          theme="dark"
          defaultSelectedKeys={['4']}
          mode="inline"
          style={{ flex: 1, overflowY: 'auto', borderRight: 0, padding: '16px 0' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan' },
            { key: '2', icon: <UserOutlined />, label: 'Quản lý tài khoản' },
            { key: '3', icon: <AppstoreOutlined />, label: 'Quản lý đợt thi' },
            { key: '4', icon: <ProjectOutlined />, label: 'Quản lý đề tài' },
            { key: '5', icon: <BarChartOutlined />, label: 'Thống kê & Báo cáo' },
          ]}
        />

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #303030', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            {!collapsed && (
              <div style={{ marginLeft: 12, whiteSpace: 'nowrap' }}>
                <Text style={{ color: '#fff', display: 'block', fontSize: '14px' }} strong>Chuyên viên</Text>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button type="text" icon={<LogoutOutlined />} style={{ color: '#fff' }} title="Đăng xuất" />
          )}
        </div>
      </Sider>

      {/* --- CỘT BÊN PHẢI: MAIN CONTENT --- */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        {/* Thanh trên cùng */}
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0 }}>DANH SÁCH ĐỀ TÀI NCKH CÁC ĐỢT</Title>
          <Space size="large">
            <Button type="text" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
            <Space>
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Specialist" />
              <Text strong>Chuyên viên</Text>
            </Space>
          </Space>
        </Header>

        <Content style={{ margin: '16px', overflow: 'initial' }}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Khu vực Bộ Lọc và Thao Tác */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>Tìm kiếm đề tài:</Text>
              <Row gutter={[16, 16]} justify="space-between">
                <Col xs={24} md={18}>
                  <Space wrap>
                    <Select placeholder="Năm học" style={{ width: 120 }}>
                      <Option value="2023-2024">2023-2024</Option>
                      <Option value="2024-2025">2024-2025</Option>
                    </Select>
                    <Select placeholder="Đợt thi" style={{ width: 150 }}>
                      <Option value="dot1">Đợt 1</Option>
                      <Option value="dot2">Đợt 2</Option>
                    </Select>
                    <Select placeholder="Trạng thái" style={{ width: 140 }}>
                      <Option value="approved">Đã duyệt</Option>
                      <Option value="pending">Chờ duyệt</Option>
                      <Option value="rejected">Bị từ chối</Option>
                    </Select>
                    <Input 
                      placeholder="Nhập tên đề tài, GVHD..." 
                      prefix={<SearchOutlined />} 
                      style={{ width: 250 }} 
                    />
                    <Button type="primary" icon={<SearchOutlined />}>Tìm kiếm</Button>
                  </Space>
                </Col>
                <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#52c41a' }}>
                      Xuất CSV
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#1677ff' }}>
                      Thêm đề tài
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* Bảng Dữ Liệu */}
            <Table
              size="small"
              rowSelection={rowSelection}
              columns={columns}
              dataSource={mockData}
              bordered
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} đề tài`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SpecialistDashboardLayout;
