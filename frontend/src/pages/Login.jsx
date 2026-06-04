import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Sử dụng authService để đăng nhập
      const response = await authService.login({
        email: values.email,
        password: values.password
      });

      // Hàm login ở authService đã lưu accessToken, chúng ta chỉ cần lưu thêm thông tin user
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userName', response.user.full_name);

      message.success('Đăng nhập thành công!');
      
      // Chuyển hướng vào trang chính (Dashboard)
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-title-container">
          <h1 className="login-title-main">
            Xây dựng Website quản lý Hội thi nghiên cứu khoa học của Sinh viên Trường Đại học Thái Bình
          </h1>
          <p className="login-title-sub">
            Hệ thống Đăng nhập
          </p>
        </div>

        <Form name="login_form" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email (vd: admin@example.com)" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu (vd: 123456)" size="large" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;