import { Button, Card, Col, Form, Input, message, Row, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const FACULTY_MAJORS = {
  "Khoa Công nghệ và Kỹ thuật": ["Công nghệ thông tin", "Công nghệ kỹ thuật Cơ khí", "Công nghệ kỹ thuật Điện – Điện tử"],
  "Khoa Kinh tế và Quản trị": ["Kế toán", "Kinh tế", "Tài chính – Ngân hàng", "Quản trị kinh doanh"],
  "Khoa Luật, Chính trị học và Quan hệ Quốc tế": ["Luật học", "Chính trị học", "Quan hệ quốc tế"],
  "Khoa Khoa học Cơ bản": ["Toán học", "Lý luận chính trị", "Kiến thức đại cương", "Kỹ năng bổ trợ"]
};

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const role = localStorage.getItem('userRole');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      form.setFieldsValue({
        full_name: response.data.full_name,
        email: response.data.email,
        student_code: response.data.student_code,
        faculty_name: response.data.faculty_name,
        major: response.data.major,
        class_name: response.data.class_name,
        role: response.data.role === 'student' ? 'Sinh viên' : 
              response.data.role === 'instructor' ? 'Giảng viên' : 
              response.data.role === 'specialist' ? 'Chuyên viên' : 
              response.data.role === 'director' ? 'Giám đốc' : 'Hội đồng'
      });
    } catch (error) {
      message.error('Không thể tải thông tin hồ sơ.');
    }
  };

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      await api.put('/users/profile', values);
      message.success('Cập nhật hồ sơ thành công!');
      // Cập nhật lại tên hiển thị trên header nếu có đổi tên
      if (values.full_name) {
        localStorage.setItem('userName', values.full_name);
        window.location.reload(); // Reload nhẹ để MainLayout nhận diện tên mới
      }
      form.setFieldValue('password', ''); // Xóa ô mật khẩu sau khi đổi
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Title level={3} style={{ color: '#1890ff', marginBottom: 24 }}>Hồ Sơ Cá Nhân</Title>
      <Form form={form} layout="vertical" onFinish={handleUpdate}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email (Không thể thay đổi)">
              <Input disabled style={{ backgroundColor: '#f5f5f5', color: '#888' }} />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item name="faculty_name" label="Khoa">
              <Select placeholder="Chọn khoa (Nếu có)" allowClear onChange={() => form.setFieldsValue({ major: undefined })}>
                {Object.keys(FACULTY_MAJORS).map(f => <Option key={f} value={f}>{f}</Option>)}
              </Select>
            </Form.Item>
          </Col>

          {role === 'student' && (
            <>
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.faculty_name !== currentValues.faculty_name}>
                {({ getFieldValue }) => {
                  const selectedFaculty = getFieldValue('faculty_name');
                  const majors = selectedFaculty ? FACULTY_MAJORS[selectedFaculty] : [];
                  return (
                    <Col span={12}>
                      <Form.Item label="Chuyên ngành" name="major">
                        <Select placeholder="Chọn chuyên ngành" allowClear disabled={!selectedFaculty}>
                          {majors.map(major => (
                            <Option key={major} value={major}>{major}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  );
                }}
              </Form.Item>
              <Col span={12}>
                <Form.Item name="student_code" label="Mã số sinh viên">
                  <Input placeholder="Ví dụ: 21103100... (Tùy chọn)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="class_name" label="Lớp sinh hoạt">
                  <Input placeholder="Ví dụ: KTPM K15..." />
                </Form.Item>
              </Col>
            </>
          )}
          <Col span={12}>
            <Form.Item name="password" label="Mật khẩu mới (Để trống nếu không đổi)">
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="role" label="Vai trò">
              <Input disabled style={{ backgroundColor: '#f5f5f5', color: '#888', fontWeight: 'bold' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Lưu Thay Đổi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Profile;