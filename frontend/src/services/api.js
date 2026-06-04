import axios from 'axios';

const api = axios.create({
  // Tạm thời fix cứng đường dẫn local để tránh bị ảnh hưởng bởi file .env (link ngrok cũ)
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // <-- THÊM DÒNG NÀY ĐỂ VƯỢT QUA NGROK
  }
});

// Thêm Interceptor để tự động đính kèm Token vào mỗi request gửi đi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Đính kèm token vào Header theo chuẩn Bearer Authentication
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
