import { ConfigProvider, theme } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Thêm CSS thu nhỏ 90% cho toàn bộ hệ thống (Cách 2 - CSS Zoom)
const globalStyle = document.createElement('style');
globalStyle.innerHTML = `
  body {
    margin: 0;
    padding: 0;
  }

  /* Tối ưu hóa Modal Fullscreen (Ép tràn viền 100% chống lỗi CSS Zoom) */
  .full-screen-modal .ant-modal {
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .full-screen-modal .ant-modal-content {
    height: 100% !important;
    display: flex;
    flex-direction: column;
    border-radius: 0 !important;
  }
  .full-screen-modal .ant-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background-color: #f0f2f5;
  }

  /* Giới hạn độ rộng nội dung, căn giữa để bảng không bị kéo giãn ngang quá to */
  .full-screen-modal .ant-modal-body > div,
  .full-screen-modal .ant-modal-body > form {
    max-width: 1600px;
    margin: 0 auto;
    background: #ffffff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  /* Tối ưu hóa khi In ấn (Print) */
  @media print {
    body * {
      visibility: hidden;
    }
    .ant-modal-content, .ant-modal-content * {
      visibility: visible;
    }
    .ant-modal-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
    .ant-modal-footer, .ant-modal-close {
      display: none !important; /* Ẩn nút bấm khi in ra giấy */
    }
  }
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.compactAlgorithm, // Kích hoạt chế độ giao diện thu gọn/mật độ cao của Ant Design
        token: {
          colorPrimary: '#0050b3', // Đổi mã màu chủ đạo tại đây (VD: #0050b3 là xanh dương đậm)
          borderRadius: 6, // Chỉnh độ bo góc mặc định cho tất cả nút bấm, form, thẻ card
          fontSize: 13, // Thu nhỏ font chữ toàn hệ thống (mặc định là 14px)
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)