import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Descriptions, Form, Input, message, Row, Select, Space, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/campaignService';
import { topicService } from '../../services/topicService';
import { userService } from '../../services/userService';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TopicRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [inactiveCampaigns, setInactiveCampaigns] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [form] = Form.useForm();
  
  const location = useLocation();
  const navigate = useNavigate();
  const editTopic = location.state?.editTopic;

  const studentId = useMemo(() => studentProfile?.id, [studentProfile]);
  const studentCode = useMemo(() => studentProfile?.student_code, [studentProfile]);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instructorData, campaignData, profileData] = await Promise.all([
          userService.getAllInstructors(),
          campaignService.getAllCampaigns(),
          userService.getUserProfile()
        ]);
        setInstructors(instructorData);
        setStudentProfile(profileData);
        
        const today = dayjs();
        const active = [];
        const inactive = [];

        campaignData.forEach(c => {
          let reason = '';
          if (c.status !== 'active') {
            reason = 'Đợt thi đã được đóng lại.';
          } else if (c.registration_deadline && today.isAfter(dayjs(c.registration_deadline).endOf('day'))) {
            reason = `Đã quá hạn đăng ký (Hạn chót: ${dayjs(c.registration_deadline).format('DD/MM/YYYY')}).`;
          }

          if (reason) {
            inactive.push({ ...c, inactive_reason: reason });
          } else {
            active.push(c);
          }
        });

        setActiveCampaigns(active);
        setInactiveCampaigns(inactive);

        if (!editTopic && active.length === 1) {
          form.setFieldsValue({ campaign_id: active[0].id });
        }
      } catch (error) {
        console.error('Không thể tải dữ liệu:', error);
        message.error('Lỗi: Không thể tải dữ liệu.');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [editTopic]);

  useEffect(() => {
    if (editTopic) {
      form.setFieldsValue({
        title: editTopic.title,
        english_title: editTopic.english_title,
        field_of_study: editTopic.field_of_study,
        // Chuyển đổi chuỗi JSON team_members thành object để form nhận diện
        team_members: (() => {
          try {
            return JSON.parse(editTopic.team_members);
          } catch (e) { return []; }
        })(),
        instructor_id: editTopic.instructor_id,
        description: editTopic.description,
        campaign_id: editTopic.campaign_id,
      });
    }
  }, [editTopic, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = { 
        ...values, 
        // Chuyển đổi object team_members thành chuỗi JSON trước khi gửi đi
        team_members: JSON.stringify(values.team_members || []),
        instructor_id: parseInt(values.instructor_id, 10),
        campaign_id: parseInt(values.campaign_id, 10),
      }; 
      
      if (editTopic) {
        await topicService.updateTopic(editTopic.id, payload);
        message.success('Cập nhật đề tài thành công!');
        navigate('/student/my-topics');
      } else {
        await topicService.registerTopic(payload);
        message.success('Đăng ký đề tài NCKH thành công!');
        form.resetFields();
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký/cập nhật:', error.response?.data || error.message);
      message.error(error.response?.data?.message || 'Không thể kết nối đến máy chủ, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <Card size="small" style={{ maxWidth: 800, margin: '8px auto', width: '100%' }}>
      <Title level={4} style={{ textAlign: 'center', color: '#1890ff', margin: '8px 0 16px 0' }}>
        {editTopic ? 'Cập Nhật Đề Tài' : 'Đăng Ký Đề Tài Nghiên Cứu Khoa Học'}
      </Title>
      
      {editTopic && editTopic.revision_reason && (
        <Alert 
          message="Lý do yêu cầu chỉnh sửa:" 
          description={editTopic.revision_reason} 
          type="warning" 
          showIcon 
          style={{ marginBottom: 20 }}
        />
      )}

      {!editTopic && activeCampaigns.length === 0 && (
        <Alert 
          message="Không có đợt thi/chiến dịch NCKH nào đang mở đăng ký."
          description={
            <div>
              <p>Hiện tại hệ thống không có đợt thi nào đang diễn ra hoặc đã quá hạn đăng ký. Bạn không thể đăng ký đề tài lúc này.</p>
              {inactiveCampaigns.length > 0 && (
                <>
                  <p style={{ marginTop: 10, fontWeight: 'bold' }}>Trạng thái các đợt thi gần đây:</p>
                  <ul>
                    {inactiveCampaigns.map(c => (
                      <li key={c.id}>{c.name} ({c.academic_year}): <Typography.Text type="danger">{c.inactive_reason}</Typography.Text></li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          }
          type="error" 
          showIcon 
          style={{ marginBottom: 20 }}
        />
      )}

      {studentProfile && ( // Thay đổi tiêu đề để làm rõ vai trò
        <Descriptions title="Thông tin Nhóm trưởng (Người đăng ký)" bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Họ và tên">{studentProfile.full_name}</Descriptions.Item>
          <Descriptions.Item label="Mã SV">{studentProfile.student_code}</Descriptions.Item>
          <Descriptions.Item label="Lớp">{studentProfile.class_name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Ngành">{studentProfile.major || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Khoa" span={2}>{studentProfile.faculty_name || 'N/A'}</Descriptions.Item>
        </Descriptions>
      )}

      <Form 
        form={form} 
        layout="vertical" 
        size="small"
        onFinish={onFinish}
        disabled={!editTopic && activeCampaigns.length === 0}
      >
        <Form.Item label="Đợt thi / Chiến dịch NCKH" name="campaign_id" rules={[{ required: true, message: 'Vui lòng chọn đợt thi!' }]}>
          <Select placeholder="Chọn đợt thi..." disabled={editTopic}>
            {editTopic && !activeCampaigns.find(c => c.id === form.getFieldValue('campaign_id')) && (
              <Option key="current" value={form.getFieldValue('campaign_id')}>Đợt thi hiện tại (Đã khóa/Ẩn)</Option>
            )}
            {activeCampaigns.map(campaign => (
              <Option key={campaign.id} value={campaign.id}>{campaign.name} ({campaign.academic_year})</Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Tên đề tài (Tiếng Việt)" name="title" rules={[{ required: true, message: 'Vui lòng nhập tên đề tài!' }]}>
              <Input placeholder="Nhập tên đề tài NCKH (Tiếng Việt)..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Tên đề tài (Tiếng Anh)" name="english_title">
              <Input placeholder="Nhập tên đề tài NCKH (Tiếng Anh)..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Lĩnh vực nghiên cứu (Khoa)" name="field_of_study" initialValue="Khoa Công nghệ và Kỹ thuật">
              <Select>
                <Select.Option value="Khoa Công nghệ và Kỹ thuật">Khoa Công nghệ và Kỹ thuật</Select.Option>
                <Select.Option value="Khoa Kinh tế và Quản trị">Khoa Kinh tế và Quản trị</Select.Option>
                <Select.Option value="Khoa Luật, Chính trị học và Quan hệ Quốc tế">Khoa Luật, Chính trị học và Quan hệ Quốc tế</Select.Option>
                <Select.Option value="Khoa Khoa học Cơ bản">Khoa Khoa học Cơ bản</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Giảng viên hướng dẫn" name="instructor_id" rules={[{ required: true, message: 'Vui lòng chọn GVHD!' }]}>
              <Select
                showSearch
                placeholder="Chọn giảng viên hướng dẫn..."
                optionFilterProp="children"
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
              >
                {instructors.map(instructor => (
                  <Option key={instructor.id} value={instructor.id}>{instructor.full_name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.List name="team_members">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'student_code']}
                        rules={[{ required: true, message: 'Nhập MSSV' }]}
                      >
                        <Input placeholder="Mã số sinh viên" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'full_name']}
                        rules={[{ required: true, message: 'Nhập họ tên' }]}
                      >
                        <Input placeholder="Họ và tên thành viên" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm thành viên</Button></Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item label="Tóm tắt nội dung (Thuyết minh)" name="description" rules={[{ required: true, message: 'Vui lòng nhập tóm tắt!' }]}>
          <TextArea rows={2} placeholder="Mô tả ngắn gọn mục tiêu, phương pháp và kết quả dự kiến..." />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block disabled={!editTopic && activeCampaigns.length === 0}>
            {editTopic ? 'Cập Nhật Đề Tài' : 'Nộp Đăng Ký'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TopicRegistration;