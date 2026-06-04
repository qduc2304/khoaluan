import api from './api';

export const topicService = {
  getAllTopics: async (params) => {
    // --- CODE GỌI API BACKEND THẬT ---
    const response = await api.get('/topics', { params });
    return response.data;
  },

  // Lấy đề tài của sinh viên đang đăng nhập
  getMyTopics: async () => {
    const response = await api.get('/topics/my-topics');
    return response.data;
  },

  // Lấy danh sách đề tài mà giảng viên (người đăng nhập) đang hướng dẫn
  getInstructorTopics: async () => {
    const response = await api.get('/topics/instructor');
    return response.data;
  },

  registerTopic: (topicData) => { // Sửa lại đường dẫn API cho đúng
    return api.post('/topics/register', topicData);
  },

  updateTopic: (topicId, topicData) => {
    return api.put(`/topics/${topicId}`, topicData);
  },

  updateTopicStatus: (topicId, data) => {
    // Hỗ trợ truyền vào một chuỗi (vd: 'approved') hoặc một object (vd: { status, round_status })
    if (typeof data === 'string') {
      return api.patch(`/topics/${topicId}/status`, { status: data });
    }
    return api.patch(`/topics/${topicId}/status`, data);
  },

  // Lấy danh sách đề tài được phân công cho giám khảo
  getAssignedTopics: async () => {
    const response = await api.get('/topics/assigned');
    return response.data;
  },

  // Phân công đề tài cho giám khảo
  assignTopic: (topicId, councilMembers) => {
    return api.post(`/topics/${topicId}/assign`, { council_members: councilMembers });
  },

  // Lấy chi tiết đề tài
  getTopicDetails: async (topicId) => {
    const response = await api.get(`/topics/${topicId}/details`);
    return response.data;
  },

  // Xóa đề tài (Dành cho Quản trị viên)
  deleteTopic: (topicId) => {
    return api.delete(`/topics/${topicId}`);
  }
};