import { CloseOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber, message, Modal, Popconfirm, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaignService';
import { topicService } from '../../services/topicService';
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
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportReport = async () => {
    if (!selectedCampaign) return;
    setIsExporting(true);
    try {
      const response = await topicService.getAllTopics({ campaign_id: selectedCampaign.id });
      let topicsData = [];
      if (Array.isArray(response)) topicsData = response;
      else if (response?.data && Array.isArray(response.data)) topicsData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data)) topicsData = response.data.data;

      if (topicsData.length === 0) {
        message.warning('Không có dữ liệu để xuất báo cáo!');
        return;
      }

      const statusMap = {
        pending: 'Chờ duyệt', instructor_approved: 'GVHD đã duyệt', approved: 'Đã duyệt',
        grading: 'Đang chấm', revision_requested: 'Yêu cầu sửa', completed: 'Hoàn thành', rejected: 'Từ chối'
      };
      const roundMap = { 1: 'Vòng Khoa', 2: 'Vòng Trường', 3: 'Hoàn thành', 0: 'Dừng ở Khoa' };

      let tableRows = '';
      topicsData.forEach((t, index) => {
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 5px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid black; padding: 5px;">${t.title || ''}</td>
            <td style="border: 1px solid black; padding: 5px;">${t.student_name || ''} (${t.student_code || ''})</td>
            <td style="border: 1px solid black; padding: 5px;">${t.faculty_name || ''}</td>
            <td style="border: 1px solid black; padding: 5px;">${t.instructor_name || ''}</td>
            <td style="border: 1px solid black; padding: 5px; text-align: center;">${roundMap[t.round_status] || ''}</td>
            <td style="border: 1px solid black; padding: 5px; text-align: center;">${statusMap[t.status] || t.status}</td>
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
          <h2>BÁO CÁO DANH SÁCH ĐỀ TÀI: ${selectedCampaign.name}</h2>
          <p class="date">Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
          <table>
            <thead>
              <tr>
                <th>STT</th><th>Tên Đề Tài</th><th>Sinh Viên TH</th><th>Khoa</th>
                <th>GV Hướng Dẫn</th><th>Vòng Thi</th><th>Trạng Thái</th><th>Điểm TB</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao_Cao_De_Tai_${selectedCampaign.id}_${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('Xuất báo cáo thành công!');
    } catch (error) {
      message.error('Lỗi khi xuất báo cáo!');
    } finally {
      setIsExporting(false);
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
    { title: 'Tên Đợt Thi', dataIndex: 'name', key: 'name', width: 250, render: text => <strong>{text}</strong> },
    { title: 'Năm Học', dataIndex: 'academic_year', key: 'academic_year', width: 120 },
    { title: 'Bắt đầu', dataIndex: 'start_date', key: 'start_date', width: 120, render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    { title: 'Kết thúc', dataIndex: 'end_date', key: 'end_date', width: 120, render: date => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130,
      render: status => <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</Tag>
    },
    {
      title: 'Hành động', key: 'action', fixed: 'right', width: 240, align: 'center',
      render: (_, record) => (
        <Space direction="horizontal" size="small">
          <Button size="small" icon={<SearchOutlined />} onClick={() => showDetails(record)} type="default" style={{ fontSize: '12px' }}>Chi tiết</Button>
          {canManage && <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)} style={{ fontSize: '12px' }}>Sửa</Button>}
          {canManage && (
            <Popconfirm title="Bạn có chắc muốn xóa đợt thi này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
              <Button size="small" danger icon={<DeleteOutlined />} style={{ fontSize: '12px' }}>Xóa</Button>
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

      <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Tìm kiếm theo tên, năm học..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
            <DatePicker.RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates) => setFilterDates(dates)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
        </Row>
      </div>

      <Table size="small" columns={columns} dataSource={filteredCampaigns} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 'max-content' }} />
      
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

      <Modal
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={1200}
        style={{ top: 30 }}
        closable={false}
        footer={null}
        bodyStyle={{ padding: '20px', minHeight: '60vh', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết Đợt thi: {selectedCampaign?.name}
          </Title>
          <Button type="text" icon={<CloseOutlined style={{ fontSize: '20px' }} />} onClick={() => setDetailsVisible(false)} />
        </div>

        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', flexGrow: 1 }}><Spin size="large" /></div>
        ) : campaignStats ? (
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {/* Khối thẻ thống kê tổng quan */}
            <Row gutter={[12, 12]} style={{ marginBottom: '12px' }}>
              <Col xs={24} sm={8}>
                <div style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8c8c8c', fontSize: '13px' }}>Tổng số đề tài</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>{campaignStats.topics?.length || 0}</span>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8c8c8c', fontSize: '13px' }}>Đề tài vòng Trường</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#cf1322' }}>{campaignStats.roundStats?.find(r => r.round_status === 2)?.count || 0}</span>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8c8c8c', fontSize: '13px' }}>Đề tài đã hoàn thành</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#3f8600' }}>{campaignStats.statusStats?.find(s => s.status === 'completed')?.count || 0}</span>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0' }} />

            {/* Khối thống kê theo khoa */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#595959', marginBottom: '8px' }}>Thống kê theo Khoa:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(campaignStats.facultyStats || []).map(item => (
                  <div key={item.faculty_name || 'unknown-faculty'} style={{ background: '#fff', border: '1px solid #d9d9d9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#595959' }}>{item.faculty_name || 'Chưa phân Khoa'}</span>
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Quản lý đề tài */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <TopicManagement campaignId={selectedCampaign.id} />
            </div>

            {/* Footer Buttons */}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="primary" icon={<PrinterOutlined />} style={{ background: '#1677ff' }} onClick={handleExportReport} loading={isExporting}>
                In báo cáo
              </Button>
              <Button onClick={() => setDetailsVisible(false)}>
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <Text type="danger">Không có dữ liệu thống kê!</Text>
        )}
      </Modal>
    </Card>
  );
};
export default CampaignManagement;