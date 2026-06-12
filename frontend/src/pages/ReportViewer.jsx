import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Select, Table, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

export default function ReportViewer() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Lấy lịch sử báo cáo từ backend
      const response = await api.get('/reports');
      
      let reportsData = [];
      if (Array.isArray(response)) reportsData = response;
      else if (response?.data && Array.isArray(response.data)) reportsData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data)) reportsData = response.data.data;
      
      setReports(reportsData);
    } catch (error) {
      message.error('Không thể tải dữ liệu báo cáo từ máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    const map = {
      pending: { color: 'orange', text: 'Chờ duyệt' },
      approved: { color: 'green', text: 'Đã duyệt' },
      rejected: { color: 'red', text: 'Từ chối' },
    };
    const conf = map[status] || { color: 'default', text: 'Chưa nộp' };
    return <Tag color={conf.color}>{conf.text}</Tag>;
  };

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) {
      message.warning('Không có file để tải!');
      return;
    }
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
    const safeFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    window.open(`${backendUrl}${safeFileUrl}`, '_blank');
  };

  const columns = [
    { title: 'Tên Đề tài', dataIndex: 'topic_title', key: 'topic_title', width: '30%' },
    { title: 'Sinh viên', dataIndex: 'student_name', key: 'student_name', width: '20%' },
    { title: 'Ngày nộp', dataIndex: 'submitted_at', key: 'submitted_at', render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    { 
      title: 'Báo cáo (Word/PDF)', 
      key: 'work',
      render: (_, record) => (
        <div>
          {record.work_file_url ? (
            <Button 
              type="link" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.work_file_url, record.work_file_name || 'Bao_Cao_Work')}
              style={{ padding: 0 }}
            >
              Tải về
            </Button>
          ) : <span style={{ color: '#ccc' }}>Chưa có</span>}
          <br/>
          {record.work_file_url && renderStatus(record.work_approved)}
        </div>
      )
    },
    { 
      title: 'Slide (PPT/PDF)', 
      key: 'pp',
      render: (_, record) => (
        <div>
          {record.pp_file_url ? (
            <Button 
              type="link" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.pp_file_url, record.pp_file_name || 'Slide_Trinh_Chieu')}
              style={{ padding: 0 }}
            >
              Tải về
            </Button>
          ) : <span style={{ color: '#ccc' }}>Chưa có</span>}
          <br/>
          {record.pp_file_url && renderStatus(record.pp_approved)}
        </div>
      )
    },
    { title: 'Ghi chú', dataIndex: 'notes', key: 'notes' }
  ];

  const filteredReports = useMemo(() => {
    return (Array.isArray(reports) ? reports : []).filter(report => {
      const matchSearch = (report.topic_title || '').toLowerCase().includes(searchText.toLowerCase()) ||
                          (report.student_name || '').toLowerCase().includes(searchText.toLowerCase());
      let matchStatus = true;
      if (statusFilter !== 'all') {
        matchStatus = report.work_approved === statusFilter || report.pp_approved === statusFilter;
      }
      return matchSearch && matchStatus;
    });
  }, [reports, searchText, statusFilter]);

  return (
    <Card>
      <Title level={3} style={{ color: '#1890ff', marginBottom: 20 }}>Lịch sử & Theo dõi Báo cáo</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={10}>
          <Input 
            placeholder="Tìm kiếm theo tên đề tài, tên sinh viên..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select style={{ width: '100%' }} value={statusFilter} onChange={setStatusFilter}>
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="pending">Chờ duyệt</Option>
            <Option value="approved">Đã duyệt</Option>
            <Option value="rejected">Từ chối</Option>
          </Select>
        </Col>
      </Row>

      <Table columns={columns} dataSource={filteredReports} loading={loading} rowKey="id" bordered pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Chưa có dữ liệu báo cáo nào' }} />
    </Card>
  );
}