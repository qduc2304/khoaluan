import { ArrowLeftOutlined, EditOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, message, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { topicService } from '../../services/topicService';

const { Title, Text } = Typography;

const MyTopics = () => {
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 'campaigns' view shows the list of campaigns
  // 'topics' view shows the topics for a selected campaign
  const [viewMode, setViewMode] = useState('campaigns'); 
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    const fetchMyTopics = async () => {
      setLoading(true);
      try {
        const data = await topicService.getMyTopics();
        setAllTopics(data.data.map(t => ({ ...t, key: t.id }))); // Sửa lỗi ở đây: truy cập data.data
      } catch (error) {
        message.error('Không thể tải danh sách đề tài của bạn.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyTopics();
  }, []);

  // Group topics by campaign using useMemo for performance
  const campaigns = useMemo(() => {
    const campaignsMap = new Map();
    allTopics.forEach(topic => {
      if (!topic.campaign_id) return; // Skip topics without a campaign

      if (!campaignsMap.has(topic.campaign_id)) {
        campaignsMap.set(topic.campaign_id, {
          id: topic.campaign_id,
          name: topic.campaign_name,
          academic_year: topic.campaign_year,
          topic_count: 0,
        });
      }
      campaignsMap.get(topic.campaign_id).topic_count += 1;
    });
    return Array.from(campaignsMap.values());
  }, [allTopics]);

  // Topics to display based on the selected campaign
  const topicsForSelectedCampaign = useMemo(() => {
    if (!selectedCampaign) return [];
    return allTopics.filter(topic => topic.campaign_id === selectedCampaign.id);
  }, [allTopics, selectedCampaign]);

  const handleViewTopics = (campaign) => {
    setSelectedCampaign(campaign);
    setViewMode('topics');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setViewMode('campaigns');
  };

  const handleEditTopic = (topic) => {
    navigate('/student/register-topic', { state: { editTopic: topic } });
  };

  const campaignColumns = [
    { title: 'Tên đợt thi', dataIndex: 'name', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Năm học', dataIndex: 'academic_year', key: 'academic_year' },
    { title: 'Số đề tài tham gia', dataIndex: 'topic_count', key: 'topic_count', render: count => <Tag color="blue">{count} đề tài</Tag> },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => handleViewTopics(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const topicColumns = [
    { title: 'Tên đề tài', dataIndex: 'title', key: 'title', width: '30%' },
    { title: 'Giảng viên HD', dataIndex: 'instructor_name', key: 'instructor_name' },
    {
      title: 'Điểm số',
      dataIndex: 'average_score',
      key: 'average_score',
      render: (score) => score ? <Tag color="purple"><b>{parseFloat(score).toFixed(2)}</b></Tag> : <Tag>Chưa có</Tag>,
    },
    {
      title: 'Giải thưởng',
      key: 'award',
      render: (_, record) => {
        if (record.status !== 'completed' && !record.award) return <Text type="secondary">Chưa xét</Text>;
        if (!record.award) return <Text type="secondary">Chưa đạt giải</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Tag color="gold"><b>{record.award}</b></Tag>
            {record.effectiveness && <Text style={{ fontSize: '12px' }} type="success">{record.effectiveness}</Text>}
          </Space>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusMap = {
          pending: { color: 'orange', text: 'Chờ duyệt' },
          instructor_approved: { color: 'cyan', text: 'GVHD đã duyệt' },
          approved: { color: 'green', text: 'Khoa đã duyệt' },
          grading: { color: 'blue', text: 'Đang chấm' },
          revision_requested: { color: 'purple', text: 'Yêu cầu sửa' },
          completed: { color: 'gold', text: 'Đã nghiệm thu' },
          rejected: { color: 'red', text: 'Bị từ chối' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'completed') {
          return <Text type="secondary" italic>Đã nghiệm thu</Text>;
        }
        return (
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditTopic(record)}
              disabled={!['pending', 'revision_requested'].includes(record.status)}
            >
              Sửa
            </Button>
            <Button 
              type="primary"
              icon={<UploadOutlined />} 
              onClick={() => navigate('/student/submit-report', { state: { topicId: record.id } })}
              disabled={['pending', 'rejected'].includes(record.status)}
              style={{ backgroundColor: ['pending', 'rejected'].includes(record.status) ? undefined : '#52c41a' }}
            >
              Nộp báo cáo
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      {viewMode === 'campaigns' ? (
        <>
          <Title level={3} style={{ marginBottom: 24, color: '#1890ff' }}>Các đợt thi đã tham gia</Title>
          <Table
            columns={campaignColumns}
            dataSource={campaigns}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Bạn chưa tham gia đợt thi nào.' }}
          />
        </>
      ) : (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToCampaigns} style={{ marginBottom: 16 }}>
            Quay lại danh sách đợt thi
          </Button>
          <Title level={3} style={{ marginBottom: 24, color: '#1890ff' }}>
            Đề tài của bạn trong đợt: {selectedCampaign?.name}
          </Title>
          <Table
            columns={topicColumns}
            dataSource={topicsForSelectedCampaign}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </>
      )}
    </Card>
  );
};

export default MyTopics;