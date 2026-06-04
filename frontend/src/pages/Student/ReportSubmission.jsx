import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ReportSubmission.css';

export default function ReportSubmission() {
  const location = useLocation();
  const initialTopicId = location.state?.topicId || '';

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId);
  const [workFile, setWorkFile] = useState(null);
  const [ppFile, setPpFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('submit');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTopics();
    fetchMyReports();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentTopics = response.data.filter(t => t.student_id === parseInt(localStorage.getItem('userId')));
      setTopics(studentTopics);
    } catch (error) {
      console.error('Lỗi lấy đề tài:', error);
    }
  };

  const fetchMyReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Lỗi lấy báo cáo:', error);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedTopic) {
      setMessage('❌ Vui lòng chọn đề tài');
      return;
    }
    if (!workFile && !ppFile) {
      setMessage('❌ Vui lòng chọn ít nhất một file (work hoặc pp)');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('topic_id', selectedTopic);
    if (workFile) formData.append('work_file', workFile);
    if (ppFile) formData.append('pp_file', ppFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/reports/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('✅ ' + response.data.message);
      setWorkFile(null);
      setPpFile(null);
      setSelectedTopic('');
      fetchMyReports();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Lỗi nộp báo cáo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-submission-container">
      <h1>📋 Nộp Báo Cáo</h1>
      
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          Nộp Báo Cáo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Lịch Sử Nộp
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {activeTab === 'submit' && (
        <form onSubmit={handleSubmitReport} className="report-form">
          <div className="form-group">
            <label htmlFor="topic">Chọn Đề Tài *</label>
            <select 
              id="topic"
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              required
            >
              <option value="">-- Chọn đề tài --</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>

          <div className="file-input-group">
            <div className="file-input">
              <label htmlFor="work">📄 File Work (nếu có)</label>
              <input 
                type="file" 
                id="work"
                onChange={(e) => setWorkFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls"
              />
              {workFile && <p className="file-name">✓ {workFile.name}</p>}
            </div>

            <div className="file-input">
              <label htmlFor="pp">📊 File PP - PowerPoint (nếu có)</label>
              <input 
                type="file" 
                id="pp"
                onChange={(e) => setPpFile(e.target.files[0])}
                accept=".pdf,.ppt,.pptx"
              />
              {ppFile && <p className="file-name">✓ {ppFile.name}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Đang nộp...' : '📤 Nộp Báo Cáo'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="reports-history">
          <h3>Lịch Sử Báo Cáo Đã Nộp</h3>
          {reports.length === 0 ? (
            <p className="no-reports">Chưa có báo cáo nào</p>
          ) : (
            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <h4>{report.topic_title || 'Đề tài không xác định'}</h4>
                    <span className="submit-date">Nộp: {new Date(report.submitted_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div className="report-files">
                    {report.work_file_url && (
                      <div className="file-item">
                        <span>📄 Work:</span>
                        <a href={report.work_file_url} target="_blank" rel="noreferrer">
                          {report.work_file_name}
                        </a>
                        <span className={`status ${report.work_approved}`}>
                          {report.work_approved === 'approved' && '✅ Được phê duyệt'}
                          {report.work_approved === 'pending' && '⏳ Chờ duyệt'}
                          {report.work_approved === 'rejected' && '❌ Bị từ chối'}
                        </span>
                      </div>
                    )}
                    {report.pp_file_url && (
                      <div className="file-item">
                        <span>📊 PP:</span>
                        <a href={report.pp_file_url} target="_blank" rel="noreferrer">
                          {report.pp_file_name}
                        </a>
                        <span className={`status ${report.pp_approved}`}>
                          {report.pp_approved === 'approved' && '✅ Được phê duyệt'}
                          {report.pp_approved === 'pending' && '⏳ Chờ duyệt'}
                          {report.pp_approved === 'rejected' && '❌ Bị từ chối'}
                        </span>
                      </div>
                    )}
                  </div>

                  {report.approval_notes && (
                    <div className="approval-notes">
                      <strong>Ghi chú:</strong> {report.approval_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
