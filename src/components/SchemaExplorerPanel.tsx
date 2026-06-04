import React, { useState, useEffect } from 'react';
import { 
  SchemaTable, 
  SchemaColumn, 
  SchemaRelationship 
} from '../types';
import { 
  FolderTree, 
  Search, 
  Database, 
  Key, 
  Link, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Info, 
  FolderSearch 
} from 'lucide-react';

interface SchemaExplorerPanelProps {
  activeConnectionId?: string;
  onRefreshTrigger?: number;
}

export default function SchemaExplorerPanel({ activeConnectionId, onRefreshTrigger }: SchemaExplorerPanelProps) {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [columns, setColumns] = useState<SchemaColumn[]>([]);
  const [relationships, setRelationships] = useState<SchemaRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [searchColumnQuery, setSearchColumnQuery] = useState('');
  
  // Track open/collapsed state of tables
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSchema();
  }, [activeConnectionId, onRefreshTrigger]);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const connParam = activeConnectionId ? `?connectionId=${activeConnectionId}` : '';
      
      const [tableRes, colRes, relRes] = await Promise.all([
        fetch(`/api/schema/tables${connParam}`),
        fetch(`/api/schema/columns`),
        fetch(`/api/schema/relationships`)
      ]);

      if (tableRes.ok && colRes.ok && relRes.ok) {
        const tableData = await tableRes.json();
        const colData = await colRes.json();
        const relData = await relRes.json();

        setTables(tableData);
        setColumns(colData);
        setRelationships(relData);

        // Pre-expand first few tables for visual ease
        const initialExpand: Record<string, boolean> = {};
        tableData.forEach((t: SchemaTable, idx: number) => {
          initialExpand[t.tableId] = idx < 2; // Expand the first 2 by default
        });
        setExpandedTables(initialExpand);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableExpand = (tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const handleExpandAll = () => {
    const expandState: Record<string, boolean> = {};
    tables.forEach(t => { expandState[t.tableId] = true; });
    setExpandedTables(expandState);
  };

  const handleCollapseAll = () => {
    setExpandedTables({});
  };

  // Filter logic based on the user searches
  const filteredTables = tables.filter(t => {
    const matchesTable = t.tableName.toLowerCase().includes(searchTableQuery.toLowerCase());
    
    if (searchColumnQuery.trim()) {
      const tableColumns = columns.filter(c => c.tableId === t.tableId);
      const matchesColumn = tableColumns.some(c => 
        c.columnName.toLowerCase().includes(searchColumnQuery.toLowerCase())
      );
      return matchesTable && matchesColumn;
    }
    
    return matchesTable;
  });

  return (
    <div id="schema-discovery-section" className="space-y-6 animate-fade-in">
      
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-emerald-600" />
            Nhận diện Tự động Cấu trúc (Schema Discovery)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Khám phá và tra cứu danh sách bảng, cột thuộc tính, kiểu dữ liệu, khóa chính/ngoại và ràng buộc liên hệ giữa các bảng.
          </p>
        </div>

        {/* Global toggles */}
        {tables.length > 0 && (
          <div className="flex items-center gap-2 font-semibold">
            <button
              id="btn-expand-all-schema"
              onClick={handleExpandAll}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Mở rộng tất cả
            </button>
            <button
              id="btn-collapse-all-schema"
              onClick={handleCollapseAll}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Thu gọn tất cả
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <Database className="w-8 h-8 text-emerald-500 animate-bounce mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Đang đồng bộ hóa cấu trúc schema từ metadata engine...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
            <FolderSearch className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 text-sm">Cây sơ đồ Schema trống</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Vui lòng chọn kết nối hoạt động và bấm kích hoạt đồng bộ hóa trong tab <strong>Kết nối Cơ sở Dữ liệu</strong> để tiến hành tự động quét bảng.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          {/* Double Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input 
                id="search-schema-table"
                type="text"
                placeholder="Lọc tên bảng dữ liệu..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-3 bg-slate-50/50 focus:bg-white focus:outline-emerald-500"
              />
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input 
                id="search-schema-column"
                type="text"
                placeholder="Tìm thuộc tính cột..."
                value={searchColumnQuery}
                onChange={(e) => setSearchColumnQuery(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-3 bg-slate-50/50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Tree View Canvas */}
          <div id="schema-tree-view" className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {filteredTables.map((t) => {
              const isExpanded = !!expandedTables[t.tableId];
              const tableCols = columns.filter(c => c.tableId === t.tableId);
              const tableRels = relationships.filter(r => r.sourceTable === t.tableName || r.targetTable === t.tableName);

              return (
                <div 
                  key={t.tableId} 
                  id={`table-tree-node-${t.tableName}`}
                  className="border border-slate-100 rounded-xl overflow-hidden transition-all hover:border-slate-200 bg-white"
                >
                  {/* Table Row Header */}
                  <div 
                    onClick={() => toggleTableExpand(t.tableId)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer select-none transition-colors ${
                      isExpanded ? 'bg-slate-50/60' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-emerald-600 opacity-80" />
                        <span className="font-display font-bold text-slate-800 text-sm">{t.tableName}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                        {t.schemaName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        Cột: {tableCols.length} • Ràng buộc: {tableRels.length}
                      </span>
                    </div>
                  </div>

                  {/* Table Body - Columns and descriptions */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-50 bg-slate-50/10 space-y-4 animate-fade-in">
                      
                      {/* Summary description */}
                      {t.description && (
                        <div className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{t.description}</p>
                        </div>
                      )}

                      {/* Column Grid list */}
                      <div className="space-y-1.5 pl-6">
                        <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 mb-2 font-mono">
                          <span className="col-span-4">Tên thuộc tính/Cột</span>
                          <span className="col-span-3">Kiểu dữ liệu</span>
                          <span className="col-span-2">Chứa Null?</span>
                          <span className="col-span-3 text-right">Ràng buộc</span>
                        </div>

                        {tableCols.map((c) => {
                          const colQueryMatch = searchColumnQuery.trim() && c.columnName.toLowerCase().includes(searchColumnQuery.toLowerCase());
                          return (
                            <div 
                              key={c.columnId}
                              className={`grid grid-cols-12 gap-1 py-1.5 text-xs font-semibold items-center border-b border-slate-50/50 ${
                                colQueryMatch ? 'bg-amber-50 text-amber-900 rounded px-1' : 'text-slate-600'
                              }`}
                            >
                              {/* Name */}
                              <div className="col-span-4 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span className="font-semibold text-slate-800">{c.columnName}</span>
                              </div>
                              
                              {/* Data type */}
                              <span className="col-span-3 font-mono text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded w-fit">
                                {c.dataType}
                                {c.length ? `(${c.length})` : ''}
                              </span>

                              {/* Nullable */}
                              <span className={`col-span-2 text-[10px] font-mono ${c.isNullable ? 'text-slate-400 font-normal' : 'text-slate-700 font-bold'}`}>
                                {c.isNullable ? 'Có' : 'Bắt buộc'}
                              </span>

                              {/* Keys/constraints */}
                              <div className="col-span-3 flex items-center gap-1 justify-end">
                                {c.isPrimaryKey && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                    <Key className="w-2.5 h-2.5 text-amber-600" /> PK
                                  </span>
                                )}
                                {c.isForeignKey && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                    <Link className="w-2.5 h-2.5 text-blue-600" /> FK
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
