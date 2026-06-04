import React, { useState, useEffect } from 'react';
import { 
  DatabaseConnection, 
  SchemaTable, 
  SchemaColumn, 
  SchemaRelationship, 
  Dashboard, 
  DashboardWidget, 
  WidgetType, 
  WidgetConfig 
} from '../types';
import { 
  Layout, 
  Plus, 
  Compass, 
  Trash2, 
  Save, 
  Maximize2, 
  Sliders, 
  Database, 
  Settings, 
  Move, 
  TrendingUp, 
  BarChart3, 
  Table2, 
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';

interface DashboardDesignerPanelProps {
  activeDashboardId: string;
  onPreviewRequested?: () => void;
}

export default function DashboardDesignerPanel({ activeDashboardId, onPreviewRequested }: DashboardDesignerPanelProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  
  // Schema catalog
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [columns, setColumns] = useState<SchemaColumn[]>([]);
  const [relationships, setRelationships] = useState<SchemaRelationship[]>([]);
  const [activeTableIdx, setActiveTableIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Selected configuration focus
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<{ table: string, column: string, type: string } | null>(null);

  useEffect(() => {
    fetchDesignerData();
  }, [activeDashboardId]);

  const fetchDesignerData = async () => {
    setLoading(true);
    try {
      // First, obtain connections
      const connRes = await fetch('/api/connections');
      const connData = await connRes.json();
      setConnections(connData);

      // Now query current dashboard layout
      const res = await fetch(`/api/dashboard/${activeDashboardId}/layout`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data.dashboard);
        setWidgets(data.widgets || []);

        // Load tables relevant to the dashboard's active connection
        const connId = data.dashboard.connectionId;
        const [tablesRes, columnsRes, relsRes] = await Promise.all([
          fetch(`/api/schema/tables?connectionId=${connId}`),
          fetch('/api/schema/columns'),
          fetch('/api/schema/relationships')
        ]);

        if (tablesRes.ok && columnsRes.ok && relsRes.ok) {
          const tData = await tablesRes.json();
          setTables(tData);
          setColumns(await columnsRes.json());
          setRelationships(await relsRes.json());
        }
      }
    } catch (err) {
      console.error('Lỗi khởi tạo màn hình thiết kế:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWidget = (type: WidgetType) => {
    const tableSource = tables[activeTableIdx]?.tableName || 'fi_final_bcdt';
    
    // Choose sensible default columns based on available structures
    const availableCols = columns
      .filter(c => c.tableId === tables[activeTableIdx]?.tableId)
      .map(c => c.columnName);

    const defaultMeasure = availableCols.find(c => [
      'doanh_thu_thuan', 'loi_nhuan', 'doanh_thu', 'so_luong', 'don_gia', 'gia_von',
      'thanhtien', 'doanhthu', 'soluong', 'thucso', 'gia', 'TotalAmount', 'Budget'
    ].includes(c)) || availableCols.find(c => c !== 'id') || availableCols[0] || 'id';

    const defaultDimension = availableCols.find(c => [
      'khu_vuc', 'trang_thai', 'nhom_san_pham', 'san_pham', 'ngay', 'nhan_vien', 'khach_hang',
      'nguonden', 'kenh', 'tructhuoc', 'nhanvien', 'ngay_xuat_bc', 'Sellers', 'Region', 'Category'
    ].includes(c)) || availableCols.find(c => c !== 'id') || availableCols[0] || 'id';

    const newWidgetId = `w-${Date.now()}`;
    const newWidget: DashboardWidget = {
      widgetId: newWidgetId,
      dashboardId: activeDashboardId,
      widgetType: type,
      positionX: (widgets.length * 4) % 12,
      positionY: Math.floor((widgets.length * 4) / 12) * 3,
      width: type === 'Table' ? 12 : type === 'Filter' ? 4 : 4,
      height: type === 'Table' ? 5 : type === 'Filter' ? 1.5 : 3.5,
      config: {
        title: `Chỉ số: ${tableSource}`,
        datasetTable: tableSource,
        measureColumn: defaultMeasure,
        aggregation: 'SUM',
        dimensionColumn: defaultDimension,
        chartColor: type.includes('Pie') ? '#f59e0b' : type.includes('Line') ? '#10b981' : '#3b82f6',
        sortOrder: 'DESC',
        tableColumns: availableCols.length > 0 
          ? availableCols.slice(0, 7) 
          : ['id', 'ngay', 'khach_hang', 'san_pham', 'doanh_thu_thuan', 'trang_thai'],
        pageSize: 10,
        filterType: 'Dropdown',
        filterColumn: defaultDimension
      }
    };

    // Override names and titles for type matching
    if (type.startsWith('Chart_')) {
      newWidget.config.title = `Biểu đồ phân loại theo ${defaultDimension}`;
    } else if (type === 'Table') {
      newWidget.config.title = `Bảng danh sách chi tiết: ${tableSource}`;
    } else if (type === 'Filter') {
      newWidget.config.title = `Bộ lọc: ${defaultDimension}`;
    }

    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidgetId(newWidgetId);
  };

  const handleRemoveWidget = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWidgets(prev => prev.filter(w => w.widgetId !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const handleUpdateWidgetConfig = (widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(w => {
      if (w.widgetId === widgetId) {
        return {
          ...w,
          config: {
            ...w.config,
            ...updates
          }
        };
      }
      return w;
    }));
  };

  const handleUpdateWidgetSize = (widgetId: string, updates: { positionX?: number, positionY?: number, width?: number, height?: number }) => {
    setWidgets(prev => prev.map(w => {
      if (w.widgetId === widgetId) {
        return {
          ...w,
          ...updates
        };
      }
      return w;
    }));
  };

  const handleSaveLayout = async () => {
    if (!dashboard) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboards/${activeDashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dashboard,
          widgets 
        })
      });

      if (res.ok) {
        alert('Đã lưu thành công tọa độ widget và dữ liệu cấu hình Dashboard.');
        fetchDesignerData();
      } else {
        alert('Không thể lưu cấu hình Dashboard');
      }
    } catch {
      alert('Lỗi kết nối với máy chủ khi lưu thiết kế');
    } finally {
      setSaving(false);
    }
  };

  // HTML5 Drag handlers for dragging columns to components
  const handleDragStart = (e: React.DragEvent, table: string, column: string, type: string) => {
    setDraggedColumn({ table, column, type });
    e.dataTransfer.setData('text/plain', JSON.stringify({ table, column, type }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnWidget = (e: React.DragEvent, widget: DashboardWidget) => {
    e.preventDefault();
    try {
      const dragDataStr = e.dataTransfer.getData('text/plain');
      let dragData = draggedColumn;
      if (!dragData && dragDataStr) {
        dragData = JSON.parse(dragDataStr);
      }

      if (!dragData) return;

      // Assign dragged column dynamically according to component capability
      if (widget.widgetType === 'KPI') {
        handleUpdateWidgetConfig(widget.widgetId, {
          datasetTable: dragData.table,
          measureColumn: dragData.column
        });
      } else if (widget.widgetType.startsWith('Chart_')) {
        const isNumeric = ['DECIMAL', 'INTEGER', 'NUMERIC', 'DOUBLE', 'FLOAT'].includes(dragData.type.toUpperCase());
        if (isNumeric) {
          handleUpdateWidgetConfig(widget.widgetId, {
            datasetTable: dragData.table,
            measureColumn: dragData.column
          });
        } else {
          handleUpdateWidgetConfig(widget.widgetId, {
            datasetTable: dragData.table,
            dimensionColumn: dragData.column
          });
        }
      } else if (widget.widgetType === 'Filter') {
        handleUpdateWidgetConfig(widget.widgetId, {
          datasetTable: dragData.table,
          filterColumn: dragData.column
        });
      } else if (widget.widgetType === 'Table') {
        const currentCols = widget.config.tableColumns || [];
        if (!currentCols.includes(dragData.column)) {
          handleUpdateWidgetConfig(widget.widgetId, {
            datasetTable: dragData.table,
            tableColumns: [...currentCols, dragData.column]
          });
        }
      }

      setDraggedColumn(null);
    } catch (err) {
      console.error('Lỗi khi thả cột:', err);
    }
  };

  const handleInstantAssignToSelectedWidget = (colName: string, isNumeric: boolean) => {
    if (!selectedWidgetId) return;
    const targetW = widgets.find(w => w.widgetId === selectedWidgetId);
    if (!targetW) return;

    const sourceT = tables[activeTableIdx]?.tableName || 'fi_final_bcdt';

    if (targetW.widgetType === 'KPI') {
      handleUpdateWidgetConfig(selectedWidgetId, {
        datasetTable: sourceT,
        measureColumn: colName
      });
    } else if (targetW.widgetType.startsWith('Chart_')) {
      if (isNumeric) {
        handleUpdateWidgetConfig(selectedWidgetId, {
          datasetTable: sourceT,
          measureColumn: colName
        });
      } else {
        handleUpdateWidgetConfig(selectedWidgetId, {
          datasetTable: sourceT,
          dimensionColumn: colName
        });
      }
    } else if (targetW.widgetType === 'Filter') {
      handleUpdateWidgetConfig(selectedWidgetId, {
        datasetTable: sourceT,
        filterColumn: colName
      });
    } else if (targetW.widgetType === 'Table') {
      const currentCols = targetW.config.tableColumns || [];
      if (!currentCols.includes(colName)) {
        handleUpdateWidgetConfig(selectedWidgetId, {
          datasetTable: sourceT,
          tableColumns: [...currentCols, colName]
        });
      }
    }
  };

  const selectedWidget = widgets.find(w => w.widgetId === selectedWidgetId);
  const activeTable = tables[activeTableIdx];
  const activeTableColumns = activeTable ? columns.filter(c => c.tableId === activeTable.tableId) : [];

  return (
    <div id="dashboard-designer-section" className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} />
            Bảng vẽ Thiết kế Dashboard (Designer)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Đang sửa: <strong className="text-indigo-900 font-bold">{dashboard?.dashboardName || 'Bản nháp'}</strong> • Kéo thả cấu trúc bảng hoặc tinh chỉnh thông số tự động của từng biểu đồ.
          </p>
        </div>

        {/* Studio Saves */}
        <div className="flex items-center gap-2 font-semibold">
          {onPreviewRequested && (
            <button
              onClick={onPreviewRequested}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Mở cổng BI Viewer
            </button>
          )}
          <button
            id="btn-save-designer-layout"
            onClick={handleSaveLayout}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-sm shadow-indigo-100 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu Bố Cục & Tọa Độ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Settings className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Đang đồng bộ hóa tọa độ thiết kế và cấu trúc SQL...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* LEFT PANEL: Tables & Columns Selector Catalog */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Cơ sở dữ liệu & Bảng
              </h3>

              {tables.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có thuộc tính tự động nào được quét thấy.</p>
              ) : (
                <div className="space-y-4">
                  {/* Tables Pickers */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Chọn bảng liên kết mục tiêu</label>
                    <select
                      value={activeTableIdx}
                      onChange={(e) => setActiveTableIdx(Number(e.target.value))}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 cursor-pointer"
                    >
                      {tables.map((t, idx) => (
                        <option key={t.tableId} value={idx}>{t.tableName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Columns for active table */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                      Các cột trong bảng ({activeTableColumns.length})
                    </span>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Kéo thả cột này vào các Widget trong khung vẽ, hoặc bấm nút <strong>Gán cột</strong> nhanh khi đang chọn một Widget.
                    </p>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {activeTableColumns.map((c) => {
                        const isNumeric = ['DECIMAL', 'INTEGER', 'NUMERIC', 'DOUBLE', 'FLOAT'].includes(c.dataType.toUpperCase());
                        return (
                          <div
                            key={c.columnId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, activeTable.tableName, c.columnName, c.dataType)}
                            className="group flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 cursor-grab active:cursor-grabbing transition-all"
                          >
                            <div className="flex items-center gap-1.5">
                              <Move className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">{c.columnName}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 py-0.2 rounded shrink-0">
                                {c.dataType}
                              </span>
                              {selectedWidgetId && (
                                <button
                                  type="button"
                                  onClick={() => handleInstantAssignToSelectedWidget(c.columnName, isNumeric)}
                                  className="text-[9px] bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-1.5 py-0.5 rounded font-black transition-colors cursor-pointer"
                                  title="Gán nhanh thuộc tính cho widget đang chọn"
                                >
                                  Gán
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widgets Creator palette picker */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Danh mục linh kiện biểu đồ
              </h3>
              <p className="text-[10px] text-slate-400">Ấn nút dưới đây để tạo và thêm một tấm linh kiện thiết kế mới vào lưới Dashboard bên cạnh.</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-tool-kpi"
                  onClick={() => handleCreateWidget('KPI')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <TrendingUp className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span className="text-[10px]">Thẻ KPI số</span>
                </button>

                <button
                  type="button"
                  id="btn-tool-bar"
                  onClick={() => handleCreateWidget('Chart_Bar')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <span className="text-[10px]">Biểu đồ cột</span>
                </button>

                <button
                  type="button"
                  id="btn-tool-line"
                  onClick={() => handleCreateWidget('Chart_Line')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px]">Biểu đồ đường</span>
                </button>

                <button
                  type="button"
                  id="btn-tool-donut"
                  onClick={() => handleCreateWidget('Chart_Donut')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px]">Hình tròn / Donut</span>
                </button>

                <button
                  type="button"
                  id="btn-tool-table"
                  onClick={() => handleCreateWidget('Table')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold col-span-2 gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <Table2 className="w-5 h-5 text-blue-500" />
                  <span className="text-[10px]">Bảng kê chi tiết giao dịch</span>
                </button>

                <button
                  type="button"
                  id="btn-tool-filter"
                  onClick={() => handleCreateWidget('Filter')}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 rounded-xl transition-all font-semibold col-span-2 gap-1 text-slate-700 hover:text-indigo-700 cursor-pointer"
                >
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <span className="text-[10px]">Thanh Bộ lọc báo cáo động</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN DECORATOR CENTER: Dashboard Canvas Workspace */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-slate-100 rounded-2xl p-6 min-h-[600px] border border-slate-200/80 shadow-inner relative space-y-6">
              
              {/* Layout Helper Guidelines Overlay */}
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" /> Bản vẽ thiết kế: Hệ trục tương thích lưới 12 cột tự động
                </span>
                <span>Số lượng widget: {widgets.length}</span>
              </div>

              {widgets.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 border border-slate-100">
                    <Compass className="w-6 h-6 text-indigo-300 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-slate-700 text-sm">Khung vẽ chưa có linh kiện</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 font-medium">
                      Hãy nhấp vào linh kiện ở cột bên trái (như KPI Card, Biểu đồ cột, hay Bảng chỉ số) để nạp biểu đồ đầu tiên của bảng fi_final_bcdt lên đây!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {widgets.map((w) => {
                    const isSelected = selectedWidgetId === w.widgetId;
                    
                    let colSpanClass = 'col-span-12';
                    if (w.width === 1) colSpanClass = 'col-span-1';
                    else if (w.width === 2) colSpanClass = 'col-span-2';
                    else if (w.width === 3) colSpanClass = 'col-span-3';
                    else if (w.width === 4) colSpanClass = 'col-span-4';
                    else if (w.width === 5) colSpanClass = 'col-span-5';
                    else if (w.width === 6) colSpanClass = 'col-span-6';
                    else if (w.width === 8) colSpanClass = 'col-span-8';
                    else if (w.width === 9) colSpanClass = 'col-span-9';
                    else if (w.width === 10) colSpanClass = 'col-span-10';

                    return (
                      <div
                        key={w.widgetId}
                        id={`canvas-widget-${w.widgetId}`}
                        onClick={() => setSelectedWidgetId(w.widgetId)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnWidget(e, w)}
                        className={`flex flex-col bg-white rounded-xl border p-4 cursor-pointer select-none relative transition-all ${colSpanClass} ${
                          isSelected 
                            ? 'ring-2 ring-indigo-500 border-indigo-200 shadow-md shadow-indigo-100/40' 
                            : 'border-slate-200/60 hover:shadow shadow-sm'
                        }`}
                      >
                        {/* Drag and Drop Action Zone Glow */}
                        {draggedColumn && (
                          <div className="absolute inset-0 bg-indigo-50/10 border-2 border-dashed border-indigo-400 rounded-xl pointer-events-none flex items-center justify-center font-mono text-[9px] uppercase font-bold text-indigo-700 z-20">
                            Thả cột dữ liệu vào đây để liên kết
                          </div>
                        )}

                        {/* Control Handles Header */}
                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                            {w.widgetType === 'KPI' ? 'Thẻ KPI' : w.widgetType === 'Filter' ? 'Thanh bộ lọc' : w.widgetType === 'Table' ? 'Bảng thông tin' : 'Biểu đồ trực quan'}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Width Adjustments controls */}
                            <div className="flex items-center bg-slate-50 rounded border border-slate-200/60 divide-x divide-slate-200/60 text-[9px] font-bold text-slate-600">
                              <button 
                                type="button"
                                title="Thu nhỏ bề rộng"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateWidgetSize(w.widgetId, { width: Math.max(2, w.width - 1) });
                                }}
                                className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-indigo-600"
                              >
                                -
                              </button>
                              <span className="px-1.5 py-0.5 text-slate-400 font-mono text-[8px]">bề rộng:{w.width}</span>
                              <button 
                                type="button"
                                title="Kéo dài bề rộng"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateWidgetSize(w.widgetId, { width: Math.min(12, w.width + 1) });
                                }}
                                className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-indigo-600"
                              >
                                +
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              id={`btn-remove-widget-${w.widgetId}`}
                              onClick={(e) => handleRemoveWidget(w.widgetId, e)}
                              className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Visual Widget Preview */}
                        <div className="flex-1 space-y-1.5 min-h-[60px] flex flex-col justify-center">
                          <h4 className="font-display font-semibold text-slate-700 text-xs truncate">
                            {w.config.title || 'Widget chưa đặt tên'}
                          </h4>
                          
                          {/* KPI style */}
                          {w.widgetType === 'KPI' && (
                            <div className="text-center py-4 bg-slate-50/50 border border-slate-100 rounded-lg">
                              <span className="text-[10px] font-mono text-indigo-500 uppercase font-bold">
                                Công thức: {w.config.aggregation}({w.config.measureColumn})
                              </span>
                              <div className="text-2xl font-display font-bold text-indigo-600 tracking-tight mt-1 font-mono">
                                1.849.200.000 ₫
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono block">Nguồn: {w.config.datasetTable}</span>
                            </div>
                          )}

                          {/* Charts styles */}
                          {w.widgetType.startsWith('Chart_') && (
                            <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-4 text-center justify-center flex flex-col items-center">
                              <BarChart3 className="w-8 h-8 text-indigo-400 mb-1" />
                              <span className="text-[9px] font-semibold text-slate-600 block">
                                Xem trước Biểu đồ {w.widgetType.replace('Chart_', '') === 'Bar' ? 'Cột' : w.widgetType.replace('Chart_', '') === 'Line' ? 'Đường' : 'Donut'}
                              </span>
                              <span className="text-[8px] font-mono text-slate-400 block max-w-[150px] truncate">
                                Trục X: {w.config.dimensionColumn} • Giá trị: {w.config.measureColumn}
                              </span>
                            </div>
                          )}

                          {/* Table styles */}
                          {w.widgetType === 'Table' && (
                            <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-4 text-center justify-center flex flex-col items-center gap-1.5">
                              <Table2 className="w-6 h-6 text-indigo-400" />
                              <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
                                {(w.config.tableColumns || []).slice(0, 3).map(col => (
                                  <span key={col} className="text-[8px] font-mono bg-white border border-slate-200 text-slate-400 px-1 rounded">
                                    {col}
                                  </span>
                                ))}
                                {(w.config.tableColumns || []).length > 3 && <span className="text-[8px] text-slate-400 font-bold">...</span>}
                              </div>
                            </div>
                          )}

                          {/* Filters styles */}
                          {w.widgetType === 'Filter' && (
                            <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-3 flex items-center justify-between text-xs font-semibold text-slate-600 font-mono">
                              <span className="font-semibold text-slate-700">Lọc theo: {w.config.filterColumn || 'Nước'}</span>
                              <span className="text-[9px] font-mono text-slate-400 px-1 bg-white border border-slate-100 rounded">
                                {w.config.filterType === 'Dropdown' ? 'Danh sách thả xuống' : w.config.filterType === 'MultiSelect' ? 'Nhiều lựa chọn' : 'Thời gian'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SELECTED COMPONENT CONFIGURATOR EDGE */}
          <div id="designer-configurator-sidebar" className="xl:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-700 font-display font-semibold text-sm">
                <Settings className="w-4 h-4 text-slate-400" />
                Biên tập & Thiết lập Widget
              </div>

              {!selectedWidget ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Sliders className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                  <p className="text-xs font-medium">Chưa chọn widget nào</p>
                  <p className="text-[10px] text-slate-400">Vui lòng nhấp chuột vào bất cứ biểu đồ nào trong không gian thiết kế ở giữa để điều chỉnh thông số.</p>
                </div>
              ) : (
                <div key={selectedWidget.widgetId} className="space-y-4 text-xs font-semibold text-slate-600">
                  
                  {/* General Component Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tiêu đề Widget này</label>
                    <input
                      id="config-widget-title"
                      type="text"
                      value={selectedWidget.config.title}
                      onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { title: e.target.value })}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-slate-50"
                    />
                  </div>

                  {/* Shared source details */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100/70 font-semibold font-mono">
                    <div>
                      <span>BẢNG LIÊN KẾT</span>
                      <strong className="block text-[11px] text-slate-800 font-semibold mt-0.5">{selectedWidget.config.datasetTable}</strong>
                    </div>
                    <div>
                      <span>LOẠI BIỂU ĐỒ</span>
                      <strong className="block text-[11px] text-indigo-700 font-semibold mt-0.5">
                        {selectedWidget.widgetType === 'KPI' ? 'Thẻ KPI' : selectedWidget.widgetType === 'Filter' ? 'Lọc Toàn Cục' : 'Biểu đồ KPI'}
                      </strong>
                    </div>
                  </div>

                  {/* 1. KPI Configuration block */}
                  {selectedWidget.widgetType === 'KPI' && (
                    <div id="config-kpi-specific" className="space-y-4 pt-3 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cột đo lường chỉ số</label>
                        <select
                          id="config-kpi-measure"
                          value={selectedWidget.config.measureColumn || ''}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { measureColumn: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          {activeTableColumns.map(c => (
                            <option key={c.columnId} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Công thức Aggregate dữ liệu</label>
                        <select
                          id="config-kpi-agg"
                          value={selectedWidget.config.aggregation || 'SUM'}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { aggregation: e.target.value as any })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          <option value="SUM">SUM (Tổng số cộng dồn)</option>
                          <option value="COUNT">COUNT (Đếm số lượng dòng)</option>
                          <option value="AVG">AVG (Ước lượng trị trung bình)</option>
                          <option value="MIN">MIN (Lấy mốc nhỏ nhất)</option>
                          <option value="MAX">MAX (Lấy mốc kỷ lục lớn nhất)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 2. Chart Specific Option block */}
                  {selectedWidget.widgetType.startsWith('Chart_') && (
                    <div id="config-chart-specific" className="space-y-4 pt-3 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Trục phân loại (X-Axis hoặc Nhãn tròn)</label>
                        <select
                          id="config-chart-dimension"
                          value={selectedWidget.config.dimensionColumn || ''}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { dimensionColumn: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          {activeTableColumns.map(c => (
                            <option key={c.columnId} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cột Giá Trị Số Đo Lường</label>
                        <select
                          id="config-chart-measure"
                          value={selectedWidget.config.measureColumn || ''}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { measureColumn: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          {activeTableColumns.map(c => (
                            <option key={c.columnId} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Công thức Aggregate</label>
                        <select
                          id="config-chart-agg"
                          value={selectedWidget.config.aggregation || 'SUM'}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { aggregation: e.target.value as any })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          <option value="SUM">SUM (Tính tổng số cộng dồn)</option>
                          <option value="COUNT">COUNT (Tính số dòng ghi chép)</option>
                          <option value="AVG">AVG (Mức trung bình cộng)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Màu sắc chủ đề swatch chính</label>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0f172a'].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => handleUpdateWidgetConfig(selectedWidget.widgetId, { chartColor: col })}
                              style={{ backgroundColor: col }}
                              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                                selectedWidget.config.chartColor === col ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'border-slate-300 hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex justify-between">Thứ tự sắp xếp dòng</label>
                        <select
                          value={selectedWidget.config.sortOrder || 'DESC'}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { sortOrder: e.target.value as any })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          <option value="DESC">Giá trị giảm dần (Từ cao xuống thấp)</option>
                          <option value="ASC">Giá trị tăng dần (Từ thấp lên cao)</option>
                          <option value="None">Sắp xếp thô tự nhiên theo Database</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 3. Table Column Selector settings */}
                  {selectedWidget.widgetType === 'Table' && (
                    <div id="config-table-specific" className="space-y-3 pt-3 border-t border-slate-100">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Chọn các cột hiển thị trên bảng</label>
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
                        {activeTableColumns.map(c => {
                          const isChecked = (selectedWidget.config.tableColumns || []).includes(c.columnName);
                          return (
                            <label key={c.columnId} className="flex items-center gap-2 py-1 cursor-pointer font-bold text-slate-755 hover:text-indigo-600 text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let currentList = [...(selectedWidget.config.tableColumns || [])];
                                  if (e.target.checked) {
                                    if (!currentList.includes(c.columnName)) currentList.push(c.columnName);
                                  } else {
                                    currentList = currentList.filter(col => col !== c.columnName);
                                  }
                                  handleUpdateWidgetConfig(selectedWidget.widgetId, { tableColumns: currentList });
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              {c.columnName}
                            </label>
                          );
                        })}
                      </div>

                      <div className="space-y-1 mt-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Số dòng hiển thị phân trang</label>
                        <select
                          value={selectedWidget.config.pageSize || 10}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { pageSize: Number(e.target.value) })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          <option value="5">Hiển thị 5 dòng</option>
                          <option value="10">Hiển thị 10 dòng</option>
                          <option value="20">Hiển thị 20 dòng</option>
                          <option value="50">Hiển thị 50 dòng</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. Filter Component options */}
                  {selectedWidget.widgetType === 'Filter' && (
                    <div id="config-filter-specific" className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cột dữ liệu liên kết bộ lọc</label>
                        <select
                          id="config-filter-column"
                          value={selectedWidget.config.filterColumn || ''}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { filterColumn: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          {activeTableColumns.map(c => (
                            <option key={c.columnId} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Mẫu mã tương tác bộ lọc</label>
                        <select
                          id="config-filter-style"
                          value={selectedWidget.config.filterType || 'Dropdown'}
                          onChange={(e) => handleUpdateWidgetConfig(selectedWidget.widgetId, { filterType: e.target.value as any })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white cursor-pointer"
                        >
                          <option value="Dropdown">Danh sách thả xuống 1 lựa chọn (Dropdown)</option>
                          <option value="MultiSelect">Nhiều hộp kiểm chọn dữ liệu (MultiCheck)</option>
                          <option value="Date">Lịch phân loại khoảng thời gian (Datepicker)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-100 my-4" />
                  <button
                    type="button"
                    onClick={() => setSelectedWidgetId(null)}
                    className="w-full text-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg py-2 text-xs font-semibold select-none cursor-pointer"
                  >
                    Xong thiết lập & Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
