import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, message, Modal, Popconfirm, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { userService } from '../../services/userService'; // Import service mới

const { Title } = Typography;
const { Option } = Select;

const FACULTY_MAJORS = {
  "Khoa Công nghệ và Kỹ thuật": ["Công nghệ thông tin", "Công nghệ kỹ thuật Cơ khí", "Công nghệ kỹ thuật Điện – Điện tử"],
  "Khoa Kinh tế và Quản trị": ["Kế toán", "Kinh tế", "Tài chính – Ngân hàng", "Quản trị kinh doanh"],
  "Khoa Luật, Chính trị học và Quan hệ Quốc tế": ["Luật học", "Chính trị học", "Quan hệ quốc tế"],
  "Khoa Khoa học Cơ bản": ["Toán học", "Lý luận chính trị", "Kiến thức đại cương", "Kỹ năng bổ trợ"]
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // State cho chức năng Sửa
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data.map(u => ({ ...u, key: u.id })));
    } catch (error) {
      message.error('Không thể tải danh sách người dùng!');
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreateUser = async (values) => {
    try {
      await userService.createUser(values);
      message.success('Tạo tài khoản mới thành công!');
      handleCancel();
      fetchUsers(); // Tải lại danh sách người dùng
    } catch (error) {
      message.error(error.response?.data?.message || 'Tạo tài khoản thất bại!');
    }
  };

  // Hàm mở modal sửa
  const showEditModal = (user) => {
    setEditingUserId(user.id);
    editForm.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      student_code: user.student_code,
      faculty_name: user.faculty_name,
      major: user.major,
      password: '', // Để trống nếu không muốn đổi mật khẩu
    });
    setIsEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
  };

  const handleEditUser = async (values) => {
    try {
      // Giả định bạn đã có hàm updateUser trong userService
      await userService.updateUser(editingUserId, values);
      message.success('Cập nhật tài khoản thành công!');
      handleEditCancel();
      fetchUsers(); // Tải lại danh sách người dùng
    } catch (error) {
      message.error(error.response?.data?.message || 'Cập nhật tài khoản thất bại!');
    }
  };

  // Hàm xử lý xóa tài khoản
  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      message.success('Đã xóa tài khoản thành công!');
      fetchUsers(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa tài khoản thất bại!');
    }
  };

  // Lọc người dùng theo tab đang chọn và tự động cập nhật khi state đổi
  const filteredUsers = useMemo(() => {
    let result = users;
    if (activeTab !== 'all') {
      result = result.filter(user => user.role === activeTab);
    }
    if (searchText) {
      result = result.filter(user => 
        (user.full_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (user.student_code || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return result;
  }, [users, activeTab, searchText]);

  const tabItems = [
    { key: 'all', label: `Tất cả (${users.length})` },
    { key: 'student', label: `Sinh viên (${users.filter(u => u.role === 'student').length})` },
    { key: 'instructor', label: `Giảng viên (${users.filter(u => u.role === 'instructor').length})` },
    { key: 'council', label: `Trợ lý Hội đồng (${users.filter(u => u.role === 'council').length})` },
    { key: 'specialist', label: `Chuyên viên (${users.filter(u => u.role === 'specialist').length})` },
    { key: 'director', label: `Giám đốc (${users.filter(u => u.role === 'director').length})` },
  ];

  const columns = [
    { title: 'Họ và Tên', dataIndex: 'full_name', key: 'full_name', fixed: 'left', width: 240, render: text => <strong>{text}</strong> },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 250 },
    {
      title: 'Vai trò', dataIndex: 'role', key: 'role', width: 160,
      render: role => {
        const colors = { director: 'volcano', instructor: 'purple', student: 'green', specialist: 'geekblue', council: 'cyan' };
        const roleNames = { director: 'Giám đốc', instructor: 'Giảng viên', student: 'Sinh viên', specialist: 'Chuyên viên', council: 'Trợ lý Hội đồng' };
        return <Tag color={colors[role] || 'blue'}>{(roleNames[role] || role)?.toUpperCase()}</Tag>;
      },
    },
    { title: 'Mã Định Danh (MSSV/MGV)', dataIndex: 'student_code', key: 'student_code', width: 200 },
    { title: 'Khoa', dataIndex: 'faculty_name', key: 'faculty_name', width: 260 },
    { title: 'Chuyên ngành', dataIndex: 'major', key: 'major', width: 220 },
    { 
      title: 'Hành động', key: 'action', fixed: 'right', width: 170, align: 'center',
      render: (_, record) => (
        <Space direction="horizontal" size="small">
          <Button size="small" type="dashed" icon={<EditOutlined />} onClick={() => showEditModal(record)} style={{ fontSize: '12px' }}>Sửa</Button>
          <Popconfirm
            title="Xóa tài khoản"
            description={`Bạn có chắc muốn xóa tài khoản ${record.full_name}?`}
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ fontSize: '12px' }}>Xóa</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  return (
    <Card style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Quản lý Người dùng</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>Tạo tài khoản mới</Button>
      </div>

      <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={10}>
            <Input 
              placeholder="Tìm kiếm theo Tên, Email, Mã số..." 
              prefix={<SearchOutlined />} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />
      <Table 
        size="middle"
        columns={columns} 
        dataSource={filteredUsers} 
        loading={loading} 
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`
        }} 
        bordered 
        scroll={{ x: 'max-content' }} 
        style={{ marginBottom: 24 }}
      />

      <Modal title="Tạo tài khoản người dùng mới" open={isModalVisible} onCancel={handleCancel} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateUser} style={{ marginTop: 24 }}>
          <Form.Item label="Họ và Tên" name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}><Input placeholder="VD: nguyenvana@example.com" /></Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}><Input.Password placeholder="Mật khẩu phải đủ mạnh" /></Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}>
            <Select placeholder="Chọn vai trò cho tài khoản">
              <Option value="student">Sinh viên</Option>
              <Option value="instructor">Giảng viên (Instructor)</Option>
              <Option value="specialist">Chuyên viên (Specialist)</Option>
              <Option value="council">Trợ lý Hội đồng</Option>
              <Option value="director">Giám đốc (Director)</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}>
            {({ getFieldValue }) => {
              const selectedRole = getFieldValue('role');
              const label = selectedRole === 'student' ? 'Mã sinh viên' : 'Mã định danh (MGV / Mã CB)';
              const placeholder = selectedRole === 'student' ? 'VD: 21103100000' : 'VD: GV001';
              return (
                <Form.Item label={label} name="student_code">
                  <Input placeholder={placeholder} />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item label="Tên khoa" name="faculty_name">
            <Select placeholder="Chọn khoa" allowClear onChange={() => form.setFieldsValue({ major: undefined })}>
              {Object.keys(FACULTY_MAJORS).map(faculty => (
                <Option key={faculty} value={faculty}>{faculty}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.faculty_name !== currentValues.faculty_name}>
            {({ getFieldValue }) => {
              const selectedFaculty = getFieldValue('faculty_name');
              const majors = selectedFaculty ? FACULTY_MAJORS[selectedFaculty] : [];
              return (
                <Form.Item label="Chuyên ngành" name="major">
                  <Select placeholder="Chọn chuyên ngành" allowClear disabled={!selectedFaculty}>
                    {majors.map(major => (
                      <Option key={major} value={major}>{major}</Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Tạo tài khoản</Button></Form.Item>
        </Form>
      </Modal>

      {/* Modal Sửa Tài Khoản */}
      <Modal title="Cập nhật tài khoản" open={isEditModalVisible} onCancel={handleEditCancel} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEditUser} style={{ marginTop: 24 }}>
          <Form.Item label="Họ và Tên" name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}><Input disabled placeholder="VD: nguyenvana@example.com" /></Form.Item>
          <Form.Item label="Mật khẩu mới (Bỏ trống nếu không đổi)" name="password"><Input.Password placeholder="Nhập mật khẩu mới nếu muốn đổi" /></Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}>
            <Select placeholder="Chọn vai trò cho tài khoản">
              <Option value="student">Sinh viên</Option>
              <Option value="instructor">Giảng viên (Instructor)</Option>
              <Option value="specialist">Chuyên viên (Specialist)</Option>
              <Option value="council">Trợ lý Hội đồng</Option>
              <Option value="director">Giám đốc (Director)</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}>
            {({ getFieldValue }) => {
              const selectedRole = getFieldValue('role');
              const label = selectedRole === 'student' ? 'Mã sinh viên' : 'Mã định danh (MGV / Mã CB)';
              const placeholder = selectedRole === 'student' ? 'VD: 21103100000' : 'VD: GV001';
              return (
                <Form.Item label={label} name="student_code">
                  <Input placeholder={placeholder} />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item label="Tên khoa" name="faculty_name">
            <Select placeholder="Chọn khoa" allowClear onChange={() => editForm.setFieldsValue({ major: undefined })}>
              {Object.keys(FACULTY_MAJORS).map(faculty => (
                <Option key={faculty} value={faculty}>{faculty}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.faculty_name !== currentValues.faculty_name}>
            {({ getFieldValue }) => {
              const selectedFaculty = getFieldValue('faculty_name');
              const majors = selectedFaculty ? FACULTY_MAJORS[selectedFaculty] : [];
              return (
                <Form.Item label="Chuyên ngành" name="major">
                  <Select placeholder="Chọn chuyên ngành" allowClear disabled={!selectedFaculty}>
                    {majors.map(major => (
                      <Option key={major} value={major}>{major}</Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Lưu thay đổi</Button></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;