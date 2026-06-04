import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Select, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const { Title } = Typography;

// Hàm hỗ trợ giải mã chuỗi JSON an toàn nhiều lớp
const parseStructure = (data) => {
  if (!data) return [];
  let parsed = data;
  while (typeof parsed === 'string') {
    try {
      const next = JSON.parse(parsed);
      if (next === parsed || next === null) break; // Thoát nếu không thay đổi
      parsed = next;
    } catch (e) {
      break; // Lỗi cú pháp thì dừng parse
    }
  }
  return Array.isArray(parsed) ? parsed : [];
};

const Reports = () => {
  const [form] = Form.useForm();
  const [campaigns, setCampaigns] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record) => record.key === editingKey;

  // Component cho ô có thể chỉnh sửa, đặt bên trong để truy cập `selectedCampaign` và `form`
  const EditableCell = ({ editing, dataIndex, children, ...restProps }) => {
    const awardOptions = useMemo(() => parseStructure(selectedCampaign?.award_structure), [selectedCampaign]);

    const handleAwardChange = (value) => {
      const selectedAward = awardOptions.find(opt => opt.name === value);
      form.setFieldsValue({ effectiveness: selectedAward ? selectedAward.prize : '' });
    };

    const inputNode = dataIndex === 'award'
      ? (
        <Select placeholder="Chọn giải thưởng" onChange={handleAwardChange} allowClear>
          {awardOptions.map(opt => <Select.Option key={opt.name} value={opt.name}>{opt.name}</Select.Option>)}
        </Select>
      )
      : <Input />;

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item name={dataIndex} style={{ margin: 0 }}>{inputNode}</Form.Item>
        ) : (children)}
      </td>
    );
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get('/campaigns');
        setCampaigns(response.data.map(c => ({ ...c, key: c.id })));
      } catch (error) {
        message.error('Không thể tải danh sách đợt thi.');
      }
    };
    fetchCampaigns();
  }, []);

  const handleViewAwards = async (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalVisible(true);
    setTopicsLoading(true);
    try {
      // Sử dụng `params` để đảm bảo campaign_id được gửi lên backend một cách chính xác
      const response = await api.get('/topics', { params: { campaign_id: campaign.id } });
      
      // Bóc tách dữ liệu linh hoạt tránh lỗi undefined
      let topicsData = [];
      if (Array.isArray(response)) topicsData = response;
      else if (response?.data && Array.isArray(response.data)) topicsData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data)) topicsData = response.data.data;

      setTopics(topicsData.map(t => ({ ...t, key: t.id })));
    } catch (error) {
      message.error('Không thể tải danh sách đề tài cho đợt thi này.');
    } finally {
      setTopicsLoading(false);
    }
  };

  const edit = (record) => {
    form.setFieldsValue({ award: '', effectiveness: '', ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...topics];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        await api.patch(`/topics/${item.id}/status`, { award: row.award, effectiveness: row.effectiveness });
        
        newData.splice(index, 1, { ...item, ...row });
        setTopics(newData);
        setEditingKey('');
        message.success('Đã cập nhật giải thưởng!');
      } else {
        setEditingKey('');
      }
    } catch (errInfo) {
      message.error('Lưu thất bại, vui lòng kiểm tra lại.');
    }
  };

  const handleAutoAssignAwards = async () => {
    try {
      const structure = parseStructure(selectedCampaign?.award_structure);
        
      if (!structure || !Array.isArray(structure) || structure.length === 0) {
        message.warning('Đợt thi này chưa cấu hình cơ cấu giải thưởng!');
        return;
      }

      // Lọc các đề tài có điểm trung bình > 0
      const eligibleTopics = topics.filter(t => t.average_score && parseFloat(t.average_score) > 0);
      // Sắp xếp giảm dần theo điểm trung bình
      eligibleTopics.sort((a, b) => parseFloat(b.average_score) - parseFloat(a.average_score));

      let topicIndex = 0;
      const updates = [];

      // Duyệt qua từng hạng mục giải (Giả định được sắp xếp từ Nhất -> Khuyến khích)
      for (const award of structure) {
        const qty = parseInt(award.quantity) || 0;
        for (let i = 0; i < qty; i++) {
          if (topicIndex < eligibleTopics.length) {
            const topic = eligibleTopics[topicIndex];
            updates.push({ id: topic.id, award: award.name, effectiveness: award.prize });
            topicIndex++;
          }
        }
      }

      if (updates.length === 0) {
        message.info('Không có đề tài nào đủ điều kiện hoặc số lượng giải chưa được cấu hình.');
        return;
      }

      setTopicsLoading(true);
      for (const update of updates) {
        await api.patch(`/topics/${update.id}/status`, { award: update.award, effectiveness: update.effectiveness });
      }
      
      message.success(`Đã tự động xét giải cho ${updates.length} đề tài!`);
      handleViewAwards(selectedCampaign); // Tải lại danh sách đề tài sau khi tự động xét giải
    } catch (error) {
      message.error('Lỗi khi tự động xét giải.');
    } finally {
      setTopicsLoading(false);
    }
  };

  const columns = [
    { title: 'Tên đề tài', dataIndex: 'title', key: 'title', width: '25%' },
    { title: 'Sinh viên', dataIndex: 'student_name', key: 'student_name' },
    { title: 'GVHD', dataIndex: 'instructor_name', key: 'instructor_name' },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      width: '10%',
      render: (score) => score ? <Tag color="purple"><b>{parseFloat(score).toFixed(2)}</b></Tag> : <Tag>Chưa chấm</Tag>,
      sorter: (a, b) => (a.average_score || 0) - (b.average_score || 0),
      defaultSortOrder: 'descend',
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
      title: 'Giải thưởng',
      dataIndex: 'award',
      key: 'award',
      editable: true,
      width: '15%',
      render: (text) => text || <span style={{color: 'gray'}}>Chưa có</span>
    },
    {
      title: 'Nội dung/Hiện vật trao',
      dataIndex: 'effectiveness',
      key: 'effectiveness',
      editable: true,
      width: '20%',
      render: (text) => text || <span style={{color: 'gray'}}>Chưa có</span>
    },
    {
      title: 'Hành động',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button onClick={() => save(record.key)} type="primary" style={{ marginRight: 8 }}>Lưu</Button>
            <Popconfirm title="Bạn chắc chắn muốn hủy?" onConfirm={cancel}><Button>Hủy</Button></Popconfirm>
          </span>
        ) : (
          <Button disabled={editingKey !== ''} onClick={() => edit(record)}>Cập nhật giải</Button>
        );
      },
    },
  ];

  const campaignColumns = [
    { title: 'Tên đợt thi', dataIndex: 'name', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Năm Học', dataIndex: 'academic_year', key: 'academic_year' },
    { title: 'Bắt đầu', dataIndex: 'start_date', key: 'start_date', render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    { title: 'Kết thúc', dataIndex: 'end_date', key: 'end_date', render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: status => <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => handleViewAwards(record)}>
          Xem chi tiết & Giải thưởng
        </Button>
      ),
    },
  ];

  const mergedTopicColumns = columns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record) => ({ record, dataIndex: col.dataIndex, editing: isEditing(record) }),
    };
  });

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 24, color: '#1890ff' }}>Thống kê & Báo cáo Giải thưởng</Title>
      
      <Table
        columns={campaignColumns}
        dataSource={campaigns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />

      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '24px' }}>
            <Title level={4} style={{ margin: 0 }}>Giải thưởng cho đợt thi: {selectedCampaign?.name}</Title>
            <Popconfirm title="Tự động xét giải từ cao xuống thấp dựa trên cơ cấu giải thưởng?" onConfirm={handleAutoAssignAwards}>
              <Button type="primary">Tự động xét giải</Button>
            </Popconfirm>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsModalVisible(false)}>Đóng</Button>]}
        width="90vw"
        style={{ top: 20 }}
      >
        <Form form={form} component={false}>
          <Table
            components={{ body: { cell: EditableCell } }}
            bordered
            dataSource={topics}
            columns={mergedTopicColumns}
            rowClassName="editable-row"
            pagination={{ onChange: cancel, pageSize: 5 }}
            loading={topicsLoading}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Không có đề tài nào trong đợt thi này.' }}
          />
        </Form>
      </Modal>
    </Card>
  );
};

export default Reports;