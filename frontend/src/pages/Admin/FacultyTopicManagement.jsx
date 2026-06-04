import { DownloadOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Form, InputNumber, message, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { campaignService } from '../../services/campaignService';
import { topicService } from '../../services/topicService';

const { Title, Text } = Typography;
const { Option } = Select;

const FACULTY_MAJORS = {
  "Khoa Công nghệ và Kỹ thuật": ["Công nghệ thông tin", "Công nghệ kỹ thuật Cơ khí", "Công nghệ kỹ thuật Điện – Điện tử"],
  "Khoa Kinh tế và Quản trị": ["Kế toán", "Kinh tế", "Tài chính – Ngân hàng", "Quản trị kinh doanh"],
  "Khoa Luật, Chính trị học và Quan hệ Quốc tế": ["Luật học", "Chính trị học", "Quan hệ quốc tế"],
  "Khoa Khoa học Cơ bản": ["Toán học", "Lý luận chính trị", "Kiến thức đại cương", "Kỹ năng bổ trợ"]
};

const renderStatusTag = (status, record) => {
  const statusMap = {
    pending: { color: 'orange', text: 'SV mới nộp' },
    instructor_approved: { color: 'cyan', text: 'GVHD đã duyệt' },
    approved: { color: 'green', text: 'Khoa đã duyệt' },
    grading: { color: 'blue', text: 'Đang chấm điểm' },
    revision_requested: { color: 'purple', text: 'Yêu cầu sửa' },
    completed: { color: 'gold', text: 'Đã nghiệm thu' },
    rejected: { color: 'red', text: 'Bị từ chối' },
  };
  
  if (status === 'grading' && record?.average_score != null) {
    return <Tag color="geekblue">ĐÃ CHẤM</Tag>;
  }
  
  const { color, text } = statusMap[status] || { color: 'default', text: status };
  return <Tag color={color}>{text.toUpperCase()}</Tag>;
};

const FacultyTopicManagement = () => {
  const role = localStorage.getItem('userRole');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form] = Form.useForm();

  // States cho chức năng Phân công giám khảo
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assigningTopic, setAssigningTopic] = useState(null);
  const [councilMembers, setCouncilMembers] = useState([]);
  const [assignForm] = Form.useForm();

  // States cho chức năng lọc
  const [filterForm] = Form.useForm();
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetchTopics();
    fetchCouncilMembers();
    fetchCampaigns();
  }, []);

  const fetchTopics = async (filterValues = {}) => {
    setLoading(true);
    try {
      const params = { ...filterValues };
      if (params.dateRange) {
        // Chuyển đổi ngày sang định dạng ISO string để gửi lên backend
        params.startDate = params.dateRange[0].startOf('day').toISOString();
        params.endDate = params.dateRange[1].endOf('day').toISOString();
        delete params.dateRange; // Xóa key cũ
      }
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

  const fetchCampaigns = async () => {
    try {
      // Lấy danh sách các đợt thi để đưa vào bộ lọc
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Không thể tải danh sách đợt thi', error);
    }
  };

  const fetchCouncilMembers = async () => {
    try {
      const response = await api.get('/users/council');
      setCouncilMembers(response.data);
    } catch (error) {
      console.error('Không thể tải danh sách giám khảo', error);
    }
  };

  const showUpdateModal = (record) => {
    setEditingTopic(record);
    form.setFieldsValue({
      status: record.status,
      round_status: record.round_status,
      funding: record.funding,
      funding_status: record.funding_status || 'pending'
    });
    setIsModalVisible(true);
  };

  const handleUpdateFundingStatus = async (id, status, successMsg) => {
    try {
      await topicService.updateTopicStatus(id, { funding_status: status });
      message.success(successMsg);
      fetchTopics();
    } catch (error) {
      message.error('Lỗi khi cập nhật kinh phí.');
    }
  };

  const handleUpdateProgress = async (values) => {
    try {
      const payload = { ...values };
      if (values.round_status !== editingTopic.round_status) {
        payload.average_score = null;
      }
      // Gửi toàn bộ object values chứa cả { status, round_status } xuống Backend
      await topicService.updateTopicStatus(editingTopic.id, payload);
      
      message.success('Cập nhật tiến độ đề tài thành công!');
      setIsModalVisible(false);
      fetchTopics(); // Tải lại danh sách
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật (Vui lòng kiểm tra Console backend).');
    }
  };

  const showAssignModal = async (record) => {
    setAssigningTopic(record);
    try {
      // Gọi API lấy chi tiết đề tài để xem các giám khảo đã được phân công
      const response = await api.get(`/topics/${record.id}/details`);
      const currentAssigned = response.data.scores?.filter(s => s.level === record.round_status).map(s => s.council_member_id) || [];
      assignForm.setFieldsValue({ council_members: currentAssigned });
    } catch (error) {
      assignForm.setFieldsValue({ council_members: [] });
    }
    setIsAssignModalVisible(true);
  };

  const handleAssignCouncil = async (values) => {
    try {
      await api.post(`/topics/${assigningTopic.id}/assign`, { council_members: values.council_members });
      message.success('Phân công giám khảo thành công!');
      setIsAssignModalVisible(false);
      fetchTopics();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân công.');
    }
  };

  const handleFilter = (values) => {
    fetchTopics(values);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    fetchTopics();
  };

  // Hàm xử lý xuất dữ liệu ra file Word (.doc)
  const handleExportData = () => {
    if (!topics || topics.length === 0) {
      message.warning('Không có dữ liệu để xuất!');
      return;
    }

    const statusMap = {
      pending: 'SV mới nộp', instructor_approved: 'GVHD đã duyệt', approved: 'Khoa đã duyệt',
      grading: 'Đang chấm điểm', revision_requested: 'Yêu cầu sửa', completed: 'Đã nghiệm thu', rejected: 'Bị từ chối'
    };
    const roundMap = { 1: 'Vòng Khoa', 2: 'Vòng Trường', 3: 'Hoàn thành', 0: 'Dừng ở Khoa' };

    let tableRows = '';
    topics.forEach((t, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid black; padding: 5px;">${t.title || ''}</td>
          <td style="border: 1px solid black; padding: 5px;">${t.student_name || ''} (${t.student_code || ''})</td>
          <td style="border: 1px solid black; padding: 5px;">${t.faculty_name || ''}</td>
          <td style="border: 1px solid black; padding: 5px;">${t.major || ''}</td>
          <td style="border: 1px solid black; padding: 5px;">${t.instructor_name || ''}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${roundMap[t.round_status] || ''}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${statusMap[t.status] || t.status}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: right;">${t.funding ? new Intl.NumberFormat('vi-VN').format(t.funding) : 0} VNĐ</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${t.average_score ? parseFloat(t.average_score).toFixed(2) : ''}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Export Word</title>
        <style>
          body { font-family: 'Times New Roman', serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { border: 1px solid black; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: center; }
          h2 { text-align: center; font-size: 24px; text-transform: uppercase; }
          p.date { text-align: right; font-style: italic; }
        </style>
      </head>
      <body>
        <h2>BÁO CÁO DANH SÁCH ĐỀ TÀI</h2>
        <p class="date">Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Đề Tài</th>
              <th>Sinh Viên TH</th>
              <th>Khoa</th>
              <th>Chuyên Ngành</th>
              <th>GV Hướng Dẫn</th>
              <th>Vòng Thi</th>
              <th>Trạng Thái</th>
              <th>Kinh Phí</th>
              <th>Điểm TB</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Tạo blob và download file
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_Danh_Sach_De_Tai_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Tên đề tài', dataIndex: 'title', key: 'title', width: '25%', render: text => <strong>{text}</strong> },
    { 
      title: 'Nhóm thực hiện', 
      key: 'student_info', 
      width: '20%',
      render: (_, record) => (
        <Text><strong>Nhóm trưởng:</strong> {record.student_name}<br/>
        {record.team_members && (() => {
            try {
              const members = JSON.parse(record.team_members);
              if (Array.isArray(members) && members.length > 0) {
                return <Text type="secondary"><strong>Thành viên:</strong> {members.map(m => `${m.full_name} (${m.student_code})`).join(', ')}</Text>;
              }
            } catch (e) { return <Text type="secondary"><strong>Thành viên:</strong> {record.team_members}</Text>; }
            return null;
          })()}</Text>
      )
    },
    { title: 'Khoa', dataIndex: 'faculty_name', key: 'faculty_name', width: '15%', render: faculty => faculty || <Tag>Chưa có</Tag> },
    { title: 'Giảng viên hướng dẫn', dataIndex: 'instructor_name', key: 'instructor_name', width: '15%', render: text => text ? <Text strong>{text}</Text> : <Tag>Chưa có</Tag> },
    { title: 'Chuyên ngành', dataIndex: 'major', key: 'major', width: '15%', render: major => major || <Tag>Chưa có</Tag> },
    { 
      title: 'Kinh phí', dataIndex: 'funding', key: 'funding', width: '10%',
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
      title: 'Vòng thi', dataIndex: 'round_status', key: 'round_status', width: '10%',
      render: round => {
        if (round === 1) return <Tag color="magenta">VÒNG KHOA</Tag>;
        if (round === 2) return <Tag color="geekblue">VÒNG TRƯỜNG</Tag>;
        if (round === 3) return <Tag color="gold">HOÀN THÀNH</Tag>;
        if (round === 0) return <Tag color="default">DỪNG Ở KHOA</Tag>;
        return <Tag>Chưa rõ</Tag>;
      }
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      width: '8%',
      render: (score, record) => {
        if (record.status === 'approved') return <Text type="secondary">Chưa có</Text>;
        return score ? <Tag color="purple"><b>{parseFloat(score).toFixed(2)}</b></Tag> : <Text type="secondary">Chưa có</Text>;
      },
    },
    { title: 'Trạng thái hồ sơ', dataIndex: 'status', key: 'status', width: '15%', render: renderStatusTag },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="dashed" icon={<EditOutlined />} onClick={() => showUpdateModal(record)}>
            Cập nhật & Kinh phí
          </Button>
          {/* Cho phép phân công khi đề tài đã được duyệt hoặc đang chấm (để sửa) */}
          <Button type="primary" ghost icon={<TeamOutlined />} onClick={() => showAssignModal(record)} disabled={!['approved', 'grading'].includes(record.status)}>
            Phân công
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Quản lý đề tài tổng thể</Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportData} style={{ backgroundColor: '#52c41a' }}>
          Xuất danh sách (CSV)
        </Button>
      </div>

      <Form
        form={filterForm}
        layout="inline"
        onFinish={handleFilter}
        style={{ marginBottom: 24, background: '#fafafa', padding: '16px', borderRadius: '8px' }}
      >
        <Form.Item name="campaign_id" label="Lọc theo Đợt thi">
          <Select allowClear placeholder="Tất cả các đợt thi" style={{ width: 220 }} showSearch optionFilterProp="children">
            {campaigns.map(campaign => (
              <Option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.academic_year})
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="faculty" label="Lọc theo Khoa">
          <Select allowClear placeholder="Tất cả các khoa" style={{ width: 220 }}>
            {Object.keys(FACULTY_MAJORS).map(faculty => (
              <Option key={faculty} value={faculty}>{faculty}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="Lọc theo ngày nộp">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Lọc</Button>
          <Button style={{ marginLeft: 8 }} onClick={resetFilters}>Xóa bộ lọc</Button>
        </Form.Item>
      </Form>

      <Table columns={columns} dataSource={topics} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 'max-content' }} />
      
      <Modal title={`Cập nhật thông tin & Kinh phí: ${editingTopic?.title}`} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Lưu thay đổi" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleUpdateProgress}>
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
                  <Option value="approved" disabled={role !== 'director'}>Đã được Giám đốc duyệt</Option>
                  <Option value="rejected" disabled={role !== 'director'}>Bị Giám đốc từ chối</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title={`Phân công giám khảo: ${assigningTopic?.title}`} open={isAssignModalVisible} onCancel={() => setIsAssignModalVisible(false)} onOk={() => assignForm.submit()} okText="Lưu phân công" cancelText="Hủy">
        <Form form={assignForm} layout="vertical" onFinish={handleAssignCouncil}>
          <Form.Item 
            label="Chọn Giám khảo (Hội đồng)" 
            name="council_members" 
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 giám khảo!' }]}
          >
            <Select mode="multiple" placeholder="Chọn các giám khảo để chấm đề tài này">
              {councilMembers.map(member => (
                <Option key={member.id} value={member.id}>{member.full_name} ({member.faculty_name || 'Chưa có Khoa'})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
export default FacultyTopicManagement;