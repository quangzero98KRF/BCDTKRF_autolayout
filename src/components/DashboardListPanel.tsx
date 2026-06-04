import React, { useState, useEffect } from 'react';
import { 
  Dashboard, 
  DatabaseConnection 
} from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Copy, 
  UploadCloud, 
  FileText, 
  FolderOpen, 
  Database, 
  User, 
  Calendar, 
  Layers, 
  CheckCircle, 
  RefreshCw,
  Search,
  Sliders
} from 'lucide-react';

interface DashboardListPanelProps {
  onEditDashboardRequested: (dashboardId: string) => void;
  onViewDashboardRequested: (dashboardId: string) => void;
  onRefreshTrigger?: number;
}

export default function DashboardListPanel({ onEditDashboardRequested, onViewDashboardRequested, onRefreshTrigger }: DashboardListPanelProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dashName, setDashName] = useState('');
  const [dashDesc, setDashDesc] = useState('');
  const [selectedConnId, setSelectedConnId] = useState('');

  useEffect(() => {
    fetchDashboardList();
  }, [onRefreshTrigger]);

  const fetchDashboardList = async () => {
    setLoading(true);
    try {
      const [dashRes, connRes] = await Promise.all([
        fetch('/api/dashboards'),
        fetch('/api/connections')
      ]);

      if (dashRes.ok && connRes.ok) {
        setDashboards(await dashRes.json());
        const conns = await connRes.json();
        setConnections(conns);
        if (conns.length > 0) {
          setSelectedConnId(conns[0].connectionId);
        }
      }
    } catch (err) {
      console.error('Lỗi truy cập danh mục dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashName.trim()) {
      alert('Vui lòng nhập tên dashboard hợp lệ.');
      return;
    }

    try {
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardName: dashName,
          description: dashDesc,
          connectionId: selectedConnId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setDashName('');
        setDashDesc('');
        fetchDashboardList();
        
        // Immediately trigger designer focus
        onEditDashboardRequested(data.dashboardId);
      } else {
        alert('Không thể tạo cấu hình dashboard mới trên hệ thống');
      }
    } catch {
      alert('Lỗi kết nối với API khởi tạo dashboard');
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Dashboard BI này? Toàn bộ thiết kế bố cục, widgets và lịch sử phiên bản sẽ bị xóa vĩnh viễn.')) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardList();
      } else {
        alert('Xóa dashboard thất bại');
      }
    } catch {
      alert('Lỗi liên lạc mạng khi cố gắng xóa dashboard');
    }
  };

  const handleCloneDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboards/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        alert('Đã nhân bản thành công bố cục và toàn bộ tọa độ widgets.');
        fetchDashboardList();
      } else {
         alert('Nhân bản dashboard thất bại.');
      }
    } catch {
      alert('Dịch vụ API không phản hồi yêu cầu nhân bản');
    }
  };

  const handlePublishDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboards/${id}/publish`, { method: 'POST' });
      if (res.ok) {
        alert('Dashboard đã được chuyển sang chế độ [Đã phát hành]. Bạn có thể xem trực tiếp tại Cổng báo cáo.');
        fetchDashboardList();
      } else {
        alert('Cập nhật trạng thái phát hành thất bại');
      }
    } catch {
      alert('Lỗi máy chủ khi cập nhật trạng thái phát hành');
    }
  };

  const filteredDashboards = dashboards.filter(d => 
    d.dashboardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="dashboard-management-section" className="space-y-6 animate-fade-in">
      
      {/* Upper header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-indigo-600" />
            Trình Quản lý Dashboard BI
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Xây dựng các biểu đồ KPI báo cáo doanh thu trực quan, đồng bộ hóa bảng biểu, quản lý các bản nháp và phiên bản phát hành từ các nguồn dữ liệu Cloud SQL.
          </p>
        </div>

        <button 
          id="btn-create-dashboard-modal"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-100 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo Dashboard Mới
        </button>
      </div>

      {/* Database Quick Stats Row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-slate-100/40 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Tổng Dashboard</span>
            <strong className="text-lg font-bold text-slate-800">{dashboards.length} cấu hình</strong>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Đã phát hành</span>
            <strong className="text-lg font-bold text-slate-800">
              {dashboards.filter(d => d.status === 'Published').length} hoạt động
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Bản thiết kế nháp</span>
            <strong className="text-lg font-bold text-slate-800">
              {dashboards.filter(d => d.status === 'Draft').length} đang sửa
            </strong>
          </div>
        </div>
      </div>

      {/* Main List & Grid Search Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/55 p-6 space-y-6">
        
        {/* Search controls */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            id="search-dashboards"
            type="text"
            placeholder="Tìm kiếm dashboard bằng từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Đang tải danh mục máy chủ...</p>
          </div>
        ) : filteredDashboards.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">Không tìm thấy Dashboard nào phù hợp</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Vui lòng tinh chỉnh từ khóa tìm kiếm hoặc khởi tạo một báo cáo doanh thu mới.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all mt-2 cursor-pointer"
            >
              Thiết lập Dashboard đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên bảng báo cáo Dashboard</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ sở dữ liệu liên kết</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kỹ sư khởi tạo</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày cấu hình</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Lệnh Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDashboards.map((d) => {
                  const connName = connections.find(c => c.connectionId === d.connectionId)?.connectionName || 'MySQL Link';
                  
                  return (
                    <tr key={d.dashboardId} id={`dashboard-row-${d.dashboardId}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5 animate-pulse">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span 
                              className="font-display font-semibold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer block"
                              onClick={() => onViewDashboardRequested(d.dashboardId)}
                            >
                              {d.dashboardName}
                            </span>
                            <span className="text-xs text-slate-400 block max-w-xs truncate">{d.description || 'Xem tổng quan chỉ số và tối ưu hóa doanh số.'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          <span>{connName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.createdBy}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(d.createdDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                          d.status === 'Published'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {d.status === 'Published' ? 'Đã phát hành' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 justify-items-end">
                          {/* Viewer button */}
                          <button
                            title="Mở cổng xem Biểu đồ"
                            id={`btn-view-${d.dashboardId}`}
                            onClick={() => onViewDashboardRequested(d.dashboardId)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current text-[8px]" />
                          </button>

                          {/* Editor Studio button */}
                          <button
                            title="Mở bảng vẽ Thiết kế (Canvas)"
                            id={`btn-edit-${d.dashboardId}`}
                            onClick={() => onEditDashboardRequested(d.dashboardId)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Clone Button */}
                          <button
                            title="Sao chép bảng Dashboard"
                            id={`btn-clone-${d.dashboardId}`}
                            onClick={() => handleCloneDashboard(d.dashboardId)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-400 hover:text-slate-750 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Publish toggle button */}
                          {d.status === 'Draft' && (
                            <button
                              title="Phát hành ngay lên Portal"
                              id={`btn-publish-${d.dashboardId}`}
                              onClick={() => handlePublishDashboard(d.dashboardId)}
                              className="p-1.5 rounded-lg border border-green-100 hover:border-green-200 bg-green-50 hover:bg-green-100 text-green-500 hover:text-green-700 transition-all cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            title="Xóa vĩnh viễn bảng"
                            id={`btn-delete-${d.dashboardId}`}
                            onClick={() => handleDeleteDashboard(d.dashboardId)}
                            className="p-1.5 rounded-lg border border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL DIALOG popup */}
      {showCreateModal && (
        <div id="create-dashboard-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 p-6 shadow-xl animate-scale-up space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-semibold text-slate-800 text-base">Cấu hình Tọa độ Bảng vẽ Dashboard Mới</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs border border-slate-200 rounded px-2 py-0.5 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateDashboardSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tiêu đề Dashboard *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Báo cáo Doanh thu fi_final_bcdt"
                  value={dashName}
                  onChange={(e) => setDashName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mô tả mục đích báo cáo</label>
                <textarea 
                  rows={2}
                  placeholder="Ví dụ: Theo dõi doanh thu thực tế từ bảng fi_final_bcdt của cơ sở dữ liệu KRF..."
                  value={dashDesc}
                  onChange={(e) => setDashDesc(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Chọn liên kết cơ sở dữ liệu nguồn *</label>
                {connections.length === 0 ? (
                  <div className="text-red-500 text-[10px] font-bold bg-red-50 p-2.5 rounded-lg border border-red-100 uppercase tracking-wide">
                    Điều kiện tiên quyết: Hãy cấu hình một kết nối database trước trong tab Đăng ký!
                  </div>
                ) : (
                  <select
                    value={selectedConnId}
                    onChange={(e) => setSelectedConnId(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-white cursor-pointer"
                  >
                    {connections.map((c) => (
                      <option key={c.connectionId} value={c.connectionId}>{c.connectionName} ({c.databaseType})</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={connections.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs tracking-wide shadow-sm shadow-indigo-100 transition-all cursor-pointer"
              >
                Khởi tạo bảng vẽ thiết kế
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
