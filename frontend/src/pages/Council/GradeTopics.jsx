import { ArrowLeftOutlined, EditOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons';
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
    if (levelFilter !== 'all') {
      const targetRound = topic.rounds?.find(r => Number(r.score_level) === Number(levelFilter));
      if (!targetRound || targetRound.total_score != null) return false;
      return true;
    }
    return topic.rounds?.some(r => r.total_score == null);
  }), [topics, levelFilter]);
  
  const gradedTopicsInCampaign = useMemo(() => topics.filter(topic => {
    if (topic.status === 'completed') return false;
    if (levelFilter !== 'all') {
      const targetRound = topic.rounds?.find(r => Number(r.score_level) === Number(levelFilter));
      if (!targetRound || targetRound.total_score == null) return false;
      return true;
    }
    return topic.rounds?.every(r => r.total_score != null);
  }), [topics, levelFilter]);
  
  const completedTopicsInCampaign = useMemo(() => topics.filter(topic => {
    if (topic.status !== 'completed') return false;
    if (levelFilter !== 'all') {
      const targetRound = topic.rounds?.find(r => Number(r.score_level) === Number(levelFilter));
      if (!targetRound) return false;
    }
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
        
        const campaign = campaignsMap.get(topic.campaign_id);
        const existingTopic = campaign.topics.find(t => t.id === topic.id);
        
        if (existingTopic) {
          existingTopic.rounds.push({ score_level: topic.score_level, total_score: topic.total_score });
          existingTopic.rounds.sort((a, b) => b.score_level - a.score_level);
        } else {
          campaign.topics.push({ 
            ...topic, 
            key: topic.id.toString(),
            rounds: [{ score_level: topic.score_level, total_score: topic.total_score }]
          });
        }
      });
      
      const allCampaigns = Array.from(campaignsMap.values());
      const ongoing = [];
      const graded = [];
      const completed = [];

      allCampaigns.forEach(campaign => {
        if (campaign.status === 'closed') {
          completed.push(campaign);
        } else {
          // Một đợt thi "đang diễn ra" nếu có ít nhất một đề tài có vòng chấm chưa được chấm điểm.
          const isOngoing = campaign.topics.some(topic => topic.rounds?.some(r => r.total_score == null));
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

  const showGradeModal = async (record, round) => {
    setGradingTopic({ ...record, score_level: round.score_level });
    try {
      // Lấy đúng vòng thi mà giám khảo được phân công (score_level) thay vì vòng thi hiện tại của đề tài (round_status)
      const response = await api.get(`/scores/my-score/${record.id}?level=${round.score_level}`);
      const scoreData = response.data?.data || response.data;
      if (scoreData) {
        form.setFieldsValue({
          total_score: scoreData.total_score ?? scoreData.result_score,
          comment: scoreData.comment
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
        total_score: values.total_score,
        comment: values.comment
      });

      message.success('Đã lưu điểm số thành công!');
      setIsGradeModalVisible(false);
      
      // Cập nhật trạng thái của đề tài vừa chấm ngay trên giao diện
      const newTotalScore = values.total_score;

      setTopics(prevTopics =>
        prevTopics.map(topic => {
          if (topic.id === gradingTopic.id) {
            const updatedRounds = topic.rounds.map(r => r.score_level === gradingTopic.score_level ? { ...r, total_score: newTotalScore } : r);
            return { ...topic, rounds: updatedRounds };
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
      // Lấy chi tiết điểm và nhận xét của giám khảo
      try {
        const detailsResponse = await api.get(`/topics/${record.id}/details`);
        setSelectedTopic(prev => ({ ...prev, scores: detailsResponse.data?.scores }));
      } catch (err) {}

      // Tối ưu: Chỉ fetch các báo cáo của đề tài đang chọn
      const response = await api.get('/reports', { params: { topic_id: record.id } });
      
      // Bóc tách dữ liệu linh hoạt, vì API có thể trả về mảng trực tiếp hoặc object { data: [...] }
      let reportsData = [];
      if (Array.isArray(response)) reportsData = response;
      else if (response?.data && Array.isArray(response.data)) reportsData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data)) reportsData = response.data.data;
      const reports = reportsData; // API đã được filter ở backend
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
      width: 300,
      render: (text) => <b>{text}</b>
    },
    { 
      title: 'Năm học', 
      dataIndex: 'academic_year', 
      key: 'academic_year',
      width: 140
    },
    { 
      title: 'Số lượng đề tài', 
      key: 'topic_count',
      width: 160,
      align: 'center',
      render: (_, record) => <Tag color="blue" style={{ margin: 0 }}>{record.topics.length} đề tài</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      fixed: 'right',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Button 
          size="small"
          type="primary" 
          icon={<EyeOutlined />}
          onClick={() => handleViewTopics(record)}
        >
          Xem đề tài
        </Button>
      ),
    },
  ];

  const getVisibleRounds = (record) => {
    if (levelFilter === 'all') return record.rounds || [];
    return (record.rounds || []).filter(r => Number(r.score_level) === Number(levelFilter));
  };

  const topicColumns = [
    { 
      title: 'Tên đề tài', 
      dataIndex: 'title', 
      key: 'title',
      width: 300, 
      render: (text, record) => (
        <div>
          <Text strong style={{ display: 'block', whiteSpace: 'normal', minWidth: 200 }}>{text}</Text>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Đợt thi: {record.campaign_name}</div>
        </div>
      )
    },
    { 
      title: 'Sinh viên thực hiện', 
      dataIndex: 'student_name', 
      key: 'student_name',
      width: 180
    },
    { 
      title: 'Giảng viên HD', 
      dataIndex: 'instructor_name', 
      key: 'instructor_name',
      width: 180
    },
    { 
      title: 'Vòng chấm của bạn', 
      key: 'rounds',
      width: 140,
      align: 'center',
      render: (_, record) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            {getVisibleRounds(record).map(r => <Tag key={r.score_level} color={r.score_level === 1 ? 'magenta' : 'geekblue'} style={{ margin: 0 }}>{r.score_level === 1 ? 'VÒNG KHOA' : 'VÒNG TRƯỜNG'}</Tag>)}
          </div>
        );
      }
    },
    { 
      title: 'Trạng thái đề tài',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      align: 'center',
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
        
        const visibleRounds = getVisibleRounds(record);
        if (status === 'grading' && visibleRounds.length > 0 && visibleRounds.every(r => r.total_score != null)) {
          return <Tag color="geekblue" style={{ margin: 0 }}>ĐÃ CHẤM</Tag>;
        }
        
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color} style={{ margin: 0 }}>{text.toUpperCase()}</Tag>;
      }
    },
    { 
      title: 'Điểm của bạn', key: 'total_score', width: 120,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          {getVisibleRounds(record).map(r => r.total_score != null 
            ? <Tag key={r.score_level} color={Number(r.total_score) >= 50 ? "green" : "red"} style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{parseFloat(r.total_score)} / 100</Tag>
            : <Tag key={r.score_level} color="default" style={{ margin: 0 }}>Chưa chấm</Tag>)}
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {getVisibleRounds(record).map(r => (
            <Button 
              key={r.score_level}
              size="small"
              type={r.total_score != null ? "default" : "primary"} 
              icon={<EditOutlined />} 
              onClick={() => showGradeModal(record, r)}
              disabled={record.status !== 'grading'}
              style={{ fontSize: '12px' }}
            >
              {r.total_score != null ? `Sửa V${r.score_level}` : `Chấm V${r.score_level}`}
            </Button>
          ))}
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetailsModal(record)} style={{ fontSize: '12px' }}>Chi tiết</Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      {viewMode === 'campaigns' ? (
        <>
          <Title level={3} style={{ marginBottom: 20, color: '#1890ff' }}>Đợt thi đang diễn ra (Cần chấm)</Title>
          <Table 
            size="small"
            columns={campaignColumns} 
            dataSource={ongoingCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Không có đợt thi nào đang chờ bạn chấm.' }}
          />
          <Divider />
          <Title level={3} style={{ marginTop: 20, marginBottom: 20, color: '#595959' }}>Đợt thi đã chấm xong</Title>
          <Table 
            size="small"
            columns={campaignColumns} 
            dataSource={gradedCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có đợt thi nào được bạn chấm hoàn tất.' }}
          />
          <Divider />
          <Title level={3} style={{ marginTop: 20, marginBottom: 20, color: '#52c41a' }}>Đợt thi đã hoàn thành</Title>
          <Table 
            size="small"
            columns={campaignColumns} 
            dataSource={completedCampaigns} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có đợt thi nào hoàn thành.' }}
          />
        </>
      ) : (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToCampaigns} style={{ marginBottom: 16 }}>
            Quay lại danh sách đợt thi
          </Button>
          
          <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  Đề tài thuộc đợt thi: {selectedCampaign?.name}
                </Title>
              </Col>
              <Col>
                <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 180 }}>
                  <Option value="all">Tất cả các vòng</Option>
                  <Option value={1}>Vòng Khoa (Sơ khảo)</Option>
                  <Option value={2}>Vòng Trường (Chung khảo)</Option>
                </Select>
              </Col>
            </Row>
          </div>
          
          <Title level={4} style={{ marginTop: 24, marginBottom: 16, color: '#fa8c16' }}>
            Đề tài cần chấm ({ungradedTopics.length})
          </Title>
          <Table 
            size="small"
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
            size="small"
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
            size="small"
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
        <div style={{ marginBottom: 20, padding: 12, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
          <Text strong style={{ color: '#0050b3' }}>Hướng dẫn nhập điểm:</Text>
          <p style={{ margin: 0, marginTop: 4 }}>Thư ký Hội đồng tổng hợp điểm từ các thành viên Ban giám khảo, tính điểm trung bình và chỉ nhập <b>1 Tổng điểm cuối cùng</b> vào hệ thống.</p>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmitScore}>
          <Form.Item label="Tổng điểm trung bình (Tối đa 100)" name="total_score" rules={[{ required: true, message: 'Vui lòng nhập tổng điểm!' }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Nhập điểm trung bình cuối cùng (0 - 100)" size="large" />
          </Form.Item>
          <Form.Item label="Nhận xét / Phản biện chung" name="comment">
            <TextArea rows={4} placeholder="Nhập tóm tắt nhận xét của Hội đồng về đề tài này..." />
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
            
            {selectedTopic.scores && selectedTopic.scores.length > 0 && (
              <>
                <Divider orientation="left">Điểm & Nhận xét của Hội đồng</Divider>
                <Table 
                  dataSource={selectedTopic.scores} 
                  pagination={false} 
                  size="small"
                  rowKey={(r) => `${r.council_member_id}-${r.level}`}
                  bordered
                  columns={[
                    { title: 'Vòng thi', dataIndex: 'level', render: l => <Tag color={l === 1 ? 'magenta' : 'geekblue'}>{l === 1 ? 'Vòng Khoa' : 'Vòng Trường'}</Tag>, width: 110, align: 'center' },
                    { title: 'Giám khảo', dataIndex: 'council_name', width: 160, render: name => <Text strong>{name}</Text> },
                    { title: 'Điểm số', dataIndex: 'total_score', render: s => s != null ? <Tag color={Number(s) >= 50 ? 'green' : 'red'}><b>{parseFloat(s)}</b></Tag> : <Text type="secondary">Chưa chấm</Text>, width: 90, align: 'center' },
                    { title: 'Nhận xét', dataIndex: 'comment', render: c => c ? <div style={{ whiteSpace: 'pre-wrap' }}>{c}</div> : <Text type="secondary">Không có nhận xét</Text> }
                  ]}
                />
              </>
            )}

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