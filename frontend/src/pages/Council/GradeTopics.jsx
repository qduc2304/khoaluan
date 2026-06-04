import { ArrowLeftOutlined, EditOutlined, EyeOutlined, FileOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, InputNumber, List, message, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const GradeTopics = () => {
  const [viewMode, setViewMode] = useState('campaigns'); // 'campaigns' | 'topics'
  const [ongoingCampaigns, setOngoingCampaigns] = useState([]); // Đợt thi đang diễn ra
  const [gradedCampaigns, setGradedCampaigns] = useState([]); // Đợt thi đã chấm xong
  const [completedCampaigns, setCompletedCampaigns] = useState([]); // Đợt thi đã hoàn thành
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all'); // Thêm state cho bộ lọc vòng chấm

  // Grade Modal
  const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
  const [gradingTopic, setGradingTopic] = useState(null);
  const [form] = Form.useForm();

  // Details Modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Phân loại đề tài đã chấm và chưa chấm trong một đợt thi
  const ungradedTopics = useMemo(() => topics.filter(topic => {
    if (topic.total_score != null) return false;
    if (levelFilter !== 'all' && Number(topic.score_level || topic.round_status) !== Number(levelFilter)) return false;
    return true;
  }), [topics, levelFilter]);
  
  const gradedTopicsInCampaign = useMemo(() => topics.filter(topic => {
    if (topic.total_score == null || topic.status === 'completed') return false;
    if (levelFilter !== 'all' && Number(topic.score_level || topic.round_status) !== Number(levelFilter)) return false;
    return true;
  }), [topics, levelFilter]);
  
  const completedTopicsInCampaign = useMemo(() => topics.filter(topic => {
    if (topic.total_score == null || topic.status !== 'completed') return false;
    if (levelFilter !== 'all' && Number(topic.score_level || topic.round_status) !== Number(levelFilter)) return false;
    return true;
  }), [topics, levelFilter]);

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
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Lấy tất cả đề tài được phân công, sau đó nhóm theo đợt thi
      const response = await api.get('/topics/assigned');
      // Sửa lỗi: Dữ liệu nằm trong response.data.data
      const assignedTopics = response.data.data || [];
      
      const campaignsMap = new Map();
      assignedTopics.forEach(topic => {
        if (!campaignsMap.has(topic.campaign_id)) {
          campaignsMap.set(topic.campaign_id, {
            id: topic.campaign_id,
            name: topic.campaign_name,
            academic_year: topic.campaign_year,
            status: topic.campaign_status,
            topics: []
          });
        }
        // Sử dụng key tổng hợp để đảm bảo tính duy nhất cho mỗi phân công (đề tài + vòng chấm)
        campaignsMap.get(topic.campaign_id).topics.push({ ...topic, key: `${topic.id}-${topic.score_level}` });
      });
      
      const allCampaigns = Array.from(campaignsMap.values());
      const ongoing = [];
      const graded = [];
      const completed = [];

      allCampaigns.forEach(campaign => {
        if (campaign.status === 'closed') {
          completed.push(campaign);
        } else {
          // Một đợt thi được coi là "đang diễn ra" nếu có ít nhất một đề tài chưa được giám khảo này chấm điểm.
          const isOngoing = campaign.topics.some(topic => topic.total_score == null);
          if (isOngoing) {
            ongoing.push(campaign);
          } else {
            graded.push(campaign);
          }
        }
      });
      setOngoingCampaigns(ongoing);
      setGradedCampaigns(graded);
      setCompletedCampaigns(completed);
    } catch (error) {
      message.error('Lỗi khi tải danh sách đợt thi.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTopics = (campaign) => {
    setSelectedCampaign(campaign);
    setTopics(campaign.topics);
    setLevelFilter('all'); // Đặt lại bộ lọc khi chọn đợt thi khác
    setViewMode('topics');
  };

  const handleBackToCampaigns = () => {
    setViewMode('campaigns');
    setSelectedCampaign(null);
    setTopics([]);
    fetchCampaigns();
  };

  const showGradeModal = async (record) => {
    setGradingTopic(record);
    try {
      // Lấy đúng vòng thi mà giám khảo được phân công (score_level) thay vì vòng thi hiện tại của đề tài (round_status)
      const response = await api.get(`/scores/my-score/${record.id}?level=${record.score_level || record.round_status}`);
      if (response.data) {
        form.setFieldsValue({
          urgency_score: response.data.urgency_score,
          method_score: response.data.method_score,
          result_score: response.data.result_score,
          comment: response.data.comment
        });
      } else {
        form.resetFields();
      }
    } catch (error) {
      form.resetFields();
    }
    setIsGradeModalVisible(true);
  };

  const handleSubmitScore = async (values) => {
    try {
      await api.post('/scores', {
        topic_id: gradingTopic.id,
        level: gradingTopic.score_level || gradingTopic.round_status,
        ...values
      });
      message.success('Đã lưu điểm số thành công!');
      setIsGradeModalVisible(false);
      
      // Cập nhật trạng thái của đề tài vừa chấm ngay trên giao diện
      // thay vì điều hướng về trang danh sách, giúp cải thiện trải nghiệm người dùng.
      const newTotalScore = (values.urgency_score || 0) + (values.method_score || 0) + (values.result_score || 0);

      setTopics(prevTopics =>
        prevTopics.map(topic => {
          if (topic.key === gradingTopic.key) {
            return { ...topic, total_score: newTotalScore };
          }
          return topic;
        })
      );
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi nộp điểm.');
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

  const campaignColumns = [
    {
      title: 'Tên đợt thi', 
      dataIndex: 'name', 
      key: 'name',
      render: (text) => <b>{text}</b>
    },
    { 
      title: 'Năm học', 
      dataIndex: 'academic_year', 
      key: 'academic_year' 
    },
    { 
      title: 'Số lượng đề tài', 
      key: 'topic_count',
      render: (_, record) => <Tag color="blue">{record.topics.length} đề tài</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />}
          onClick={() => handleViewTopics(record)}
        >
          Xem đề tài
        </Button>
      ),
    },
  ];

  const topicColumns = [
    { 
      title: 'Tên đề tài', 
      dataIndex: 'title', 
      key: 'title',
      width: '25%', 
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Đợt thi: {record.campaign_name}</div>
        </div>
      )
    },
    { 
      title: 'Sinh viên thực hiện', 
      dataIndex: 'student_name', 
      key: 'student_name' 
    },
    { 
      title: 'Giảng viên HD', 
      dataIndex: 'instructor_name', 
      key: 'instructor_name' 
    },
    { 
      title: 'Vòng chấm của bạn', 
      key: 'score_level',
      render: (_, record) => {
        const level = record.score_level || record.round_status;
        return <Tag color={level === 1 ? 'magenta' : 'geekblue'}>{level === 1 ? 'VÒNG KHOA' : 'VÒNG TRƯỜNG'}</Tag>;
      }
    },
    { 
      title: 'Trạng thái đề tài',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusMap = {
          pending: { color: 'orange', text: 'Chờ duyệt' },
          instructor_approved: { color: 'cyan', text: 'GVHD đã duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          grading: { color: 'blue', text: 'Đang chấm' },
          revision_requested: { color: 'purple', text: 'Yêu cầu chỉnh sửa' },
          completed: { color: 'gold', text: 'Hoàn thành' },
          rejected: { color: 'red', text: 'Từ chối' },
        };
        
        if (status === 'grading' && record.total_score != null) {
          return <Tag color="geekblue">ĐÃ CHẤM</Tag>;
        }
        
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    { 
      title: 'Điểm của bạn', key: 'total_score', width: '15%',
      render: (_, record) => (
        record.total_score != null 
          ? <Tag color={Number(record.total_score) >= 70 ? "green" : "red"}>{record.total_score} / 100</Tag>
          : <Tag color="default">Chưa chấm</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button icon={<InfoCircleOutlined />} onClick={() => showDetailsModal(record)}>
            Chi tiết & Báo cáo
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showGradeModal(record)}
            disabled={record.status !== 'grading'}
          >
            {record.total_score != null ? 'Sửa điểm' : 'Chấm điểm'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {viewMode === 'campaigns' ? (
        <>
          <Title level={3} style={{ marginBottom: 20, color: '#1890ff' }}>Đợt thi đang diễn ra (Cần chấm)</Title>
          <Table 
            columns={campaignColumns} 
            dataSource={ongoingCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            locale={{ emptyText: 'Không có đợt thi nào đang chờ bạn chấm.' }}
          />
          <Divider />
          <Title level={3} style={{ marginTop: 20, marginBottom: 20, color: '#595959' }}>Đợt thi đã chấm xong</Title>
          <Table 
            columns={campaignColumns} 
            dataSource={gradedCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            locale={{ emptyText: 'Chưa có đợt thi nào được bạn chấm hoàn tất.' }}
          />
          <Divider />
          <Title level={3} style={{ marginTop: 20, marginBottom: 20, color: '#52c41a' }}>Đợt thi đã hoàn thành</Title>
          <Table 
            columns={campaignColumns} 
            dataSource={completedCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            locale={{ emptyText: 'Chưa có đợt thi nào hoàn thành.' }}
          />
        </>
      ) : (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToCampaigns} style={{ marginBottom: 16 }}>
            Quay lại danh sách đợt thi
          </Button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Đề tài thuộc đợt thi: {selectedCampaign?.name}
            </Title>
            <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 180 }}>
              <Option value="all">Tất cả các vòng</Option>
              <Option value={1}>Vòng Khoa (Sơ khảo)</Option>
              <Option value={2}>Vòng Trường (Chung khảo)</Option>
            </Select>
          </div>
          
          <Title level={4} style={{ marginTop: 24, marginBottom: 16, color: '#fa8c16' }}>
            Đề tài cần chấm ({ungradedTopics.length})
          </Title>
          <Table 
            columns={topicColumns} 
            dataSource={ungradedTopics} 
            rowKey="key"
            pagination={{ pageSize: 5, hideOnSinglePage: true }} 
            bordered 
            scroll={{ x: 'max-content' }} 
            locale={{ emptyText: 'Bạn đã chấm tất cả đề tài được giao trong đợt này.' }}
          />

          <Divider />

          <Title level={4} style={{ marginTop: 24, marginBottom: 16, color: '#595959' }}>
            Đề tài đã chấm ({gradedTopicsInCampaign.length})
          </Title>
          <Table 
            columns={topicColumns} 
            dataSource={gradedTopicsInCampaign} 
            rowKey="key"
            pagination={{ pageSize: 5 }} 
            bordered 
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có đề tài nào được chấm trong đợt này.' }}
          />

          <Divider />

          <Title level={4} style={{ marginTop: 24, marginBottom: 16, color: '#52c41a' }}>
            Đề tài hoàn thành ({completedTopicsInCampaign.length})
          </Title>
          <Table 
            columns={topicColumns} 
            dataSource={completedTopicsInCampaign} 
            rowKey="key"
            pagination={{ pageSize: 5 }} 
            bordered 
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có đề tài nào hoàn thành trong đợt này.' }}
          />
        </>
      )}

      <Modal 
        title={`Chấm điểm: ${gradingTopic?.title}`} 
        open={isGradeModalVisible} 
        onCancel={() => setIsGradeModalVisible(false)} 
        onOk={() => form.submit()} 
        okText="Lưu điểm" 
        cancelText="Hủy"
        width={600}
      >
        <div style={{ marginBottom: 20, padding: 10, background: '#f5f5f5', borderRadius: 8 }}>
          <Text strong>Khung tiêu chí đánh giá (Tổng 100đ):</Text>
          <ul>
            <li>Tính cấp thiết & Sáng tạo: Tối đa 20đ</li>
            <li>Phương pháp nghiên cứu: Tối đa 30đ</li>
            <li>Kết quả & Đóng góp thực tiễn: Tối đa 50đ</li>
          </ul>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmitScore}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Tính cấp thiết" name="urgency_score" rules={[{ required: true, message: 'Nhập điểm!' }]}>
                <InputNumber min={0} max={20} style={{ width: '100%' }} placeholder="Tối đa 20" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Phương pháp" name="method_score" rules={[{ required: true, message: 'Nhập điểm!' }]}>
                <InputNumber min={0} max={30} style={{ width: '100%' }} placeholder="Tối đa 30" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kết quả đạt được" name="result_score" rules={[{ required: true, message: 'Nhập điểm!' }]}>
                <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="Tối đa 50" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.urgency_score !== currentValues.urgency_score || 
              prevValues.method_score !== currentValues.method_score || 
              prevValues.result_score !== currentValues.result_score
            }
          >
            {({ getFieldValue }) => {
              const urgency = getFieldValue('urgency_score') || 0;
              const method = getFieldValue('method_score') || 0;
              const result = getFieldValue('result_score') || 0;
              const total = urgency + method + result;
              return <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>Tổng điểm: <span style={{ color: total >= 70 ? 'green' : 'red' }}>{total} / 100</span></div>;
            }}
          </Form.Item>
          <Form.Item label="Nhận xét / Phản biện" name="comment">
            <TextArea rows={4} placeholder="Nhập nhận xét của bạn về đề tài này..." />
          </Form.Item>
        </Form>
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

export default GradeTopics;