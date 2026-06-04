import React, { useState, useEffect, useRef } from 'react';
import { 
  Dashboard, 
  DashboardWidget, 
  DashboardVersion, 
  QueryResult, 
  GlobalFilterState, 
  QueryRequest 
} from '../types';
import { 
  RefreshCw, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Terminal, 
  ChevronRight, 
  Layout, 
  ChevronLeft, 
  CornerDownRight, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

const COLUMN_LABEL_MAP: Record<string, string> = {
  id: 'ID',
  ngay: 'Ngày',
  ma_don_hang: 'Mã Đơn Hàng',
  khach_hang: 'Khách Hàng',
  loai_khach_hang: 'Loại Khách Hàng',
  san_pham: 'Sản Phẩm',
  nhom_san_pham: 'Nhóm Sản Phẩm',
  so_luong: 'Số Lượng',
  don_gia: 'Đơn Giá',
  doanh_thu: 'Doanh Thu',
  giam_gia: 'Giảm Giá',
  doanh_thu_thuan: 'Doanh Thu Thuần',
  gia_von: 'Giá Vốn',
  loi_nhuan: 'Lợi Nhuận',
  khu_vuc: 'Khu Vực',
  nhan_vien: 'Nhân Viên',
  trang_thai: 'Trạng Thái',
  thanhtien: 'Thành tiền',
  doanhthu: 'Doanh thu',
  soluong: 'Số lượng',
  gia: 'Đơn giá',
  ngay_xuat_bc: 'Ngày xuất BC',
  nguonden: 'Nguồn đến',
  kenh: 'Kênh',
  tructhuoc: 'Trực thuộc',
  nhanvien: 'Nhân viên'
};

const getColumnLabel = (h: string) => {
  return COLUMN_LABEL_MAP[h] || h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' ');
};

const isCurrencyColumn = (colName: string): boolean => {
  const norm = String(colName || '').toLowerCase();
  return norm.includes('thanhtien') || 
         norm.includes('doanhthu') || 
         norm.includes('doanh_thu') || 
         norm.includes('don_gia') || 
         norm.includes('giam_gia') || 
         norm.includes('gia_von') || 
         norm.includes('loi_nhuan') || 
         norm.includes('tien') || 
         norm.includes('price') || 
         norm.includes('amount') || 
         norm.includes('cost') || 
         norm.includes('revenue') || 
         norm.includes('profit') || 
         norm.includes('budget');
};

interface DashboardViewerPanelProps {
  dashboardId: string;
}

export default function DashboardViewerPanel({ dashboardId }: DashboardViewerPanelProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [versions, setVersions] = useState<DashboardVersion[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Schema metadata states
  const [allColumns, setAllColumns] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  // Runtime State
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({});
  const [widgetData, setWidgetData] = useState<Record<string, QueryResult>>({});
  const [widgetLoading, setWidgetLoading] = useState<Record<string, boolean>>({});
  
  // Tables custom state
  const [tablePages, setTablePages] = useState<Record<string, number>>({});
  const [tableSort, setTableSort] = useState<Record<string, { col: string, dir: 'ASC' | 'DESC' }>>({});

  // Auto-Refresh
  const [refreshInterval, setRefreshInterval] = useState<number>(0); // 0 = manual, positive is minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Drill-Down Dimension Status
  const [drillDownDim, setDrillDownDim] = useState<Record<string, string>>({});

  // Drill-Through Modal Status
  const [drillThroughRows, setDrillThroughRows] = useState<any[] | null>(null);
  const [drillThroughTitle, setDrillThroughTitle] = useState('');
  
  // Custom Screen toggle
  const [isFullScreen, setIsFullScreen] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Color cycles for slices
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  useEffect(() => {
    fetchLayout();
    fetchSchemaMetadata();
  }, [dashboardId]);

  useEffect(() => {
    if (widgets.length > 0) {
      loadAllWidgetsData();
    }
  }, [widgets, globalFilters, drillDownDim, tablePages, tableSort]);

  useEffect(() => {
    if (widgets.length > 0) {
      loadFilterOptions();
    }
  }, [widgets]);

  // Setup auto refresh timer loops
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (refreshInterval > 0) {
      timerRef.current = setInterval(() => {
        loadAllWidgetsData(true);
      }, refreshInterval * 60 * 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshInterval, widgets, globalFilters, drillDownDim, tablePages, tableSort]);

  const fetchSchemaMetadata = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/schema/tables'),
        fetch('/api/schema/columns')
      ]);
      if (tRes.ok && cRes.ok) {
        setAllTables(await tRes.json());
        setAllColumns(await cRes.json());
      }
    } catch (err) {
      console.error('Error fetching schema metadata in viewer:', err);
    }
  };

  const getTableColumns = (tableName: string): string[] => {
    const tableObj = allTables.find(t => t.tableName === tableName);
    if (!tableObj) return [];
    return allColumns
      .filter((c: any) => c.tableId === tableObj.tableId)
      .map((c: any) => c.columnName);
  };

  const loadFilterOptions = async () => {
    widgets
      .filter(w => w.widgetType === 'Filter' && w.config.filterColumn)
      .forEach(async (w) => {
        try {
          const bodyPayload: QueryRequest = {
            connectionId: dashboard?.connectionId || '',
            tableName: w.config.datasetTable,
            widgetType: 'Chart_Bar',
            dimensionColumn: w.config.filterColumn,
            measureColumn: 'id',
            aggregation: 'COUNT',
            limit: 100
          };
          const res = await fetch('/api/dashboard/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          if (res.ok) {
            const data = await res.json();
            const uniqueVals = data.rows ? data.rows.map((r: any) => String(r.dimension)) : [];
            setFilterOptions(prev => ({ ...prev, [w.widgetId]: uniqueVals }));
          }
        } catch (err) {
          console.error(`Error loading filter options for ${w.config.filterColumn}:`, err);
        }
      });
  };

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/${dashboardId}/layout`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data.dashboard);
        setWidgets(data.widgets || []);
        setVersions(data.versions || []);
        if (data.versions?.length > 0) {
          const maxVer = Math.max(...data.versions.map((v: any) => v.versionNumber));
          setSelectedVersionNum(maxVer);
        }
      }
    } catch (err) {
      console.error('Không thể tải cấu hình BI Runtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllWidgetsData = async (silent = false) => {
    widgets.forEach(async (w) => {
      if (w.widgetType === 'Filter') return;
      
      if (!silent) {
        setWidgetLoading(prev => ({ ...prev, [w.widgetId]: true }));
      }

      const compiledFilters: any[] = [];
      
      // Inject global filters matching columns
      Object.keys(globalFilters).forEach(col => {
        const val = globalFilters[col];
        if (val === null || val === undefined || val === '') return;

        if (Array.isArray(val)) {
          compiledFilters.push({ columnName: col, value: val, operator: 'in' });
        } else if (typeof val === 'object' && 'start' in val) {
          compiledFilters.push({ columnName: col, value: [val.start, val.end], operator: 'between' });
        } else {
          compiledFilters.push({ columnName: col, value: val, operator: 'equals' });
        }
      });

      const pgVal = tablePages[w.widgetId] || 1;
      const sorting = tableSort[w.widgetId] || { col: w.config.sortBy || '', dir: w.config.sortDirection || 'DESC' };
      const activeDimColumn = drillDownDim[w.widgetId] || w.config.dimensionColumn;

      const bodyPayload: QueryRequest = {
        connectionId: dashboard?.connectionId || '',
        tableName: w.config.datasetTable,
        widgetType: w.widgetType,
        measureColumn: w.config.measureColumn,
        aggregation: w.config.aggregation,
        dimensionColumn: activeDimColumn,
        filters: compiledFilters,
        tableColumns: w.config.tableColumns,
        sortColumn: sorting.col,
        sortDirection: sorting.dir,
        limit: w.config.pageSize || 10,
        page: pgVal
      };

      try {
        const res = await fetch('/api/dashboard/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (res.ok) {
          const resData = await res.json();
          setWidgetData(prev => ({ ...prev, [w.widgetId]: resData }));
        }
      } catch (err) {
        console.error(`Lỗi tải dữ liệu biểu đồ ${w.widgetId}:`, err);
      } finally {
        setWidgetLoading(prev => ({ ...prev, [w.widgetId]: false }));
      }
    });
  };

  const handleRollbackVersion = async (v: DashboardVersion) => {
    setSelectedVersionNum(v.versionNumber);
    try {
      const layoutArray = JSON.parse(v.layoutJson) as { widgetId: string, positionX: number, positionY: number, width: number, height: number }[];
      
      setWidgets(prev => {
        return prev.map(w => {
          const match = layoutArray.find(item => item.widgetId === w.widgetId);
          if (match) {
            return {
              ...w,
              positionX: match.positionX,
              positionY: match.positionY,
              width: match.width,
              height: match.height
            };
          }
          return w;
        });
      });

      alert(`Đã hoàn tác và đồng bộ hóa sơ đồ vị trí biểu đồ theo phiên bản v${v.versionNumber} thành công.`);
    } catch {
      alert('Lỗi phân tích bản ghi phiên bản thiết kế lịch sử.');
    }
  };

  const handleFilterChange = (columnName: string, value: any) => {
    setGlobalFilters(prev => ({
      ...prev,
      [columnName]: value === 'All' ? null : value
    }));
  };

  const handleChartPointClick = (w: DashboardWidget, activeLabel: string) => {
    const tableObj = allTables.find(t => t.tableName === w.config.datasetTable);
    const tableCols = tableObj ? allColumns.filter(c => c.tableId === tableObj.tableId) : [];
    
    const fallbackCols = ['ngay', 'khach_hang', 'loai_khach_hang', 'san_pham', 'nhom_san_pham', 'khu_vuc', 'nhan_vien', 'trang_thai'];
    const categoricalCols = tableCols.length > 0 
      ? tableCols.filter(c => ['VARCHAR', 'CHAR', 'TEXT', 'DATE'].includes(String(c.dataType).toUpperCase()) && !c.isPrimaryKey).map(c => c.columnName)
      : fallbackCols;

    const currentDimName = drillDownDim[w.widgetId] || w.config.dimensionColumn;
    
    let nextDim = '';
    if (categoricalCols.length > 0) {
      const idx = categoricalCols.indexOf(currentDimName || '');
      if (idx !== -1) {
        nextDim = categoricalCols[(idx + 1) % categoricalCols.length];
      } else {
        nextDim = categoricalCols[0];
      }
    }

    if (nextDim) {
      setDrillDownDim(prev => ({ ...prev, [w.widgetId]: nextDim }));
    }
    
    if (currentDimName) {
      handleFilterChange(currentDimName, activeLabel);
    }
  };

  const handleResetDrilldown = (wId: string) => {
    setDrillDownDim(prev => {
      const copy = { ...prev };
      delete copy[wId];
      return copy;
    });
  };

  const handleDrillThroughRequested = async (w: DashboardWidget, labelDimValue: string) => {
    setDrillThroughTitle(`Bảng kê Chi tiết Giao dịch (Drill-Through) của nhãn "${labelDimValue}"`);
    
    const targetDim = drillDownDim[w.widgetId] || w.config.dimensionColumn || 'khu_vuc';
    const tableCols = getTableColumns(w.config.datasetTable);
    
    const requestPayload: QueryRequest = {
      connectionId: dashboard?.connectionId || '',
      tableName: w.config.datasetTable,
      widgetType: 'Table',
      tableColumns: w.widgetType === 'Table' && w.config.tableColumns && w.config.tableColumns.length > 0
        ? w.config.tableColumns 
        : (tableCols.length > 0 ? tableCols : ['id', 'ngay', 'ma_don_hang', 'khach_hang', 'san_pham', 'so_luong', 'doanh_thu_thuan']),
      filters: [{ columnName: targetDim, value: labelDimValue, operator: 'equals' }],
      limit: 100 
    };

    try {
      const res = await fetch('/api/dashboard/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setDrillThroughRows(data.rows);
      }
    } catch {
      alert('Không nhận được bản ghi sao kê chi tiết từ database.');
    }
  };

  const handleExportCSV = async (w: DashboardWidget) => {
    const dataObj = widgetData[w.widgetId];
    if (!dataObj || !dataObj.rows || dataObj.rows.length === 0) {
      alert('Không có dữ liệu để xuất file.');
      return;
    }

    try {
      const res = await fetch('/api/dashboard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName: `${w.config.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_export`,
          format: 'csv',
          headers: dataObj.columns,
          rows: dataObj.rows
         })
      });

      if (res.ok) {
        const textStr = await res.text();
        const blob = new Blob([textStr], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const aLink = document.createElement('a');
        aLink.setAttribute('href', url);
        aLink.setAttribute('download', `${w.config.title.replace(/\s+/g, '_')}_baocao.csv`);
        aLink.click();
      }
    } catch {
      alert('Lỗi xuất cấu trúc file CSV.');
    }
  };

  const handleExportPDF = async (w: DashboardWidget) => {
    const dataObj = widgetData[w.widgetId];
    if (!dataObj || !dataObj.rows) return;

    try {
      const res = await fetch('/api/dashboard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName: w.config.title,
          format: 'pdf',
          headers: dataObj.columns,
          rows: dataObj.rows
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`[Xuất báo cáo PDF thành công]\n\n${data.message}\nBản tóm tắt in:\n${data.previewText}`);
      }
    } catch {
      alert('Không thể kết nối dịch vụ biên soạn PDF.');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div 
      ref={viewerContainerRef}
      id="dashboard-viewer-section" 
      className={`space-y-6 animate-fade-in ${isFullScreen ? 'bg-slate-900 text-white p-8 overflow-y-auto' : ''}`}
    >
      
      {/* Title Header Grid controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-250/60 pb-4">
        <div>
          <h1 className={`text-2xl font-display font-bold tracking-tight ${isFullScreen ? 'text-white' : 'text-slate-850'} flex items-center gap-2`}>
            <Layout className="w-6 h-6 text-indigo-600 shrink-0" />
            {dashboard?.dashboardName || 'Bảng điều khiển BI Runtime'}
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed font-semibold">
            {dashboard?.description || 'Báo cáo doanh thu thời gian thực và phân tích các chỉ tiêu kinh doanh.'}
          </p>
        </div>

        {/* Runtime Options controls */}
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {/* Version control rollback toggle drop */}
          {versions.length > 0 && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-slate-600 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400 pl-1" />
              <select
                value={selectedVersionNum || 1}
                onChange={(e) => {
                  const targetVer = versions.find(v => v.versionNumber === Number(e.target.value));
                  if (targetVer) handleRollbackVersion(targetVer);
                }}
                className="text-xs font-bold border-none text-slate-700 bg-transparent pr-4 focus:ring-0 cursor-pointer"
              >
                {versions.map(v => (
                  <option key={v.versionId} value={v.versionNumber}>Bản vẽ lịch sử v{v.versionNumber}</option>
                ))}
              </select>
            </div>
          )}

          {/* Auto Refresh choices */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-slate-600 shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 pl-1 animate-spin" style={{ animationDuration: '4s' }} />
            <select
              id="select-refresh-interval"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-xs font-bold border-none text-slate-700 bg-transparent pr-4 focus:ring-0 cursor-pointer"
            >
              <option value="0">Làm mới bằng tay (Manual)</option>
              <option value="1">Tự động nạp lại (1 Phút)</option>
              <option value="5">Tự động nạp lại (5 Phút)</option>
              <option value="15">Tự động nạp lại (15 Phút)</option>
            </select>
          </div>

          {/* Manual Force click */}
          <button
            type="button"
            id="btn-manual-refresh"
            onClick={() => loadAllWidgetsData(false)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-indigo-600 rounded-lg shadow-xs cursor-pointer"
            title="Làm mới chỉ số tức thì"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Full Screen */}
          <button
            onClick={toggleFullScreen}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg shadow-xs cursor-pointer"
            title="Xem toàn màn hình"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-bold">Đang tải và tổng hợp dữ liệu doanh thu...</p>
        </div>
      ) : widgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed max-w-lg mx-auto">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
          <p className="text-sm text-slate-600 font-bold">Bảng dashboard trống</p>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng chuyển sang tab <strong>Thiết kế Dashboard</strong> để thực hiện kéo thả biểu đồ báo cáo từ bảng <code>fi_final_bcdt</code>!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* FILTERS TOP BAR SECTION */}
          {widgets.some(w => w.widgetType === 'Filter') && (
            <div id="runtime-filters-bar" className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <span className="col-span-full text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Bộ lọc báo cáo tổng hợp
              </span>

              {widgets
                .filter(w => w.widgetType === 'Filter')
                .map((w) => {
                  const filterCol = w.config.filterColumn || 'khu_vuc';
                  const activeVal = globalFilters[filterCol] || '';

                  // Retrieve exact distinct values fetched from database structure
                  let selectOptions = filterOptions[w.widgetId] || [];
                  if (selectOptions.length === 0) {
                    if (filterCol === 'khu_vuc') selectOptions = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
                    else if (filterCol === 'trang_thai') selectOptions = ['Đã hoàn thành', 'Chờ xử lý', 'Đã hủy'];
                    else if (filterCol === 'loai_khach_hang') selectOptions = ['Bán buôn', 'Bán lẻ', 'Đối tác'];
                  }

                  return (
                    <div key={w.widgetId} className="flex flex-col gap-1 z-10">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        {w.config.title || `Lọc theo ${filterCol}`}
                      </label>

                      {w.config.filterType === 'Date' ? (
                        <div className="flex gap-1">
                          <input
                            type="date"
                            value={(activeVal as any)?.start || '2026-01-01'}
                            onChange={(e) => {
                              const endVal = (activeVal as any)?.end || '2026-12-31';
                              handleFilterChange(filterCol, { start: e.target.value, end: endVal });
                            }}
                            className="text-xs border border-slate-200 bg-slate-50 rounded-lg p-1.5 focus:bg-white cursor-pointer"
                          />
                          <input
                            type="date"
                            value={(activeVal as any)?.end || '2026-12-31'}
                            onChange={(e) => {
                              const startVal = (activeVal as any)?.start || '2026-01-01';
                              handleFilterChange(filterCol, { start: startVal, end: e.target.value });
                            }}
                            className="text-xs border border-slate-200 bg-slate-50 rounded-lg p-1.5 focus:bg-white cursor-pointer"
                          />
                        </div>
                      ) : w.config.filterType === 'MultiSelect' ? (
                        <div className="flex flex-wrap gap-1.5 border border-slate-200 rounded-lg p-1.5 bg-slate-50/50 max-h-24 overflow-y-auto">
                          {selectOptions.map(opt => {
                            const currentList = Array.isArray(activeVal) ? activeVal : [];
                            const isSelected = currentList.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const updated = isSelected 
                                    ? currentList.filter(v => v !== opt) 
                                    : [...currentList, opt];
                                  handleFilterChange(filterCol, updated.length > 0 ? updated : null);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'bg-white border text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <select
                          value={activeVal as string || 'All'}
                          onChange={(e) => handleFilterChange(filterCol, e.target.value)}
                          className="text-xs font-semibold border border-slate-200 rounded-lg p-1.5 bg-slate-50/50 focus:bg-white cursor-pointer"
                        >
                          <option value="All">Tất cả nhãn của {filterCol}</option>
                          {selectOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* ACTIVE CANVAS MAIN WIDGETS GRID */}
          <div className="grid grid-cols-12 gap-6">
            {widgets
              .filter(w => w.widgetType !== 'Filter')
              .map((w) => {
                const isWLoading = !!widgetLoading[w.widgetId];
                const dataObj = widgetData[w.widgetId];
                
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
                    id={`runtime-widget-card-${w.widgetId}`}
                    className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm shadow-slate-100/50 flex flex-col relative transition-all duration-300 ${colSpanClass}`}
                  >
                    {isWLoading && (
                      <div className="absolute top-4 right-4 text-indigo-500">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    )}

                    {/* Widget Header Area */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 mb-4">
                      <div>
                        <h3 className={`font-display font-bold text-xs ${isFullScreen ? 'text-white' : 'text-slate-800'}`}>
                          {w.config.title}
                        </h3>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono block">
                          Bảng cơ sở: {w.config.datasetTable}
                        </span>
                      </div>

                      {/* Download operation triggers */}
                      <div className="flex items-center gap-1 font-semibold">
                        {drillDownDim[w.widgetId] && (
                          <button
                            title="Reset Drill Down Dimension"
                            onClick={() => handleResetDrilldown(w.widgetId)}
                            className="px-1.5 py-0.5 border border-amber-200 text-amber-700 bg-amber-50 rounded-md text-[9px] hover:bg-amber-100 font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                          >
                            Đặt lại ({drillDownDim[w.widgetId]})
                          </button>
                        )}
                        <button
                          title="Xuất bảng kê file CSV"
                          onClick={() => handleExportCSV(w)}
                          className="p-1 rounded text-slate-350 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          title="Tải tóm tắt PDF"
                          onClick={() => handleExportPDF(w)}
                          className="p-1 rounded text-slate-350 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    </div>

                    {/* Render matching visualizations */}
                    <div className="flex-1 flex flex-col justify-center min-h-[200px]">
                      {!dataObj || !dataObj.rows ? (
                        <div className="text-center py-12 text-slate-400 h-full flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-slate-350" />
                        </div>
                      ) : dataObj.rows.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                          Không tìm thấy bản ghi dữ liệu phù hợp với điều kiện lọc hiện tại.
                        </div>
                      ) : (
                        <>
                          {/* KPI RENDERING */}
                          {w.widgetType === 'KPI' && (
                            <div className="text-center py-6 space-y-1 bg-gradient-to-tr from-slate-50 to-slate-100/50 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-indigo-500 font-mono uppercase tracking-widest block">
                                {w.config.aggregation || 'TỔNG'} CỦA {w.config.measureColumn}
                              </span>
                              <div className="text-3xl font-display font-extrabold tracking-tight text-slate-800 font-mono">
                                {isCurrencyColumn(w.config.measureColumn)
                                  ? formatCurrency(dataObj.rows[0]?.value || 0)
                                  : Number(dataObj.rows[0]?.value || 0).toLocaleString()
                                }
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono block">Chỉ số truy vấn từ krf</span>
                            </div>
                          )}

                          {/* BAR CHART RENDERING */}
                          {w.widgetType === 'Chart_Bar' && (
                            <ResponsiveContainer width="100%" height={240}>
                              <BarChart 
                                data={dataObj.rows} 
                                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                                onClick={(state: any) => {
                                  if (state && state.activeLabel) {
                                    handleChartPointClick(w, String(state.activeLabel));
                                  }
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                                <YAxis stroke="#94a3b8" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                                />
                                <Bar 
                                  dataKey="measure" 
                                  fill={w.config.chartColor || '#3b82f6'} 
                                  radius={[4, 4, 0, 0]}
                                  className="cursor-pointer"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          )}

                          {/* LINE CHART RENDERING */}
                          {w.widgetType === 'Chart_Line' && (
                            <ResponsiveContainer width="100%" height={240}>
                              <LineChart 
                                data={dataObj.rows} 
                                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                                onClick={(state: any) => {
                                  if (state && state.activeLabel) {
                                    handleChartPointClick(w, String(state.activeLabel));
                                  }
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                                <Line 
                                  type="monotone" 
                                  dataKey="measure" 
                                  stroke={w.config.chartColor || '#10b981'} 
                                  strokeWidth={3} 
                                  activeDot={{ r: 6 }} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}

                          {/* PIE / DONUT RENDERING */}
                          {(w.widgetType === 'Chart_Pie' || w.widgetType === 'Chart_Donut') && (
                            <div className="h-[240px] flex items-center justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={dataObj.rows}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={w.widgetType === 'Chart_Donut' ? 50 : 0}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="measure"
                                    nameKey="dimension"
                                    onClick={(state: any) => {
                                      const dimVal = state?.payload?.dimension || state?.dimension || state?.name;
                                      if (dimVal) {
                                        handleChartPointClick(w, String(dimVal));
                                      }
                                    }}
                                  >
                                    {dataObj.rows.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        className="cursor-pointer"
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* DETAILS TABLE RENDERING */}
                          {w.widgetType === 'Table' && (
                            <div className="space-y-4">
                              <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/20">
                                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                      {dataObj.columns.map(h => {
                                        const sortState = tableSort[w.widgetId];
                                        const isSorted = sortState?.col === h;

                                        return (
                                          <th 
                                            key={h} 
                                            onClick={() => {
                                              const newDir = isSorted && sortState.dir === 'DESC' ? 'ASC' : 'DESC';
                                              setTableSort(prev => ({ ...prev, [w.widgetId]: { col: h, dir: newDir } }));
                                            }}
                                            className="p-3 font-semibold text-slate-500 uppercase tracking-widest text-[10px] cursor-pointer hover:bg-slate-100/60"
                                          >
                                            <div className="flex items-center gap-1">
                                              {getColumnLabel(h)}
                                              {isSorted ? (
                                                <span className="text-[8px] font-mono font-bold bg-indigo-50 border px-1 text-indigo-600 rounded">
                                                  {sortState.dir === 'DESC' ? 'GIẢM' : 'TĂNG'}
                                                </span>
                                              ) : (
                                                <span className="text-[7px] text-slate-300">⇅</span>
                                              )}
                                            </div>
                                          </th>
                                        );
                                      })}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {dataObj.rows.map((r, rIdx) => (
                                      <tr key={rIdx} className="hover:bg-slate-50/40 transition-colors">
                                        {dataObj.columns.map(h => {
                                          let val = r[h];
                                          const isMoney = isCurrencyColumn(h);
                                          if (isMoney && typeof val === 'number') val = formatCurrency(val);

                                          return (
                                            <td key={h} className="p-3 font-medium font-mono text-slate-700">
                                              {val === null || val === undefined ? <span className="text-slate-300 italic">null</span> : String(val)}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Simple detailed lists controls pagination */}
                              <div className="flex items-center justify-between font-semibold text-slate-500 text-xs mt-2 font-mono">
                                <span className="font-semibold text-slate-400">
                                  Tổng ghi chép: có {dataObj.totalCount || 0} dòng phù hợp
                                </span>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    title="Trang trước"
                                    onClick={() => {
                                      const currentPage = tablePages[w.widgetId] || 1;
                                      if (currentPage > 1) {
                                        setTablePages(prev => ({ ...prev, [w.widgetId]: currentPage - 1 }));
                                      }
                                    }}
                                    disabled={(tablePages[w.widgetId] || 1) <= 1}
                                    className="p-1.5 border rounded-lg hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <span>Trang {tablePages[w.widgetId] || 1}</span>

                                  <button
                                    title="Trang sau"
                                    onClick={() => {
                                      const currentPage = tablePages[w.widgetId] || 1;
                                      const limit = w.config.pageSize || 10;
                                      const total = dataObj.totalCount || 0;
                                      if (currentPage * limit < total) {
                                        setTablePages(prev => ({ ...prev, [w.widgetId]: currentPage + 1 }));
                                      }
                                    }}
                                    disabled={((tablePages[w.widgetId] || 1) * (w.config.pageSize || 10)) >= (dataObj.totalCount || 0)}
                                    className="p-1.5 border rounded-lg hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Drill-Through / Drills controls triggers help indicator */}
                          {w.widgetType.startsWith('Chart_') && (
                            <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-4 text-[10px] text-slate-400 font-semibold font-mono">
                              <span className="flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3 text-indigo-400" /> Nhấp vào lát để đi sâu (Drill Down)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (dataObj.rows[0]?.dimension) {
                                    handleDrillThroughRequested(w, dataObj.rows[0].dimension);
                                  }
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-black hover:underline cursor-pointer"
                              >
                                Xem bảng kê giao dịch chi tiết →
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* DYNAMIC SQL GENERATOR CODE EXPANDER PANEL */}
                    {dataObj?.sqlQuery && (
                      <div className="mt-4 border-t border-slate-50 pt-3">
                        <details className="group">
                          <summary className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer uppercase select-none tracking-widest hover:text-indigo-650">
                            <Terminal className="w-3.5 h-3.5 shrink-0" />
                            Câu lệnh SQL Động chạy ngầm
                          </summary>
                          <div className="bg-slate-900 text-emerald-400 rounded-xl p-3 font-mono text-[10px] mt-2 whitespace-pre-wrap leading-relaxed shadow-inner font-semibold border border-slate-800">
                            {dataObj.sqlQuery}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* DRILL-THROUGH AUDIT LEDGER DETAIL MODAL DIALOG */}
      {drillThroughRows !== null && (
        <div id="drill-through-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl border border-slate-100 p-6 shadow-2xl animate-scale-up space-y-6 flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-base">{drillThroughTitle}</h3>
                <span className="text-[10px] text-indigo-500 font-mono uppercase tracking-wider font-bold block">
                  Bản ghi thô từ Database (Tìm thấy {drillThroughRows.length} dòng khớp)
                </span>
              </div>
              <button 
                onClick={() => setDrillThroughRows(null)}
                className="text-slate-500 hover:text-slate-800 text-xs border border-slate-250 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Đóng lại
              </button>
            </div>

            {/* List details scrolling table container */}
            <div className="flex-1 overflow-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs bg-slate-50/10 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500 text-[10px] tracking-wider uppercase">
                    {Object.keys(drillThroughRows[0] || {}).map(k => (
                      <th key={k} className="p-3">{getColumnLabel(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {drillThroughRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {Object.keys(row).map(k => {
                        let val = row[k];
                        const isMoney = isCurrencyColumn(k);
                        if (isMoney && typeof val === 'number') {
                          val = formatCurrency(val);
                        }
                        return (
                          <td key={k} className="p-3 font-semibold">
                            {val === null || val === undefined ? 'null' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Help guidelines banner */}
            <div className="bg-slate-50 rounded-xl p-3 text-[10px] text-slate-400 font-semibold font-mono leading-relaxed border border-slate-150 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Các bản ghi thô (Drill-through) được truy vấn trực tiếp từ cơ sở dữ liệu Google Cloud SQL của cổng thông tin krf. Không qua chỉnh sửa.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
