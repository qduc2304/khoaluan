import { CheckCircleOutlined, DeleteOutlined, EditOutlined, FileOutlined, InfoCircleOutlined, SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, InputNumber, List, message, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { topicService } from '../../services/topicService';
import { userService } from '../../services/userService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TopicManagement = ({ campaignId }) => {
  const [topics, setTopics] = useState([]);
  const [councilMembers, setCouncilMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search and Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fundingStatusFilter, setFundingStatusFilter] = useState('all');

  // States cho modal yêu cầu chỉnh sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');

  // States cho modal phân công
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignTopicId, setAssignTopicId] = useState(null);
  const [selectedCouncil, setSelectedCouncil] = useState([]);

  // States cho modal chi tiết
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // States cho modal Cập nhật & Kinh phí
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [updateForm] = Form.useForm();

  const role = localStorage.getItem('userRole');

  useEffect(() => {
    fetchTopics();
    fetchCouncilMembers();
  }, [campaignId]); // Thêm campaignId vào dependency array để component re-fetch khi prop thay đổi

  const fetchTopics = async () => {
    setLoading(true);
    try {
      // Gửi campaignId lên API để lọc ngay từ backend, giúp tối ưu và chính xác hơn
      const params = campaignId ? { campaign_id: campaignId } : {};
      const response = await topicService.getAllTopics(params);
      
      // Bóc tách dữ liệu linh hoạt tránh lỗi undefined
      let topicsData = [];
      if (Array.isArray(response)) topicsData = response;
      else if (response?.data && Array.isArray(response.data)) topicsData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data)) topicsData = response.data.data;

      setTopics(topicsData.map(item => ({ ...item, key: item.id })));
    } catch (error) {
      message.error('Không thể tải danh sách đề tài!');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouncilMembers = async () => {
    try {
      const data = await userService.getAllCouncilMembers();
      setCouncilMembers(data);
    } catch (error) {
      message.error('Không thể tải danh sách giám khảo!');
    }
  };

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchName = topic.title.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = statusFilter === 'all' || topic.status === statusFilter;
      const matchFundingStatus = fundingStatusFilter === 'all' || topic.funding_status === fundingStatusFilter;
      return matchName && matchStatus && matchFundingStatus;
    });
  }, [topics, searchText, statusFilter, fundingStatusFilter]);

  const handleUpdateStatus = async (id, newStatus, successMsg, extraData = {}) => {
    try {
      await topicService.updateTopicStatus(id, { status: newStatus, ...extraData });
      message.success(successMsg);
      fetchTopics(); // Tải lại danh sách để đảm bảo dữ liệu luôn mới
    } catch (error) {
      message.error('Lỗi khi cập nhật đề tài');
    }
  };

  const handleDeleteTopic = async (id) => {
    try {
      await topicService.deleteTopic(id);
      message.success('Đã xóa đề tài thành công!');
      setTopics(topics.filter(t => t.id !== id));
    } catch (error) {
      message.error('Lỗi khi xóa đề tài');
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

  const showUpdateModal = (record) => {
    setEditingTopic(record);
    updateForm.setFieldsValue({
      status: record.status,
      round_status: record.round_status,
      funding: record.funding,
      funding_status: record.funding_status || 'pending'
    });
    setIsUpdateModalVisible(true);
  };

  const handleUpdateProgress = async (values) => {
    try {
      const payload = { ...values };
      if (values.round_status !== editingTopic.round_status) {
        payload.average_score = null; // Yêu cầu backend reset điểm khi đổi vòng
      }
      await topicService.updateTopicStatus(editingTopic.id, payload);
      message.success('Cập nhật thông tin & kinh phí thành công!');
      setIsUpdateModalVisible(false);
      fetchTopics(); // Gọi lại API để tải danh sách mới
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật.');
    }
  };

  const showAssignModal = async (id) => {
    setAssignTopicId(id);
    setSelectedCouncil([]);
    setIsAssignModalVisible(true);
    
    const topic = topics.find(t => t.id === id);
    if (topic) {
      try {
        const response = await topicService.getTopicDetails(id);
        const currentAssigned = response.scores?.filter(s => s.level === topic.round_status).map(s => s.council_member_id) || [];
        setSelectedCouncil(currentAssigned);
      } catch (error) {}
    }
  };

  const handleAssignSubmit = async () => {
    if (selectedCouncil.length === 0) {
      message.error('Vui lòng chọn ít nhất một giám khảo!');
      return;
    }
    try {
      await topicService.assignTopic(assignTopicId, selectedCouncil);
      await topicService.updateTopicStatus(assignTopicId, { status: 'grading' });
      message.success('Đã phân công thành công!');
      setIsAssignModalVisible(false);
      setTopics(topics.map(t => t.id === assignTopicId ? { ...t, status: 'grading' } : t));
    } catch (error) {
      message.error('Lỗi khi phân công giám khảo');
    }
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
          {!campaignId && <Text type="secondary" style={{fontSize: '12px'}}>Đợt thi: {record.campaign_name} ({record.campaign_year})</Text>}
        </>
      )
    },
    { 
      title: 'Nhóm thực hiện', 
      dataIndex: 'student_name', 
      key: 'student_name',
      width: '20%',
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
          <Text type="secondary">Khoa: {record.faculty_name || 'N/A'} - Ngành: {record.major || 'N/A'}</Text>
        </div>
      )
    },
    {
      title: 'Giảng viên hướng dẫn',
      dataIndex: 'instructor_name',
      key: 'instructor_name',
      width: '15%',
    },
    {
      title: 'Kinh phí',
      dataIndex: 'funding',
      key: 'funding',
      width: '10%',
      render: (funding, record) => {
        if (!funding) return <Text type="secondary">Chưa cấp</Text>;
        const statusMap = {
          pending: { color: 'default', text: 'Chưa gửi' },
          proposed: { color: 'processing', text: 'Chờ duyệt' },
          approved: { color: 'success', text: 'Đã duyệt' },
          rejected: { color: 'error', text: 'Từ chối' },
        };
        const s = statusMap[record.funding_status] || statusMap.pending;
        return (
          <Space direction="vertical" size="small">
            <Text type="success">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(funding)}</Text>
            <Tag color={s.color}>{s.text}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Vòng thi',
      key: 'round_status',
      dataIndex: 'round_status',
      width: '10%',
      render: (round) => {
        const map = {
          1: { color: 'cyan', text: 'Cấp Khoa' },
          2: { color: 'magenta', text: 'Cấp Trường' },
          3: { color: 'gold', text: 'Hoàn thành' },
          0: { color: 'default', text: 'Dừng ở Khoa' },
        };
        const config = map[round] || { color: 'default', text: 'Chưa rõ' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      width: '10%',
      render: (score, record) => {
        if (record.status === 'approved') return <Text type="secondary">Chưa chấm</Text>;
        return score ? <Tag color="purple"><b>{parseFloat(score).toFixed(2)}</b></Tag> : <Text type="secondary">Chưa chấm</Text>;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      width: '15%',
      render: (status, record) => {
        const statusMap = {
          pending: { color: 'orange', text: 'Chờ duyệt' },
          instructor_approved: { color: 'cyan', text: 'Giảng viên đã duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          grading: { color: 'blue', text: 'Đang chấm' },
          revision_requested: { color: 'purple', text: 'Yêu cầu chỉnh sửa' },
          completed: { color: 'gold', text: 'Hoàn thành' },
          rejected: { color: 'red', text: 'Từ chối' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      fixed: 'right',
      width: '30%',
      render: (_, record) => {
        const canAction = record.status === 'pending' || record.status === 'instructor_approved';
        const canAssign = record.status === 'approved' || record.status === 'grading';
        return (
          <Space size="small" wrap>
            <Button icon={<InfoCircleOutlined />} onClick={() => showDetailsModal(record)}>
              Chi tiết
            </Button>
            <Button type="dashed" icon={<EditOutlined />} onClick={() => showUpdateModal(record)}>
              Cập nhật & KP
            </Button>
            {['director', 'specialist'].includes(role) && (
              <Popconfirm title="Xóa đề tài này vĩnh viễn?" onConfirm={() => handleDeleteTopic(record.id)} okText="Xóa" cancelText="Hủy">
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
            {String(record.funding_status).toLowerCase().trim() === 'proposed' && (
              <>
                <Button size="small" type="primary" style={{ backgroundColor: role === 'director' ? '#52c41a' : undefined, borderColor: role === 'director' ? '#52c41a' : undefined }} onClick={() => handleUpdateStatus(record.id, record.status, 'Đã duyệt kinh phí thành công!', { funding_status: 'approved' })} disabled={role !== 'director'} title={role !== 'director' ? "Chỉ Giám đốc mới có quyền duyệt" : ""}>Duyệt KP</Button>
                <Button size="small" type="primary" danger onClick={() => handleUpdateStatus(record.id, record.status, 'Đã từ chối kinh phí!', { funding_status: 'rejected' })} disabled={role !== 'director'} title={role !== 'director' ? "Chỉ Giám đốc mới có quyền duyệt" : ""}>Từ chối KP</Button>
              </>
            )}
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'approved', 'Đã phê duyệt đề tài thành công!')} disabled={!canAction}>Duyệt</Button>
            <Button icon={<EditOutlined />} onClick={() => showRevisionModal(record.id)} disabled={!canAction}>Yêu cầu sửa</Button>
            {canAssign && (
              <Button type="dashed" icon={<UsergroupAddOutlined />} onClick={() => showAssignModal(record.id)}>
                Phân công
              </Button>
            )}
            {record.status === 'grading' && record.round_status === 1 && (
              <>
                <Button size="small" style={{ color: '#eb2f96', borderColor: '#eb2f96' }} onClick={() => handleUpdateStatus(record.id, 'approved', 'Đã chuyển đề tài lên Vòng Trường!', { round_status: 2, average_score: null })}>Lên Vòng Trường</Button>
                <Button size="small" danger onClick={() => handleUpdateStatus(record.id, 'completed', 'Đề tài đã dừng ở Vòng Khoa.', { round_status: 0 })}>Dừng ở Khoa</Button>
              </>
            )}
            {record.status === 'grading' && record.round_status === 2 && (
              <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, 'completed', 'Đề tài đã hoàn thành xuất sắc!', { round_status: 3 })}>Hoàn thành</Button>
            )}
          </Space>
        );
      },
    },
  ];

  const content = (
    <>
      {!campaignId && <Title level={3} style={{ marginBottom: '20px', color: '#1890ff' }}>Quản lý Đề tài Nghiên cứu Khoa học</Title>}
      
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={10}>
          <Input 
            placeholder="Tìm kiếm theo tên đề tài..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={7}>
          <Select 
            style={{ width: '100%' }} 
            value={statusFilter} 
            onChange={setStatusFilter}
            placeholder="Lọc theo trạng thái"
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="pending">Chờ duyệt</Option>
            <Option value="instructor_approved">Giảng viên đã duyệt</Option>
            <Option value="approved">Đã duyệt (Chờ chấm)</Option>
            <Option value="grading">Đang chấm / Đã chấm</Option>
            <Option value="revision_requested">Yêu cầu chỉnh sửa</Option>
            <Option value="completed">Hoàn thành</Option>
          </Select>
        </Col>
        {['director', 'specialist'].includes(role) && (
          <Col xs={24} sm={24} md={7}>
            <Select
              style={{ width: '100%' }}
              value={fundingStatusFilter}
              onChange={setFundingStatusFilter}
              placeholder="Lọc theo trạng thái kinh phí"
            >
              <Option value="all">Tất cả kinh phí</Option>
              <Option value="proposed">Chờ duyệt kinh phí</Option>
              <Option value="approved">Đã duyệt kinh phí</Option>
              <Option value="rejected">Từ chối kinh phí</Option>
              <Option value="pending">Chưa gửi / Chưa cấp</Option>
            </Select>
          </Col>
        )}
      </Row>

      <Table columns={columns} dataSource={filteredTopics} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 'max-content' }} />
      
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
        title={`Cập nhật thông tin & Kinh phí: ${editingTopic?.title}`}
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        onOk={() => updateForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateProgress}>
          <Form.Item label="Vòng thi hiện tại" name="round_status" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>Vòng cấp Khoa (Sơ khảo)</Option>
              <Option value={2}>Vòng cấp Trường (Chung khảo)</Option>
              <Option value={3}>Đã Hoàn thành</Option>
              <Option value={0}>Dừng ở vòng Khoa</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Trạng thái hồ sơ" name="status" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">Mới nộp (Chờ GVHD)</Option>
              <Option value="instructor_approved">GVHD đã duyệt (Chờ Khoa)</Option>
              <Option value="approved">Đủ điều kiện duyệt</Option>
              <Option value="grading">Chuyển cho Hội đồng chấm</Option>
              <Option value="revision_requested">Yêu cầu SV chỉnh sửa</Option>
              <Option value="completed">Đã nghiệm thu / Đoạt giải</Option>
              <Option value="rejected">Đình chỉ / Hủy bỏ</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Kinh phí đề xuất (VNĐ)" name="funding">
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="Ví dụ: 5000000" 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(\.*)/g, '').replace(/,/g, '')}
                  min={0}
                  step={100000}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt" name="funding_status">
                <Select>
                  <Option value="pending">Chưa gửi duyệt</Option>
                  <Option value="proposed">Gửi Giám đốc duyệt</Option>
                  <Option value="approved" disabled={String(role).toLowerCase().trim() !== 'director'}>Đã được Giám đốc duyệt</Option>
                  <Option value="rejected" disabled={String(role).toLowerCase().trim() !== 'director'}>Bị Giám đốc từ chối</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Phân công Giám khảo"
        open={isAssignModalVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setIsAssignModalVisible(false)}
        okText="Lưu phân công"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 10 }}>Chọn các thành viên Hội đồng để chấm đề tài này:</div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Chọn giám khảo..."
          value={selectedCouncil}
          onChange={setSelectedCouncil}
          optionFilterProp="children"
        >
          {councilMembers.map(member => (
            <Option key={member.id} value={member.id}>
              {member.full_name} {member.faculty_name ? `(${member.faculty_name})` : ''}
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="Chi tiết Đề tài"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={() => {
          const footerButtons = [
            <Button key="close" onClick={() => setDetailsModalVisible(false)}>
              Đóng
            </Button>
          ];

          // Thêm nút Duyệt/Từ chối KP cho Giám đốc
          if (selectedTopic && String(selectedTopic.funding_status).toLowerCase().trim() === 'proposed') {
            footerButtons.unshift(
              <Button
                key="reject"
                danger
                disabled={role !== 'director'}
                title={role !== 'director' ? "Chỉ Giám đốc mới có quyền duyệt" : ""}
                onClick={() => {
                  handleUpdateStatus(selectedTopic.id, selectedTopic.status, 'Đã từ chối kinh phí!', { funding_status: 'rejected' });
                  setDetailsModalVisible(false); // Đóng modal sau khi hành động
                }}
              >
                Từ chối KP
              </Button>
            );
            footerButtons.unshift(
              <Button
                key="approve"
                type="primary"
                style={{ backgroundColor: role === 'director' ? '#52c41a' : undefined, borderColor: role === 'director' ? '#52c41a' : undefined }}
                disabled={role !== 'director'}
                title={role !== 'director' ? "Chỉ Giám đốc mới có quyền duyệt" : ""}
                onClick={() => {
                  handleUpdateStatus(selectedTopic.id, selectedTopic.status, 'Đã duyệt kinh phí thành công!', { funding_status: 'approved' });
                  setDetailsModalVisible(false); // Đóng modal sau khi hành động
                }}
              >
                Duyệt KP
              </Button>
            );
          }

          return footerButtons;
        }}
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
            <p>
              <strong>Kinh phí đề xuất/hỗ trợ:</strong>{' '}
              <Text type="success">{selectedTopic.funding ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTopic.funding) : 'Chưa cấp'}</Text>
              {selectedTopic.funding_status && selectedTopic.funding_status !== 'pending' && (
                <Tag style={{ marginLeft: 8 }} color={selectedTopic.funding_status === 'proposed' ? 'processing' : selectedTopic.funding_status === 'approved' ? 'success' : 'error'}>{selectedTopic.funding_status === 'proposed' ? 'Chờ duyệt' : selectedTopic.funding_status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Tag>
              )}
            </p>
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
              renderItem={item => {
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
                const safeFileUrl = item.file_url.startsWith('/') ? item.file_url : `/${item.file_url}`;
                return (
                  <List.Item
                    actions={[
                      <a href={`${backendUrl}${safeFileUrl}`} target="_blank" rel="noreferrer" download>Tải về</a>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                      title={item.file_name}
                      description={`Đã tải lên vào lúc: ${new Date(item.uploaded_at).toLocaleString('vi-VN')}`}
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );

  return campaignId ? <div>{content}</div> : <Card>{content}</Card>;
};

export default TopicManagement;