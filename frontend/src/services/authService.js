import api from './api';

export const authService = {
  // Hàm xử lý đăng nhập
  login: async (credentials) => {
    try {
      // --- CODE GỌI API BACKEND THẬT ---
      const response = await api.post('/auth/login', credentials);
      if (response.data && response.data.token) {
        localStorage.setItem('accessToken', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userName', response.data.user.full_name);
      }
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gọi API đăng nhập:', error.response?.data || error.message);
      throw error; // Ném lỗi ra ngoài để component giao diện (UI) có thể hiển thị thông báo "Đăng nhập thất bại..."
    }
  },

  // Hàm xử lý đăng xuất
  logout: () => {
    // Xóa tất cả thông tin người dùng đã lưu để đảm bảo đăng xuất sạch sẽ
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  }
};