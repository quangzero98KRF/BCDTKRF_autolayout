import React, { useState, useEffect } from 'react';
import { 
  DatabaseConnection, 
  DatabaseType 
} from '../types';
import { 
  Database, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Layers, 
  Server, 
  FileJson, 
  Edit3, 
  Play 
} from 'lucide-react';

interface ConnectionsPanelProps {
  onSchemaSyncCompleted?: () => void;
  activeConnectionId?: string;
  setActiveConnectionId?: (id: string) => void;
}

export default function ConnectionsPanel({ onSchemaSyncCompleted, activeConnectionId, setActiveConnectionId }: ConnectionsPanelProps) {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connName, setConnName] = useState('');
  const [desc, setDesc] = useState('');
  const [dbType, setDbType] = useState<DatabaseType>('PostgreSQL');
  
  // Relational SQL fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState<string>('5432');
  const [dbName, setDbName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // BigQuery fields
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  // Action status indicators
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean, status?: string, msg?: string }>>({});
  const [syncStatus, setSyncStatus] = useState<Record<string, { loading: boolean, success?: boolean, timestamp?: string }>>({});

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
        if (data.length > 0 && setActiveConnectionId && !activeConnectionId) {
          setActiveConnectionId(data[0].connectionId);
        }
      } else {
        setErrorMessage('Không thể tải danh sách kết nối cơ sở dữ liệu');
      }
    } catch {
      setErrorMessage('Lỗi giao tiếp mạng với dịch vụ backend');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setConnName('');
    setDesc('');
    setDbType('PostgreSQL');
    setHost('');
    setPort('5432');
    setDbName('');
    setUsername('');
    setPassword('');
    setProjectId('');
    setDataset('');
    setServiceAccountJson('');
  };

  // Pre-fill form when editing
  const handleEditClick = (conn: DatabaseConnection) => {
    setIsEditing(true);
    setEditingId(conn.connectionId);
    setConnName(conn.connectionName);
    setDesc(conn.description);
    setDbType(conn.databaseType);
    setHost(conn.host || '');
    setPort(conn.port ? String(conn.port) : '');
    setDbName(conn.databaseName || '');
    setUsername(conn.username || '');
    setPassword(conn.password || '');
    setProjectId(conn.projectId || '');
    setDataset(conn.dataset || '');
    setServiceAccountJson(conn.serviceAccountFile || '');
  };

  const handleDbTypeChange = (type: DatabaseType) => {
    setDbType(type);
    if (type === 'PostgreSQL') setPort('5432');
    else if (type === 'MySQL') setPort('3306');
    else setPort('');
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connName.trim()) {
      alert('Vui lòng nhập tên kết nối.');
      return;
    }

    const payload: Partial<DatabaseConnection> = {
      connectionName: connName,
      description: desc,
      databaseType: dbType,
      host: dbType !== 'BigQuery' ? host : undefined,
      port: dbType !== 'BigQuery' ? Number(port) || undefined : undefined,
      databaseName: dbType !== 'BigQuery' ? dbName : undefined,
      username: dbType !== 'BigQuery' ? username : undefined,
      password: dbType !== 'BigQuery' ? password : undefined,
      projectId: dbType === 'BigQuery' ? projectId : undefined,
      dataset: dbType === 'BigQuery' ? dataset : undefined,
      serviceAccountFile: dbType === 'BigQuery' ? serviceAccountJson : undefined
    };

    try {
      const url = editingId ? `/api/connections/${editingId}` : '/api/connections';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        // Immediately sync schema for new connection to prevent blank state
        if (!editingId) {
          await fetch(`/api/connections/${saved.connectionId}/sync-schema`, { method: 'POST' });
        }
        resetForm();
        fetchConnections();
        if (onSchemaSyncCompleted) onSchemaSyncCompleted();
      } else {
        alert('Không thể lưu thông tin kết nối cơ sở dữ liệu');
      }
    } catch {
      alert('Lỗi khi cập nhật cấu hình kết nối');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kết nối cơ sở dữ liệu này? Hành động này cũng sẽ xóa toàn bộ cây sơ đồ schema đã phát hiện.')) {
      return;
    }

    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchConnections();
        if (onSchemaSyncCompleted) onSchemaSyncCompleted();
      } else {
        const data = await res.json();
        alert(data.error || 'Xóa kết nối thất bại');
      }
    } catch {
      alert('Lỗi mạng khi xóa kết nối');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestStatus(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const res = await fetch(`/api/connections/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestStatus(prev => ({ 
          ...prev, 
          [id]: { loading: false, status: 'Thành công', msg: data.message } 
        }));
      } else {
        setTestStatus(prev => ({ 
          ...prev, 
          [id]: { loading: false, status: 'Thất bại', msg: data.message || data.error } 
        }));
      }
    } catch {
      setTestStatus(prev => ({ 
        ...prev, 
        [id]: { loading: false, status: 'Thất bại', msg: 'Không thể kết nối với máy chủ API kiểm tra' } 
      }));
    }
  };

  const handleSyncSchema = async (id: string) => {
    setSyncStatus(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const res = await fetch(`/api/connections/${id}/sync-schema`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(prev => ({ 
          ...prev, 
          [id]: { loading: false, success: true, timestamp: new Date(data.timestamp).toLocaleTimeString() } 
        }));
        if (onSchemaSyncCompleted) onSchemaSyncCompleted();
      } else {
        setSyncStatus(prev => ({ ...prev, [id]: { loading: false, success: false } }));
        alert('Đồng bộ hoá schema thất bại. Vui lòng kiểm tra lại cấu hình.');
      }
    } catch {
      setSyncStatus(prev => ({ ...prev, [id]: { loading: false, success: false } }));
      alert('Lỗi khi gọi API đồng bộ dữ liệu schema.');
    }
  };

  const handleServiceAccountUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setServiceAccountJson(file.name);
      alert(`Đã nhận diện tệp khóa dịch vụ: "${file.name}" tải lên thành công.`);
    }
  };

  const getDBLogoColor = (type: DatabaseType) => {
    switch (type) {
      case 'BigQuery': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MySQL': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'PostgreSQL': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
  };

  return (
    <div id="connections-section" className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-600" />
            Cấu hình Kết nối Cơ sở Dữ liệu
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Thiết lập kết nối an toàn đến Google Cloud SQL (PostgreSQL/MySQL) hoặc Google BigQuery để tự động đồng bộ hóa cấu trúc bảng schema.
          </p>
        </div>
        
        {!isEditing && (
          <button 
            id="btn-add-connection"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm shadow-indigo-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm kết nối mới
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex items-start gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Grid: Editor Panel + Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Module Form (Shown when Adding/Editing) */}
        {isEditing && (
          <div id="connection-editor-card" className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-slate-100/50 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display font-semibold text-slate-800 text-base">
                {editingId ? 'Chỉnh sửa kết nối' : 'Tạo kết nối mới'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              {/* General details */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tên kết nối *</label>
                <input 
                  id="input-conn-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Connection KRF Postgres"
                  value={connName}
                  onChange={(e) => setConnName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-medium">Mô tả chi tiết</label>
                <textarea 
                  id="input-conn-desc"
                  rows={2}
                  placeholder="Nhập ghi chú hoặc phạm vi dữ liệu..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Loại cơ sở dữ liệu (Engine)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PostgreSQL', 'MySQL', 'BigQuery'] as DatabaseType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      id={`db-type-selector-${type}`}
                      onClick={() => handleDbTypeChange(type)}
                      className={`py-2 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
                        dbType === type 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Connection Settings Inputs */}
              {dbType !== 'BigQuery' ? (
                // PostgreSQL / MySQL
                <div id="relational-fields" className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">Cài đặt kết nối SQL</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Máy chủ Host IP *</label>
                      <input 
                        type="text"
                        required
                        placeholder="34.143.138.57"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Cổng Port *</label>
                      <input 
                        type="number"
                        required
                        placeholder="5432"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Tên Tệp Database *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. krf"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Tài khoản *</label>
                      <input 
                        type="text"
                        required
                        placeholder="postgres"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Mật khẩu</label>
                      <input 
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Google BigQuery
                <div id="bigquery-fields" className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-orange-600 tracking-wider uppercase">Cấu hình Google BigQuery</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Project ID *</label>
                    <input 
                      type="text"
                      required
                      placeholder="google-cloud-project-id"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Dataset Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="ecommerce_retail_cube"
                      value={dataset}
                      onChange={(e) => setDataset(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Khóa tài khoản dịch vụ (JSON Key File)</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 text-center flex flex-col items-center justify-center cursor-pointer relative">
                      <FileJson className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-[11px] text-slate-600 font-medium">Nhấp để chọn tệp Service Account</span>
                      {serviceAccountJson ? (
                        <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-mono mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {serviceAccountJson}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-440 mt-1">Hỗ trợ tệp định dạng .json</span>
                      )}
                      <input 
                        type="file"
                        accept=".json"
                        onChange={handleServiceAccountUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 justify-end">
                <button
                  type="submit"
                  id="btn-connection-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  {editingId ? 'Cập nhật & Đồng bộ' : 'Lưu kết nối'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connection list (Takes 2/3 columns or full width if form is closed) */}
        <div className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-slate-100/50 ${isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              Sổ Đăng ký Kết nối đang hoạt động
            </h3>
            <span className="text-xs text-slate-400 font-mono font-medium">
              Số kết nối được cấu hình : {connections.length}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang truy vấn dữ liệu dịch vụ platform...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">Chưa có kết nối Database nào được đăng ký</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Thêm kết nối tới Postgres, MySQL, hoặc BigQuery của bạn. Trình quét tự động của hệ thống sẽ lập tức ánh xạ cấu trúc bảng schema của bạn.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all mt-2 cursor-pointer"
              >
                Đăng ký kết nối đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ sở dữ liệu</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Loại</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Máy chủ / Thư mục</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Lệnh Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {connections.map((c) => (
                    <tr 
                      key={c.connectionId} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        activeConnectionId === c.connectionId ? 'bg-indigo-50/10' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 border rounded-xl shrink-0 ${getDBLogoColor(c.databaseType)}`}>
                            <Database className="w-4 h-4" />
                          </div>
                          <div>
                            <span 
                              className="font-display font-semibold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer block"
                              onClick={() => {
                                if (setActiveConnectionId) {
                                  setActiveConnectionId(c.connectionId);
                                }
                              }}
                            >
                              {c.connectionName}
                            </span>
                            <span className="text-xs text-slate-400 block max-w-xs truncate">{c.description || 'Không có mô tả bổ sung.'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600 font-mono">
                        {c.databaseType}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">
                        {c.databaseType === 'BigQuery' 
                          ? `${c.projectId || 'N/A'}.${c.dataset}` 
                          : `${c.host || '127.0.0.1'}:${c.port || 5432}/${c.databaseName}`
                        }
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {testStatus[c.connectionId]?.status ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              testStatus[c.connectionId].status === 'Thành công' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              ONLINE (ĐÃ THỬ KHỚP)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                              KẾT NỐI SẴN SÀNG
                            </span>
                          )}
                          <span className="text-[9px] text-slate-405 font-mono">
                            {syncStatus[c.connectionId]?.timestamp 
                              ? `Đồng bộ: ${syncStatus[c.connectionId].timestamp}` 
                              : `Tạo: ${new Date(c.createdDate).toLocaleDateString('vi-VN')}`
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 justify-items-end">
                          {/* Test Link Button */}
                          <button
                            title="Kiểm tra kết kết nối (Handshake Check)"
                            id={`btn-test-${c.connectionId}`}
                            onClick={() => handleTestConnection(c.connectionId)}
                            disabled={testStatus[c.connectionId]?.loading}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-400 hover:text-slate-750 transition-all cursor-pointer"
                          >
                            {testStatus[c.connectionId]?.loading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Sync Schema button */}
                          <button
                            title="Đồng bộ cấu trúc bảng và cột (Schemas Sync)"
                            id={`btn-sync-${c.connectionId}`}
                            onClick={() => handleSyncSchema(c.connectionId)}
                            disabled={syncStatus[c.connectionId]?.loading}
                            className="p-1.5 rounded-lg border border-indigo-100 hover:border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-all cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus[c.connectionId]?.loading ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Edit button */}
                          <button
                            title="Chỉnh sửa cấu hình"
                            id={`btn-edit-${c.connectionId}`}
                            onClick={() => handleEditClick(c)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            title="Xóa nối liên kết"
                            id={`btn-delete-${c.connectionId}`}
                            onClick={() => handleDeleteConnection(c.connectionId)}
                            className="p-1.5 rounded-lg border border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Collapsible Test Status Report Block */}
              {Object.keys(testStatus).some(k => testStatus[k].msg) && (
                <div id="test-handshake-log" className="mt-6 border border-slate-100 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <Terminal className="w-3.5 h-3.5" />
                    Báo cáo chuẩn đoán kết nối (Log)
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {Object.keys(testStatus).map(id => {
                      const status = testStatus[id];
                      const name = connections.find(c => c.connectionId === id)?.connectionName || id;
                      if (!status.msg) return null;
                      return (
                        <div key={id} className="text-xs font-mono flex items-start gap-1">
                          <span className={status.status === 'Thành công' ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                            [{status.status || 'LOG'}]
                          </span>
                          <span className="text-slate-600 font-semibold">{name}:</span>
                          <span className="text-slate-500">{status.msg}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
