import { 
  SchemaTable, 
  SchemaColumn, 
  SchemaRelationship, 
  QueryRequest, 
  QueryResult 
} from '../types';

export interface FiFinalBcdtRow {
  id: number;
  ngay: string;
  ma_don_hang: string;
  khach_hang: string;
  loai_khach_hang: string;
  san_pham: string;
  nhom_san_pham: string;
  so_luong: number;
  don_gia: number;
  doanh_thu: number;
  giam_gia: number;
  doanh_thu_thuan: number;
  gia_von: number;
  loi_nhuan: number;
  khu_vuc: string;
  nhan_vien: string;
  trang_thai: string;
}

class MockDatabase {
  fi_final_bcdt: FiFinalBcdtRow[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Products dataset for billing simulations
    const vProducts = [
      { name: 'Laptop ThinkPad X1 Carbon Gen 11', category: 'Thiết bị IT', price: 35000000, cost: 26000000 },
      { name: 'MacBook Pro 14 M3 Max', category: 'Thiết bị IT', price: 42000000, cost: 32005000 },
      { name: 'Màn hình Dell UltraSharp 27 U2723QE', category: 'Phụ kiện', price: 8500000, cost: 5800000 },
      { name: 'Bàn phím cơ Keychron Q1 Pro', category: 'Phụ kiện', price: 3800000, cost: 2400000 },
      { name: 'Chuột không dây Logitech MX Master 3S', category: 'Phụ kiện', price: 2600000, cost: 1700000 },
      { name: 'Tai nghe chụp tai Sony WH-1000XM5', category: 'Phụ kiện', price: 6900000, cost: 4800000 },
      { name: 'Máy in laser đen trắng Canon LBP2900', category: 'Thiết bị văn phòng', price: 3200000, cost: 2100000 },
      { name: 'Router Wifi Asus ROG AX5400', category: 'Mạng máy tính', price: 4500000, cost: 3000000 },
      { name: 'Ghế xoay Ergonomic Herman Miller Aeron', category: 'Thiết bị văn phòng', price: 18000000, cost: 12000000 },
      { name: 'Bảng vẽ điện tử thông minh Wacom Intuos', category: 'Thiết bị văn phòng', price: 2900000, cost: 1800000 }
    ];

    const vCustomers = [
      { name: 'Tập đoàn Vingroup', segment: 'Doanh nghiệp lớn' },
      { name: 'Công ty Cổ phần FPT', segment: 'Doanh nghiệp lớn' },
      { name: 'Công ty Cổ phần Thế Giới Di Động', segment: 'Doanh nghiệp lớn' },
      { name: 'Tổng công ty Viettel', segment: 'Doanh nghiệp lớn' },
      { name: 'Ngân hàng Thương mại Cổ phần ACB', segment: 'Doanh nghiệp lớn' },
      { name: 'Ngân hàng Thương mại Cổ phần Techcombank', segment: 'Doanh nghiệp lớn' },
      { name: 'Công ty Shopee Việt Nam', segment: 'Doanh nghiệp lớn' },
      { name: 'Công ty Grab Việt Nam', segment: 'Doanh nghiệp lớn' },
      { name: 'Cửa hàng Máy tính Minh Trí', segment: 'Doanh nghiệp SME' },
      { name: 'Cửa hàng Thiết bị Kỹ thuật Á Đông', segment: 'Doanh nghiệp SME' },
      { name: 'Khách hàng cá nhân - Nguyễn Tuấn', segment: 'Khách hàng cá nhân' },
      { name: 'Khách hàng cá nhân - Trần Thị Mai', segment: 'Khách hàng cá nhân' },
      { name: 'Khách hàng cá nhân - Lê Hoàng Nam', segment: 'Khách hàng cá nhân' },
      { name: 'Khách hàng cá nhân - Phạm Hồng Hải', segment: 'Khách hàng cá nhân' }
    ];

    const vRegions = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
    const vSalespersons = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Văn D', 'Nguyễn Thị E'];
    const vStatuses = ['Đã hoàn thành', 'Chờ xử lý', 'Đã hủy'];

    let initialId = 1000;
    const years = [2024, 2025, 2026];
    
    // Generate 450 items of Vietnamese Sales Revenue data
    for (let i = 0; i < 450; i++) {
      initialId++;
      const prod = vProducts[Math.floor(Math.random() * vProducts.length)];
      const cust = vCustomers[Math.floor(Math.random() * vCustomers.length)];
      const region = vRegions[Math.floor(Math.random() * vRegions.length)];
      const sp = vSalespersons[Math.floor(Math.random() * vSalespersons.length)];
      
      // Overwhelmingly completed
      const status = Math.random() > 0.08 ? vStatuses[0] : vStatuses[Math.floor(Math.random() * vStatuses.length)];
      
      const year = years[Math.floor(Math.random() * years.length)];
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const qty = Math.floor(Math.random() * 6) + 1;
      const grossRevenue = qty * prod.price;
      const discount = Math.random() > 0.75 ? Math.round(grossRevenue * 0.05) : 0;
      const netRevenue = grossRevenue - discount;
      const totalCost = qty * prod.cost;
      const profit = netRevenue - totalCost;

      this.fi_final_bcdt.push({
        id: initialId,
        ngay: dateStr,
        ma_don_hang: `DH-${initialId}`,
        khach_hang: cust.name,
        loai_khach_hang: cust.segment,
        san_pham: prod.name,
        nhom_san_pham: prod.category,
        so_luong: qty,
        don_gia: prod.price,
        doanh_thu: grossRevenue,
        giam_gia: discount,
        doanh_thu_thuan: netRevenue,
        gia_von: totalCost,
        loi_nhuan: profit,
        khu_vuc: region,
        nhan_vien: sp,
        trang_thai: status
      });
    }
  }

  // Schema Metadata Generation for dynamic User-Created Connections
  public getSchema(connectionId: string): { 
    tables: SchemaTable[], 
    columns: SchemaColumn[], 
    relationships: SchemaRelationship[] 
  } {
    // Generate the user's specific billing table "fi_final_bcdt" with columns
    const columnsConfig = [
      { name: 'id', type: 'INTEGER', isPK: true, isFK: false, nullable: false },
      { name: 'ngay', type: 'DATE', isPK: false, isFK: false, nullable: false },
      { name: 'ma_don_hang', type: 'VARCHAR', len: 50, isPK: false, isFK: false, nullable: false },
      { name: 'khach_hang', type: 'VARCHAR', len: 200, isPK: false, isFK: false, nullable: false },
      { name: 'loai_khach_hang', type: 'VARCHAR', len: 100, isPK: false, isFK: false, nullable: true },
      { name: 'san_pham', type: 'VARCHAR', len: 200, isPK: false, isFK: false, nullable: false },
      { name: 'nhom_san_pham', type: 'VARCHAR', len: 100, isPK: false, isFK: false, nullable: true },
      { name: 'so_luong', type: 'INTEGER', isPK: false, isFK: false, nullable: false },
      { name: 'don_gia', type: 'DECIMAL', isPK: false, isFK: false, nullable: false },
      { name: 'doanh_thu', type: 'DECIMAL', isPK: false, isFK: false, nullable: false },
      { name: 'giam_gia', type: 'DECIMAL', isPK: false, isFK: false, nullable: true },
      { name: 'doanh_thu_thuan', type: 'DECIMAL', isPK: false, isFK: false, nullable: false },
      { name: 'gia_von', type: 'DECIMAL', isPK: false, isFK: false, nullable: false },
      { name: 'loi_nhuan', type: 'DECIMAL', isPK: false, isFK: false, nullable: false },
      { name: 'khu_vuc', type: 'VARCHAR', len: 50, isPK: false, isFK: false, nullable: true },
      { name: 'nhan_vien', type: 'VARCHAR', len: 100, isPK: false, isFK: false, nullable: true },
      { name: 'trang_thai', type: 'VARCHAR', len: 50, isPK: false, isFK: false, nullable: false }
    ];

    const tables: SchemaTable[] = [];
    const columns: SchemaColumn[] = [];
    const relationships: SchemaRelationship[] = [];

    const tableId = `tbl-${connectionId}-fi_final_bcdt`;
    
    tables.push({
      tableId,
      connectionId,
      tableName: 'fi_final_bcdt',
      schemaName: 'public',
      description: 'Bảng dữ liệu báo cáo doanh thu tài chính (fi_final_bcdt) của hệ thống KRF bao gồm các chỉ số doanh thu gộp, giá vốn và lợi nhuận.'
    });

    columnsConfig.forEach((col, cIdx) => {
      columns.push({
        columnId: `col-${tableId}-${cIdx + 1}`,
        tableId,
        columnName: col.name,
        dataType: col.type,
        length: col.len,
        isNullable: col.nullable,
        isPrimaryKey: col.isPK,
        isForeignKey: col.isFK
      });
    });

    return { tables, columns, relationships };
  }

  // Analytical query execution. Translates a requested BI Widget state into data rows & SQL
  public runQuery(req: QueryRequest): QueryResult {
    const { tableName, widgetType, measureColumn, aggregation, dimensionColumn, filters, tableColumns, sortColumn, sortDirection, limit, page } = req;
    
    // Select correct table data
    let originalList: any[] = [];
    if (tableName === 'fi_final_bcdt') {
      originalList = [...this.fi_final_bcdt];
    } else {
      // Return fi_final_bcdt as general fallback to avoid empty screens
      originalList = [...this.fi_final_bcdt];
    }

    // Apply Filter state
    let filteredList = originalList.filter(row => {
      if (!filters || filters.length === 0) return true;
      for (const f of filters) {
        const val = row[f.columnName];
        if (val === undefined) continue;

        if (f.operator === 'between' && Array.isArray(f.value)) {
          const rowDate = new Date(val).getTime();
          const start = new Date(f.value[0]).getTime();
          const end = new Date(f.value[1]).getTime();
          if (rowDate < start || rowDate > end) return false;
        } else if (f.operator === 'in' && Array.isArray(f.value)) {
          if (f.value.length > 0 && !f.value.includes(val)) return false;
        } else if (f.operator === 'equals') {
          if (f.value !== null && f.value !== '' && String(val).toLowerCase() !== String(f.value).toLowerCase()) return false;
        }
      }
      return true;
    });

    // Generate accurate readable SQL string
    let sqlQuery = '';
    const selectCols: string[] = [];
    let whereClauses: string[] = [];
    let sqlGroup = '';
    let sqlOrder = '';

    if (filters && filters.length > 0) {
      filters.forEach(f => {
        if (f.operator === 'between' && Array.isArray(f.value)) {
          whereClauses.push(`${f.columnName} BETWEEN '${f.value[0]}' AND '${f.value[1]}'`);
        } else if (f.operator === 'in' && Array.isArray(f.value)) {
          if (f.value.length > 0) {
            const listStr = f.value.map(v => `'${v}'`).join(', ');
            whereClauses.push(`${f.columnName} IN (${listStr})`);
          }
        } else if (f.operator === 'equals' && f.value !== null && f.value !== '') {
          whereClauses.push(`${f.columnName} = '${f.value}'`);
        }
      });
    }

    const whereStr = whereClauses.length > 0 ? `\nWHERE ${whereClauses.join(' AND ')}` : '';

    if (widgetType === 'KPI') {
      const agg = aggregation || 'COUNT';
      const mCol = measureColumn || '*';
      selectCols.push(`${agg}(${mCol}) AS value`);
      sqlQuery = `SELECT ${selectCols.join(', ')}\nFROM ${tableName}${whereStr};`;

      // Aggregate single KPI Value
      let value = 0;
      if (filteredList.length > 0) {
        const numericValues = filteredList
          .map(r => Number(r[mCol]) || 0)
          .filter(v => !isNaN(v));

        if (agg === 'COUNT') {
          value = filteredList.length;
        } else if (agg === 'SUM') {
          value = numericValues.reduce((sum, v) => sum + v, 0);
        } else if (agg === 'AVG') {
          const sum = numericValues.reduce((sum, v) => sum + v, 0);
          value = sum / (numericValues.length || 1);
        } else if (agg === 'MIN') {
          value = Math.min(...numericValues);
        } else if (agg === 'MAX') {
          value = Math.max(...numericValues);
        }
      }
      return {
        columns: ['value'],
        rows: [{ value: Math.round(value * 100) / 100 }],
        sqlQuery
      };
    }

    // Charts rendering query logic
    if (widgetType.startsWith('Chart_')) {
      const dim = dimensionColumn || 'khu_vuc';
      const agg = aggregation || 'SUM';
      const mCol = measureColumn || 'doanh_thu_thuan';

      selectCols.push(dim);
      selectCols.push(`${agg}(${mCol}) AS measure`);
      
      sqlGroup = `\nGROUP BY ${dim}`;
      
      const sDir = sortDirection || 'DESC';
      sqlOrder = `\nORDER BY measure ${sDir}`;

      sqlQuery = `SELECT ${selectCols.join(', ')}\nFROM ${tableName}${whereStr}${sqlGroup}${sqlOrder};`;

      const groups: Record<string, number[]> = {};
      filteredList.forEach(row => {
        let dimVal = row[dim];
        const key = String(dimVal || 'Chưa phân loại');
        if (!groups[key]) groups[key] = [];
        groups[key].push(Number(row[mCol]) || 0);
      });

      const aggregatedRows = Object.keys(groups).map(key => {
        const values = groups[key];
        let val = 0;
        if (agg === 'COUNT') {
          val = values.length;
        } else if (agg === 'SUM') {
          val = values.reduce((s, v) => s + v, 0);
        } else if (agg === 'AVG') {
          val = values.reduce((s, v) => s + v, 0) / (values.length || 1);
        } else if (agg === 'MIN') {
          val = Math.min(...values);
        } else if (agg === 'MAX') {
          val = Math.max(...values);
        }
        return {
          dimension: key,
          measure: Math.round(val * 100) / 100
        };
      });

      // Sort outcomes
      const sorted = aggregatedRows.sort((a, b) => {
        if (sortDirection === 'ASC') {
          return a.measure - b.measure;
        } else {
          return b.measure - a.measure;
        }
      });

      return {
        columns: ['dimension', 'measure'],
        rows: sorted.slice(0, 15),
        sqlQuery
      };
    }

    // Detailed transaction table queries
    const targetCols = tableColumns && tableColumns.length > 0 
      ? tableColumns 
      : Object.keys(originalList[0] || {});

    const sCol = sortColumn || targetCols[0] || 'id';
    const sDir = sortDirection || 'DESC';
    const lVal = limit || 10;
    const pVal = page || 1;

    sqlQuery = `SELECT ${targetCols.join(', ')}\nFROM ${tableName}${whereStr}\nORDER BY ${sCol} ${sDir}\nLIMIT ${lVal} OFFSET ${(pVal - 1) * lVal};`;

    const sortedDetails = [...filteredList].sort((a, b) => {
      const valA = a[sCol];
      const valB = b[sCol];
      if (valA === undefined || valB === undefined) return 0;
      
      const comparison = String(valA).localeCompare(String(valB), undefined, {numeric: true, sensitivity: 'base'});
      return sDir === 'ASC' ? comparison : -comparison;
    });

    const totalCount = sortedDetails.length;
    const startIdx = (pVal - 1) * lVal;
    const paginated = sortedDetails.slice(startIdx, startIdx + lVal);

    const structuredRows = paginated.map(row => {
      const pruned: Record<string, any> = {};
      targetCols.forEach(c => {
        pruned[c] = row[c];
      });
      return pruned;
    });

    return {
      columns: targetCols,
      rows: structuredRows,
      totalCount,
      sqlQuery
    };
  }
}

export const mockDatabase = new MockDatabase();
