import { EyeOutlined, MinusCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Divider, Drawer, Form, Input, InputNumber, List, message, Modal, Popconfirm, Row, Select, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaignService';
import TopicManagement from './TopicManagement';

const { Title, Text } = Typography;
const { Option } = Select;

const getStatusTag = (status) => {
  const map = {
    'pending': { color: 'gold', text: 'Chờ duyệt' },
    'instructor_approved': { color: 'cyan', text: 'GVHD Đã Duyệt' },
    'approved': { color: 'blue', text: 'Đã duyệt' },
    'grading': { color: 'purple', text: 'Đang chấm' },
    'revision_requested': { color: 'orange', text: 'Yêu cầu sửa' },
    'completed': { color: 'green', text: 'Hoàn thành' },
    'rejected': { color: 'red', text: 'Từ chối' },
  };
  const config = map[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const getRoundText = (round) => {
  if (round === 1) return 'Vòng Khoa';
  if (round === 2) return 'Vòng Trường';
  if (round === 3) return 'Hoàn thành';
  if (round === 0) return 'Dừng ở Khoa';
  return 'Không xác định';
};

// Hàm hỗ trợ parse chuỗi giải thưởng an toàn nhiều lớp
const parseStructure = (data) => {
  if (!data) return [];
  let parsed = data;
  while (typeof parsed === 'string') {
    try {
      const next = JSON.parse(parsed);
      if (next === parsed || next === null) break;
      parsed = next;
    } catch (e) {
      break;
    }
  }
  return Array.isArray(parsed) ? parsed : [];
};

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Lấy role từ localStorage và kiểm tra quyền quản lý đợt thi (chỉ Giám đốc và Chuyên viên)
  const role = localStorage.getItem('userRole');
  const canManage = ['director', 'specialist'].includes(role);

  // Search and Filter states
  const [searchText, setSearchText] = useState('');
  const [filterDates, setFilterDates] = useState(null);

  // Detail Drawer state
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data.map(item => ({ ...item, key: item.id })));
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách đợt thi!');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      
      const parsedAwardStructure = parseStructure(record.award_structure);
      
      form.setFieldsValue({
        ...record,
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
        registration_deadline: record.registration_deadline ? dayjs(record.registration_deadline) : null,
        submission_deadline: record.submission_deadline ? dayjs(record.submission_deadline) : null,
        council_date: record.council_date ? dayjs(record.council_date) : null,
        award_structure: parsedAwardStructure
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ status: 'active' });
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    setSubmitLoading(true);
    // Chuyển đổi định dạng ngày tháng từ DayJS object sang string 'YYYY-MM-DD'
    const formattedValues = {
      ...values,
      start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      registration_deadline: values.registration_deadline ? values.registration_deadline.format('YYYY-MM-DD') : null,
      submission_deadline: values.submission_deadline ? values.submission_deadline.format('YYYY-MM-DD') : null,
      council_date: values.council_date ? values.council_date.format('YYYY-MM-DD') : null,
      award_structure: JSON.stringify(values.award_structure || []) // Đảm bảo gửi lên dưới dạng chuỗi JSON
    };
    try {
      if (editingId) {
        await campaignService.updateCampaign(editingId, formattedValues);
        message.success('Cập nhật đợt thi thành công!');
      } else {
        await campaignService.createCampaign(formattedValues);
        message.success('Tạo đợt thi mới thành công!');
      }
      setIsModalVisible(false);
      fetchCampaigns();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await campaignService.deleteCampaign(id);
      message.success('Đã xóa đợt thi!');
      fetchCampaigns();
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa đợt thi thất bại!');
    }
  };

  const showDetails = async (record) => {
    setSelectedCampaign(record);
    setDetailsVisible(true);
    setStatsLoading(true);
    try {
      const stats = await campaignService.getCampaignStats(record.id);
      setCampaignStats(stats);
    } catch (error) {
      message.error('Không thể tải thống kê chi tiết!');
    } finally {
      setStatsLoading(false);
    }
  };

  const columns = [
    { title: 'Tên Đợt Thi', dataIndex: 'name', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Năm Học', dataIndex: 'academic_year', key: 'academic_year' },
    { title: 'Bắt đầu', dataIndex: 'start_date', key: 'start_date', render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    { title: 'Kết thúc', dataIndex: 'end_date', key: 'end_date', render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: status => <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</Tag>
    },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showDetails(record)} type="default">Chi tiết</Button>
          {canManage && <Button onClick={() => showModal(record)}>Sửa</Button>}
          {canManage && (
            <Popconfirm title="Bạn có chắc muốn xóa đợt thi này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
              <Button danger>Xóa</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const filteredCampaigns = campaigns.filter(item => {
    const matchSearch = (item.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
                        (item.academic_year || '').toLowerCase().includes(searchText.toLowerCase());
    
    let matchDate = true;
    if (filterDates && filterDates[0] && filterDates[1]) {
      const filterStart = filterDates[0].startOf('day');
      const filterEnd = filterDates[1].endOf('day');
      const itemStart = item.start_date ? dayjs(item.start_date) : null;
      const itemEnd = item.end_date ? dayjs(item.end_date) : null;

      if (itemStart && itemEnd) {
        matchDate = !itemStart.isAfter(filterEnd, 'day') && !itemEnd.isBefore(filterStart, 'day');
      } else if (itemStart) {
        matchDate = !itemStart.isBefore(filterStart, 'day') && !itemStart.isAfter(filterEnd, 'day');
      } else if (itemEnd) {
        matchDate = !itemEnd.isBefore(filterStart, 'day') && !itemEnd.isAfter(filterEnd, 'day');
      } else {
        matchDate = false;
      }
    }
    
    return matchSearch && matchDate;
  });

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3} style={{ color: '#1890ff', margin: 0 }}>Quản lý Đợt thi / Năm học NCKH</Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Tạo Đợt Thi</Button>
        )}
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm theo tên, năm học..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <DatePicker.RangePicker
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(dates) => setFilterDates(dates)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>

      <Table columns={columns} dataSource={filteredCampaigns} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 'max-content' }} />
      
      <Modal title={editingId ? "Cập nhật đợt thi" : "Tạo đợt thi mới"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy" confirmLoading={submitLoading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Tên Đợt Thi" name="name" rules={[{ required: true, message: 'Nhập tên đợt thi!' }, { max: 255, message: 'Tên đợt thi không được vượt quá 255 ký tự!' }]}><Input placeholder="VD: NCKH Sinh viên Cấp trường 2024" maxLength={255} /></Form.Item>
          <Form.Item label="Năm Học" name="academic_year" rules={[{ required: true, message: 'Nhập năm học!' }, { pattern: /^\d{4}-\d{4}$/, message: 'Định dạng phải là YYYY-YYYY (VD: 2023-2024)' }]}><Input placeholder="VD: 2023-2024" maxLength={9} /></Form.Item>
          <Space style={{ display: 'flex', width: '100%', gap: '16px' }}>
            <Form.Item style={{ flex: 1 }} label="Ngày bắt đầu" name="start_date" rules={[{ required: true, message: 'Chọn ngày bắt đầu!' }]}><DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
            <Form.Item style={{ flex: 1 }} label="Ngày kết thúc" name="end_date" dependencies={['start_date']} rules={[{ required: true, message: 'Chọn ngày kết thúc!' }, ({ getFieldValue }) => ({ validator(_, value) { if (value && getFieldValue('start_date') && value.isBefore(getFieldValue('start_date'))) { return Promise.reject(new Error('Ngày kết thúc phải là hoặc sau ngày bắt đầu!')); } return Promise.resolve(); } })]}><DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
          </Space>
          <Space style={{ display: 'flex', width: '100%', gap: '16px' }}>
            <Form.Item style={{ flex: 1 }} label="Hạn đăng ký" name="registration_deadline"><DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
            <Form.Item style={{ flex: 1 }} label="Hạn nộp báo cáo" name="submission_deadline"><DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
            <Form.Item style={{ flex: 1 }} label="Ngày Hội đồng" name="council_date"><DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item>
          </Space>
          <Divider>Cấu trúc giải thưởng (Tùy chọn)</Divider>
          <Form.List name="award_structure">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'baseline' }} align="baseline">
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Nhập tên giải' }]} style={{flex: 2}}>
                      <Input placeholder="Tên giải (VD: Giải Nhất)" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Nhập số lượng' }]} style={{flex: 1}}>
                      <InputNumber placeholder="Số lượng" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'prize']} rules={[{ required: true, message: 'Nhập nội dung thưởng' }]} style={{flex: 3}}>
                      <Input placeholder="Nội dung/Hiện vật (VD: 5,000,000 VND)" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm hạng mục giải thưởng
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item label="Trạng thái" name="status"><Select><Option value="active">Đang mở (Active)</Option><Option value="closed">Đã đóng (Closed)</Option></Select></Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={<span style={{ fontSize: 18 }}>Chi tiết Đợt thi: {selectedCampaign?.name}</span>}
        width="100vw"
        placement="right"
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
      >
        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
        ) : campaignStats ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
                  <Statistic title="Tổng số đề tài" value={campaignStats.topics?.length || 0} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
                  <Statistic 
                    title="Đề tài vòng Trường" 
                    value={campaignStats.roundStats?.find(r => r.round_status === 2)?.count || 0} 
                    valueStyle={{ color: '#cf1322' }} 
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
                  <Statistic 
                    title="Đề tài đã hoàn thành" 
                    value={campaignStats.statusStats?.find(s => s.status === 'completed')?.count || 0} 
                    valueStyle={{ color: '#3f8600' }} 
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">Thống kê theo Khoa</Divider>
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={campaignStats.facultyStats || []}
              renderItem={item => (
                <List.Item key={item.faculty_name || 'unknown-faculty'}>
                  <Card size="small" title={item.faculty_name || 'Chưa phân Khoa'}>{item.count} đề tài</Card>
                </List.Item>
              )}
            />

            <Divider orientation="left">Quản lý đề tài tham gia</Divider>
            <TopicManagement campaignId={selectedCampaign.id} />
          </div>
        ) : (
          <Text type="danger">Không có dữ liệu thống kê!</Text>
        )}
      </Drawer>
    </Card>
  );
};
export default CampaignManagement;