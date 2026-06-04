import api from './api';

export const userService = {
  // Lấy thông tin cá nhân
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Lấy danh sách giảng viên
  getAllInstructors: async () => {
    const response = await api.get('/users/instructors');
    return response.data;
  },

  // Lấy danh sách giám khảo
  getAllCouncilMembers: async () => {
    const response = await api.get('/users/council');
    return response.data;
  },

  // Lấy danh sách toàn bộ người dùng
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Tạo người dùng mới
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Cập nhật thông tin người dùng
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Xóa người dùng
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};