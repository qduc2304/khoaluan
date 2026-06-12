import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, FileOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Input, List, message, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { topicService } from '../../services/topicService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const renderStatusTag = (status) => {
  const statusMap = {
    pending: { color: 'orange', text: 'Chờ duyệt' },
    instructor_approved: { color: 'cyan', text: 'Đã đồng ý hướng dẫn' },
    approved: { color: 'green', text: 'Khoa đã duyệt' },
    grading: { color: 'blue', text: 'Đang chấm' },
    revision_requested: { color: 'purple', text: 'Yêu cầu chỉnh sửa' },
    completed: { color: 'gold', text: 'Hoàn thành' },
    rejected: { color: 'red', text: 'Từ chối' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: status };
  return <Tag color={color}>{text.toUpperCase()}</Tag>;
};

const ApproveTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Hàm xử lý ép tải file qua API (Force Download) để tránh lỗi chuyển trang / mở tab mới
  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) {
      message.warning('Không có file để tải!');
      return;
    }
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
    const safeFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    window.open(`${backendUrl}${safeFileUrl}`, '_blank');
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const data = await topicService.getInstructorTopics();
      setTopics(data.data ? data.data.map(item => ({ ...item, key: item.id })) : data.map(item => ({ ...item, key: item.id })));
    } catch (error) {
      message.error('Không thể tải danh sách đề tài!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, successMsg, extraData = {}) => {
    try {
      await topicService.updateTopicStatus(id, { status: newStatus, ...extraData });
      message.success(successMsg);
      setTopics(topics.map(t => t.id === id ? { ...t, status: newStatus, ...extraData } : t));
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  const showRevisionModal = (id) => {
    setCurrentTopicId(id);
    setRevisionReason('');
    setIsModalVisible(true);
  };

  const handleRevisionSubmit = () => {
    if (!revisionReason.trim()) {
      message.error('Vui lòng nhập lý do yêu cầu chỉnh sửa!');
      return;
    }
    handleUpdateStatus(currentTopicId, 'revision_requested', 'Đã yêu cầu sinh viên chỉnh sửa!', { revision_reason: revisionReason });
    setIsModalVisible(false);
  };

  const showDetailsModal = async (record) => {
    setSelectedTopic(record);
    setDetailsModalVisible(true);
    setLoadingDocs(true);
    try {
      const response = await api.get('/reports');
      const reports = (response.data || []).filter(r => r.topic_id === record.id);
      const formattedDocs = [];
      
      reports.forEach(report => {
        if (report.work_file_url) {
          formattedDocs.push({
            id: `work_${report.id}`,
            file_name: report.work_file_name || 'Báo cáo Word/PDF',
            file_url: report.work_file_url,
            uploaded_at: report.submitted_at
          });
        }
        if (report.pp_file_url) {
          formattedDocs.push({
            id: `pp_${report.id}`,
            file_name: report.pp_file_name || 'Slide PowerPoint',
            file_url: report.pp_file_url,
            uploaded_at: report.submitted_at
          });
        }
      });
      
      setDocuments(formattedDocs);
    } catch (error) {
      message.error('Lỗi khi tải tài liệu đính kèm');
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const columns = [
    { 
      title: 'Tên đề tài', 
      dataIndex: 'title', 
      key: 'title', 
      width: '25%', 
      render: (text, record) => (
        <>
          <Text strong>{text}</Text><br/>
          <Text type="secondary" style={{fontSize: '12px'}}>Đợt thi: {record.campaign_name} ({record.campaign_year})</Text>
        </>
      ) 
    },
    { 
      title: 'Nhóm thực hiện', 
      key: 'student_info', 
      width: '25%',
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <Text strong>Nhóm trưởng: {record.student_name}</Text><br/>
          {record.team_members && (() => {
            try {
              const members = JSON.parse(record.team_members);
              if (Array.isArray(members) && members.length > 0) {
                return <Text type="secondary">Thành viên: {members.map(m => `${m.full_name} (${m.student_code})`).join(', ')}</Text>;
              }
            } catch (e) { return <Text type="secondary">Thành viên: {record.team_members}</Text>; }
            return null;
          })()}<br/>
          <Text type="secondary">Khoa: {record.faculty_name || 'N/A'}</Text>
        </div>
      )
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: '15%', render: renderStatusTag },
    { title: 'Ngày nộp', dataIndex: 'created_at', key: 'created_at', render: date => new Date(date).toLocaleDateString('vi-VN') },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button icon={<EyeOutlined />} onClick={() => showDetailsModal(record)}>
            Chi tiết
          </Button>

          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="Xác nhận hướng dẫn"
                description="Bạn có đồng ý hướng dẫn đề tài này không?"
                onConfirm={() => handleUpdateStatus(record.id, 'instructor_approved', 'Bạn đã đồng ý hướng dẫn đề tài!')}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<CheckCircleOutlined />}>Đồng ý</Button>
              </Popconfirm>
              
              <Button 
                icon={<RollbackOutlined />} 
                onClick={() => showRevisionModal(record.id)}
              >
                Sửa
              </Button>

              <Popconfirm
                title="Từ chối hướng dẫn"
                description="Bạn có chắc chắn từ chối hướng dẫn đề tài này?"
                onConfirm={() => handleUpdateStatus(record.id, 'rejected', 'Đã từ chối hướng dẫn đề tài.')}
                okText="Từ chối" cancelText="Hủy"
              >
                <Button danger icon={<CloseCircleOutlined />}>Từ chối</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 20, color: '#1890ff' }}>Duyệt Đề Tài Hướng Dẫn</Title>
      <Table columns={columns} dataSource={topics} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 'max-content' }} />
      
      <Modal
        title="Yêu cầu chỉnh sửa đề tài"
        open={isModalVisible}
        onOk={handleRevisionSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 10 }}>Vui lòng nhập chi tiết lý do và nội dung cần chỉnh sửa:</div>
        <TextArea 
          rows={4} 
          value={revisionReason} 
          onChange={(e) => setRevisionReason(e.target.value)} 
          placeholder="Nhập lý do tại đây..."
        />
      </Modal>

      <Modal
        title="Chi tiết Đề tài"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>Đóng</Button>
        ]}
        width="95vw"
        style={{ top: 20 }}
        bodyStyle={{ height: '85vh', overflowY: 'auto' }}
      >
        {selectedTopic && (
          <div>
            <Title level={5}>{selectedTopic.title}</Title>
            <p><strong>Tên tiếng Anh:</strong> {selectedTopic.english_title || 'Không có'}</p>
            <p><strong>Đợt thi:</strong> {selectedTopic.campaign_name} ({selectedTopic.campaign_year})</p>
            <Divider orientation="left">Thông tin sinh viên thực hiện</Divider>
            <p><strong>Nhóm trưởng:</strong> {selectedTopic.student_name} - <strong>MSSV:</strong> {selectedTopic.student_code}</p>
            <p><strong>Lớp:</strong> {selectedTopic.class_name || 'Không có'} - <strong>Ngành:</strong> {selectedTopic.major || 'Không có'}</p>
            <p><strong>Khoa:</strong> {selectedTopic.faculty_name || 'Không có'}</p>
            <Divider orientation="left">Thông tin chi tiết đề tài</Divider>
            <p><strong>Lĩnh vực:</strong> {selectedTopic.field_of_study}</p>
            <p><strong>Giảng viên hướng dẫn:</strong> {selectedTopic.instructor_name || 'Không có'}</p>
            <p><strong>Thành viên nhóm:</strong> {selectedTopic.team_members ? (() => {
              try {
                const members = JSON.parse(selectedTopic.team_members);
                if (Array.isArray(members) && members.length > 0) {
                  return members.map(m => `${m.full_name} (${m.student_code})`).join(', ');
                }
              } catch (e) { return selectedTopic.team_members; }
              return 'Không có';
            })() : 'Không có'}</p>
            <Divider orientation="left">Tóm tắt nội dung</Divider>
            <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {selectedTopic.description}
            </div>
            
            <Divider orientation="left">Tài liệu đính kèm (Báo cáo)</Divider>
            <List
              loading={loadingDocs}
              itemLayout="horizontal"
              dataSource={documents}
              locale={{ emptyText: 'Chưa có tài liệu nào được tải lên.' }}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleDownload(item.file_url, item.file_name)}
                    >
                      Tải về
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={item.file_name}
                    description={`Đã tải lên vào lúc: ${new Date(item.uploaded_at).toLocaleString('vi-VN')}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ApproveTopics;
