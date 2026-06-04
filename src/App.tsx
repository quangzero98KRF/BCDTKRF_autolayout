import React, { useState } from 'react';
import ConnectionsPanel from './components/ConnectionsPanel';
import SchemaExplorerPanel from './components/SchemaExplorerPanel';
import DashboardListPanel from './components/DashboardListPanel';
import DashboardDesignerPanel from './components/DashboardDesignerPanel';
import DashboardViewerPanel from './components/DashboardViewerPanel';
import { 
  Database, 
  Layers, 
  FolderTree, 
  Layout, 
  Eye, 
  User, 
  Terminal, 
  Cpu, 
  Compass,
  FileCode,
  Link2,
  HelpCircle
} from 'lucide-react';

type TabId = 'dashboards' | 'designer' | 'viewer' | 'connections' | 'schema';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboards');
  const [activeConnectionId, setActiveConnectionId] = useState<string>('conn-1780411541672');
  const [activeDashboardId, setActiveDashboardId] = useState<string>('dash-1');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefreshTrigger = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditDashboard = (id: string) => {
    setActiveDashboardId(id);
    setActiveTab('designer');
  };

  const handleViewDashboard = (id: string) => {
    setActiveDashboardId(id);
    setActiveTab('viewer');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* 1. PRIMARY SYSTEM HEADER CHASSIS */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-display font-black tracking-tight select-none">
              BI
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-tight text-white block">
                Google Cloud BI
              </span>
              <span className="text-[9px] text-indigo-300 uppercase tracking-widest block font-mono font-bold">
                Bảng thông tin trực quan
              </span>
            </div>
          </div>

          {/* Quick status signals */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-slate-400 font-semibold">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span>ĐỘNG CƠ SCHEMA HOẠT ĐỘNG</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>CỔNG KẾT NỐI: 3000</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>quangzero98@gmail.com</span>
            </div>
          </div>
        </div>

        {/* 2. TAB CONTROL SYSTEM RAILS */}
        <div className="bg-slate-950 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <nav className="flex items-center space-x-1 overflow-x-auto select-none gap-0.5">
              <button
                id="tab-dashboards"
                onClick={() => setActiveTab('dashboards')}
                className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboards' 
                    ? 'border-indigo-500 text-white font-bold bg-slate-900/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                Danh Sách Dashboards
              </button>

              <button
                id="tab-connections"
                onClick={() => setActiveTab('connections')}
                className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'connections' 
                    ? 'border-indigo-500 text-white font-bold bg-slate-900/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                Kết Nối Cơ Sở Dữ Liệu
              </button>

              <button
                id="tab-schema"
                onClick={() => setActiveTab('schema')}
                className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'schema' 
                    ? 'border-indigo-500 text-white font-bold bg-slate-900/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                }`}
              >
                <FolderTree className="w-4 h-4 shrink-0" />
                Cây Sơ Đồ Cấu Trúc (Schema)
              </button>

              <button
                id="tab-designer"
                onClick={() => setActiveTab('designer')}
                className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'designer' 
                    ? 'border-indigo-500 text-white font-bold bg-slate-900/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                }`}
              >
                <Layout className="w-4 h-4 shrink-0" />
                Thiết Kế Giao Diện (Designer)
              </button>

              <button
                id="tab-viewer"
                onClick={() => setActiveTab('viewer')}
                className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'viewer' 
                    ? 'border-indigo-500 text-white font-bold bg-slate-900/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                Giao Diện Báo Cáo Thực Tế (BI Viewer)
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE VIEW ROUTER CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        {activeTab === 'dashboards' && (
          <DashboardListPanel 
            onEditDashboardRequested={handleEditDashboard}
            onViewDashboardRequested={handleViewDashboard}
            onRefreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsPanel 
            onSchemaSyncCompleted={handleRefreshTrigger}
            activeConnectionId={activeConnectionId}
            setActiveConnectionId={setActiveConnectionId}
          />
        )}

        {activeTab === 'schema' && (
          <SchemaExplorerPanel 
            activeConnectionId={activeConnectionId}
            onRefreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'designer' && (
          <DashboardDesignerPanel 
            activeDashboardId={activeDashboardId}
            onPreviewRequested={() => handleViewDashboard(activeDashboardId)}
          />
        )}

        {activeTab === 'viewer' && (
          <DashboardViewerPanel 
            dashboardId={activeDashboardId}
          />
        )}
      </main>

      {/* 4. DESIGN CREDITS FOOTER SYSTEM */}
      <footer className="border-t border-slate-200/60 bg-white py-6 mt-12 text-center text-slate-400 text-xs font-semibold font-mono leading-relaxed select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-slate-500 align-middle">
            <Compass className="w-4.5 h-4.5 text-indigo-500" />
            <span>Google Cloud BI Dashboard Engine • Kiến Trúc Siêu Dữ Liệu Tự Động</span>
          </div>
          <div>
            <span>Môi trường: Node.js 22 • React 19 • Tailwind CSS v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
