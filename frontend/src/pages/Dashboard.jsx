import { CheckCircleOutlined, ProjectOutlined, SyncOutlined } from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';
import api from '../services/api';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTopics: 0,
    pendingTopics: 0,
    completedTopics: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/topics/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Không thể tải dữ liệu thống kê:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, color: '#1890ff' }}>Bảng Điều Khiển Tổng Quan</Title>
      <Spin spinning={loading}>
        <Row gutter={16}>
          <Col span={8}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title="Tổng số đề tài NCKH"
                value={stats.totalTopics}
                prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title="Đề tài đang chờ duyệt"
                value={stats.pendingTopics}
                prefix={<SyncOutlined spin={stats.pendingTopics > 0} style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title="Đề tài đã hoàn thành"
                value={stats.completedTopics}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;