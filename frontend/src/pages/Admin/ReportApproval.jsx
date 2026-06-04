import { message } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import './ReportApproval.css';

export default function ReportApproval() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAllReports();
  }, []);

  useEffect(() => {
    filterReportsByStatus();
  }, [reports, filterStatus]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Lỗi lấy báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReportsByStatus = () => {
    let filtered = reports;

    if (filterStatus === 'pending') {
      filtered = filtered.filter(r => r.work_approved === 'pending' || r.pp_approved === 'pending');
    } else if (filterStatus === 'approved') {
      filtered = filtered.filter(r => r.work_approved === 'approved' || r.pp_approved === 'approved');
    }

    setFilteredReports(filtered);
  };

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) {
      message.warning('Không có file để tải!');
      return;
    }
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
    const safeFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    window.open(`${backendUrl}${safeFileUrl}`, '_blank');
  };

  const handleApprove = async (reportId, fileType, status) => {
    try {
      const approveData = {
        [fileType === 'work' ? 'work_status' : 'pp_status']: status,
        ...(notes && { notes })
      };

      await api.patch(`/reports/${reportId}/approve`, approveData);

      alert(`✅ Báo cáo ${fileType} đã ${status === 'approved' ? 'được phê duyệt' : 'bị từ chối'}!`);
      setNotes('');
      setSelectedReport(null);
      fetchAllReports();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.message || 'Lỗi phê duyệt'));
    }
  };

  if (loading) {
    return <div className="loading">⏳ Đang tải báo cáo...</div>;
  }

  return (
    <div className="report-approval-container">
      <h1>📋 Phê Duyệt Báo Cáo Sinh Viên</h1>

      <div className="filters">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="pending">⏳ Chờ Phê Duyệt</option>
          <option value="approved">✅ Đã Phê Duyệt</option>
          <option value="all">Tất Cả</option>
        </select>
        <span className="count">Tổng: {filteredReports.length} báo cáo</span>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports">
          <p>📭 Không có báo cáo nào</p>
        </div>
      ) : (
        <div className="reports-table">
          {filteredReports.map(report => (
            <div key={report.id} className="report-row">
              <div className="report-info">
                <h3>{report.student_name}</h3>
                <p className="email">{report.student_email}</p>
                <p className="topic"><strong>Đề tài:</strong> {report.topic_title}</p>
                <p className="date">Nộp: {new Date(report.submitted_at).toLocaleDateString('vi-VN')}</p>
              </div>

              <div className="report-files">
                {report.work_file_url && (
                  <div className={`file-item ${report.work_approved}`}>
                    <div className="file-info">
                      <p><strong>📄 Work:</strong></p>
                      <button 
                        type="button" 
                        onClick={() => handleDownload(report.work_file_url, report.work_file_name || 'Bao_Cao_Work')}
                        style={{ background: 'none', border: 'none', color: '#1890ff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit', textAlign: 'left' }}
                      >
                        {report.work_file_name}
                      </button>
                      <span className={`status ${report.work_approved}`}>
                        {report.work_approved === 'pending' && '⏳ Chờ duyệt'}
                        {report.work_approved === 'approved' && '✅ Được phê duyệt'}
                        {report.work_approved === 'rejected' && '❌ Bị từ chối'}
                      </span>
                    </div>
                    {report.work_approved === 'pending' && (
                      <div className="actions">
                        <button 
                          className="btn btn-approve"
                          onClick={() => {
                            setSelectedReport({ id: report.id, fileType: 'work' });
                          }}
                        >
                          ✅ Phê Duyệt
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => handleApprove(report.id, 'work', 'rejected')}
                        >
                          ❌ Từ Chối
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {report.pp_file_url && (
                  <div className={`file-item ${report.pp_approved}`}>
                    <div className="file-info">
                      <p><strong>📊 PP:</strong></p>
                      <button 
                        type="button" 
                        onClick={() => handleDownload(report.pp_file_url, report.pp_file_name || 'Slide_Trinh_Chieu')}
                        style={{ background: 'none', border: 'none', color: '#1890ff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit', textAlign: 'left' }}
                      >
                        {report.pp_file_name}
                      </button>
                      <span className={`status ${report.pp_approved}`}>
                        {report.pp_approved === 'pending' && '⏳ Chờ duyệt'}
                        {report.pp_approved === 'approved' && '✅ Được phê duyệt'}
                        {report.pp_approved === 'rejected' && '❌ Bị từ chối'}
                      </span>
                    </div>
                    {report.pp_approved === 'pending' && (
                      <div className="actions">
                        <button 
                          className="btn btn-approve"
                          onClick={() => {
                            setSelectedReport({ id: report.id, fileType: 'pp' });
                          }}
                        >
                          ✅ Phê Duyệt
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => handleApprove(report.id, 'pp', 'rejected')}
                        >
                          ❌ Từ Chối
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Thêm Ghi Chú (Tùy Chọn)</h3>
            <textarea
              placeholder="Nhập ghi chú, lý do phê duyệt hoặc yêu cầu sửa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-textarea"
            />
            <div className="modal-actions">
              <button 
                className="btn btn-approve"
                onClick={() => {
                  handleApprove(selectedReport.id, selectedReport.fileType, 'approved');
                }}
              >
                ✅ Phê Duyệt
              </button>
              <button 
                className="btn btn-reject"
                onClick={() => {
                  handleApprove(selectedReport.id, selectedReport.fileType, 'rejected');
                }}
              >
                ❌ Từ Chối
              </button>
              <button 
                className="btn btn-cancel"
                onClick={() => {
                  setSelectedReport(null);
                  setNotes('');
                }}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
