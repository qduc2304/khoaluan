import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Select, Typography, Upload, message } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

export default function ReportSubmission() {
  const [topics, setTopics] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();
  const defaultTopicId = location.state?.topicId;
  const selectedTopicId = Form.useWatch('topic_id', form);

  useEffect(() => {
    fetchMyTopics();
    fetchMyReports();
  }, []);

  useEffect(() => {
    if (defaultTopicId) {
      form.setFieldsValue({ topic_id: defaultTopicId });
    }
  }, [defaultTopicId, form]);

  const fetchMyTopics = async () => {
    try {
      const response = await api.get('/topics/my-topics');
      const topicsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      // Sinh viên chỉ được nộp báo cáo cho đề tài đã được duyệt hoặc đang chấm
      const allowedTopics = topicsData.filter(t => ['approved', 'grading'].includes(t.status));
      setTopics(allowedTopics);

      if (defaultTopicId && !allowedTopics.find(t => t.id === defaultTopicId)) {
        message.warning('Đề tài này đã nghiệm thu hoặc không được phép nộp báo cáo!');
        form.setFieldsValue({ topic_id: null });
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách đề tài!');
    }
  };

  const fetchMyReports = async () => {
    try {
      const response = await api.get('/reports');
      setMyReports(response.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử báo cáo', error);
    }
  };

  useEffect(() => {
    if (selectedTopicId) {
      const report = myReports.find(r => Number(r.topic_id) === Number(selectedTopicId));
      if (report) {
        form.setFieldsValue({
          work_file: report.work_file_name ? [{
            uid: 'work',
            name: report.work_file_name,
            status: 'done',
            // Đổi thuộc tính url thành serverUrl để tránh lỗi React Router tự động chuyển trang
            serverUrl: report.work_file_url
          }] : [],
          pp_file: report.pp_file_name ? [{
            uid: 'pp',
            name: report.pp_file_name,
            status: 'done',
            // Đổi thuộc tính url thành serverUrl để tránh lỗi React Router tự động chuyển trang
            serverUrl: report.pp_file_url
          }] : []
        });
      } else {
        form.setFieldsValue({ work_file: [], pp_file: [] });
      }
    }
  }, [selectedTopicId, myReports, form]);

  const onFinish = async (values) => {
    const isWorkNew = values.work_file?.[0]?.originFileObj;
    const isPpNew = values.pp_file?.[0]?.originFileObj;

    if (!isWorkNew && !isPpNew && !values.work_file?.length && !values.pp_file?.length) {
      message.warning('Vui lòng chọn ít nhất 1 file để tải lên!');
      return;
    }

    if (!isWorkNew && !isPpNew) {
      message.info('Không có file mới nào được chọn để cập nhật.');
      return;
    }

    const formData = new FormData();
    formData.append('topic_id', values.topic_id);
    
    if (isWorkNew) {
      formData.append('work_file', values.work_file[0].originFileObj);
    }
    if (isPpNew) {
      formData.append('pp_file', values.pp_file[0].originFileObj);
    }

    setLoading(true);
    try {
      await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success('Nộp báo cáo thành công!');
      fetchMyReports(); // Cập nhật lại lịch sử nộp
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tải file lên!');
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handlePreview = (file) => {
    // Lấy đường dẫn file từ thuộc tính serverUrl chúng ta vừa đổi
    const fileUrl = file.serverUrl || file.url;

    // Nếu là file đã tải lên (có đường dẫn url trên server)
    if (fileUrl) {
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
      const safeFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      window.open(`${backendUrl}${safeFileUrl}`, '_blank');
    } else if (file.originFileObj) {
      // Nếu là file local người dùng vừa chọn nhưng chưa upload
      const blobUrl = window.URL.createObjectURL(file.originFileObj);
      window.open(blobUrl, '_blank');
    }
  };

  const selectedReport = myReports.find(r => Number(r.topic_id) === Number(selectedTopicId));

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ color: '#1890ff', marginBottom: 24 }}>Nộp Báo Cáo / Slide Trình Chiếu</Title>
      
      {selectedReport && (
         <Alert 
           message="Đã có báo cáo nộp trước đó" 
           description={
             <div>
               <p><strong>Ngày nộp:</strong> {new Date(selectedReport.submitted_at).toLocaleString('vi-VN')}</p>
               <p>Bạn có thể tải lên file mới để ghi đè file cũ.</p>
             </div>
           } 
           type="info" 
           showIcon 
           style={{ marginBottom: 20 }} 
         />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="topic_id" label="Đề tài của bạn" rules={[{ required: true, message: 'Vui lòng chọn đề tài!' }]}>
          <Select disabled={!!defaultTopicId} placeholder="Chỉ hiển thị các đề tài đã được duyệt...">
            {topics.map(t => <Option key={t.id} value={t.id}>{t.title}</Option>)}
          </Select>
        </Form.Item>
        {/* Cấu trúc Upload bắt buộc phải có thẻ đóng </Upload> */}
        <Form.Item name="work_file" label="File Báo cáo (Word / PDF)" valuePropName="fileList" getValueFromEvent={normFile}>
          <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx" onPreview={handlePreview}>
            <Button icon={<UploadOutlined />}>Chọn file báo cáo</Button>
          </Upload>
        </Form.Item>
        {/* Cấu trúc Upload bắt buộc phải có thẻ đóng </Upload> */}
        <Form.Item name="pp_file" label="File Trình chiếu (PowerPoint / PDF)" valuePropName="fileList" getValueFromEvent={normFile}>
          <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.ppt,.pptx" onPreview={handlePreview}>
            <Button icon={<UploadOutlined />}>Chọn file trình chiếu</Button>
          </Upload>
        </Form.Item>
        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Gửi Lên Hệ Thống
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}