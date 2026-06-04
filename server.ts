import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { mockDatabase } from './src/data/mockDatabase';
import { 
  DatabaseConnection, 
  SchemaTable, 
  SchemaColumn, 
  SchemaRelationship, 
  Dashboard, 
  DashboardWidget, 
  DashboardVersion,
  QueryRequest 
} from './src/types';

// Establish a full-stack configuration
const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database storage filepath
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppStore {
  connections: DatabaseConnection[];
  tables: SchemaTable[];
  columns: SchemaColumn[];
  relationships: SchemaRelationship[];
  dashboards: Dashboard[];
  widgets: DashboardWidget[];
  versions: DashboardVersion[];
}

const DEFAULT_STORE: AppStore = {
  connections: [],
  tables: [],
  columns: [],
  relationships: [],
  dashboards: [
    {
      dashboardId: 'dash-1',
      dashboardName: 'Báo cáo Doanh thu (KRF)',
      description: 'Báo cáo tổng quan về doanh thu bán hàng, lợi nhuận gộp, giá vốn theo các sản phẩm, vùng miền và nhóm khách hàng từ bảng fi_final_bcdt.',
      connectionId: '',
      createdBy: 'quangzero98@gmail.com',
      createdDate: new Date('2026-06-02T12:00:00Z').toISOString(),
      updatedDate: new Date('2026-06-02T12:00:00Z').toISOString(),
      status: 'Published'
    }
  ],
  widgets: [
    // KPIs for Báo cáo doanh thu (fi_final_bcdt)
    {
      widgetId: 'w-1',
      dashboardId: 'dash-1',
      widgetType: 'KPI',
      positionX: 0,
      positionY: 0,
      width: 4,
      height: 2,
      config: {
        title: 'Doanh Thu Thuần (VND)',
        datasetTable: 'fi_final_bcdt',
        measureColumn: 'doanh_thu_thuan',
        aggregation: 'SUM'
      }
    },
    {
      widgetId: 'w-2',
      dashboardId: 'dash-1',
      widgetType: 'KPI',
      positionX: 4,
      positionY: 0,
      width: 4,
      height: 2,
      config: {
        title: 'Lợi Nhuận Gộp (VND)',
        datasetTable: 'fi_final_bcdt',
        measureColumn: 'loi_nhuan',
        aggregation: 'SUM'
      }
    },
    {
      widgetId: 'w-3',
      dashboardId: 'dash-1',
      widgetType: 'KPI',
      positionX: 8,
      positionY: 0,
      width: 4,
      height: 2,
      config: {
        title: 'Tổng Đơn Hàng (Đơn)',
        datasetTable: 'fi_final_bcdt',
        measureColumn: 'ma_don_hang',
        aggregation: 'COUNT'
      }
    },
    // Charts for Báo cáo doanh thu
    {
      widgetId: 'w-4',
      dashboardId: 'dash-1',
      widgetType: 'Chart_Bar',
      positionX: 0,
      positionY: 2,
      width: 6,
      height: 4,
      config: {
        title: 'Cơ Cấu Doanh Thu Theo Nhóm Sản Phẩm',
        datasetTable: 'fi_final_bcdt',
        dimensionColumn: 'nhom_san_pham',
        measureColumn: 'doanh_thu_thuan',
        aggregation: 'SUM',
        chartColor: '#3b82f6',
        sortOrder: 'DESC'
      }
    },
    {
      widgetId: 'w-5',
      dashboardId: 'dash-1',
      widgetType: 'Chart_Line',
      positionX: 6,
      positionY: 2,
      width: 6,
      height: 4,
      config: {
        title: 'Biến Động Doanh Thu Theo Thời Gian (Ngày)',
        datasetTable: 'fi_final_bcdt',
        dimensionColumn: 'ngay',
        measureColumn: 'doanh_thu_thuan',
        aggregation: 'SUM',
        chartColor: '#10b981',
        sortOrder: 'ASC'
      }
    },
    // Filters
    {
      widgetId: 'w-6',
      dashboardId: 'dash-1',
      widgetType: 'Filter',
      positionX: 0,
      positionY: 6,
      width: 4,
      height: 1.5,
      config: {
        title: 'Lọc Theo Khu Vực',
        datasetTable: 'fi_final_bcdt',
        filterType: 'Dropdown',
        filterColumn: 'khu_vuc'
      }
    },
    {
      widgetId: 'w-7',
      dashboardId: 'dash-1',
      widgetType: 'Filter',
      positionX: 4,
      positionY: 6,
      width: 4,
      height: 1.5,
      config: {
        title: 'Lọc Theo Trạng Thái',
        datasetTable: 'fi_final_bcdt',
        filterType: 'MultiSelect',
        filterColumn: 'trang_thai'
      }
    },
    // Transaction Table
    {
      widgetId: 'w-8',
      dashboardId: 'dash-1',
      widgetType: 'Table',
      positionX: 0,
      positionY: 7.5,
      width: 12,
      height: 5,
      config: {
        title: 'Nhật Ký Giao Dịch Doanh Thu Chi Tiết (KRF Log)',
        datasetTable: 'fi_final_bcdt',
        tableColumns: ['ma_don_hang', 'ngay', 'khach_hang', 'san_pham', 'so_luong', 'doanh_thu_thuan', 'trang_thai'],
        pageSize: 10,
        sortBy: 'ngay',
        sortDirection: 'DESC'
      }
    }
  ],
  versions: []
};

// Read-Write store wrapper
function readStore(): AppStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading JSON store, initializing backup store:', err);
  }
  
  // Write default store
  writeStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

function writeStore(store: AppStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write JSON store:', err);
  }
}

// Ensure first-time persistence boot
readStore();


// API ENDPOINTS

// 1. Database Connections
app.get('/api/connections', (req, res) => {
  const store = readStore();
  res.json(store.connections);
});

app.post('/api/connections', (req, res) => {
  const store = readStore();
  const conn: Partial<DatabaseConnection> = req.body;
  
  const newConn: DatabaseConnection = {
    connectionId: `conn-${Date.now()}`,
    connectionName: conn.connectionName || 'New Cloud SQL Link',
    description: conn.description || '',
    databaseType: conn.databaseType || 'PostgreSQL',
    host: conn.host,
    port: conn.port ? Number(conn.port) : undefined,
    databaseName: conn.databaseName,
    username: conn.username,
    password: conn.password,
    projectId: conn.projectId,
    dataset: conn.dataset,
    serviceAccountFile: conn.serviceAccountFile,
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  };

  store.connections.push(newConn);
  writeStore(store);
  res.status(201).json(newConn);
});

app.put('/api/connections/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const connIdx = store.connections.findIndex(c => c.connectionId === id);

  if (connIdx === -1) {
    return res.status(404).json({ error: 'Connection record not found' });
  }

  const updated: DatabaseConnection = {
    ...store.connections[connIdx],
    ...req.body,
    updatedDate: new Date().toISOString()
  };

  store.connections[connIdx] = updated;
  writeStore(store);
  res.json(updated);
});

app.delete('/api/connections/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const originalLength = store.connections.length;
  
  store.connections = store.connections.filter(c => c.connectionId !== id);
  
  // Clean up associated schemas
  store.tables = store.tables.filter(t => t.connectionId !== id);
  // Column table ids are tbl-id-...
  store.columns = store.columns.filter(c => !c.tableId.includes(`-${id}-`));

  if (store.connections.length === originalLength) {
    return res.status(404).json({ error: 'Connection record not found' });
  }

  writeStore(store);
  res.json({ success: true, message: 'Connection and synced schema metadata removed successfully' });
});

app.post('/api/connections/:id/test', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const conn = store.connections.find(c => c.connectionId === id);

  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  // Perform authentic testing simulation
  setTimeout(() => {
    if (conn.databaseType === 'BigQuery' && !conn.projectId) {
      return res.status(400).json({ status: 'Failed', message: 'Project ID and Dataset are required to authenticate Google BigQuery connector' });
    }
    if (conn.databaseType !== 'BigQuery' && !conn.host) {
      return res.status(400).json({ status: 'Failed', message: 'Target database server Host matches are empty or unreachable' });
    }

    res.json({
      status: 'Connected',
      message: `Connection test verified successfully to GCP instance: ${conn.databaseType === 'BigQuery' ? conn.projectId : conn.host}:${conn.port || 'Default'} - Channel Open`
    });
  }, 350);
});

app.post('/api/connections/:id/sync-schema', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const conn = store.connections.find(c => c.connectionId === id);

  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  // Run mock Database schema generation
  const scanned = mockDatabase.getSchema(id);

  // Clear current schema elements for this connection and overwrite
  store.tables = store.tables.filter(t => t.connectionId !== id);
  // Column IDs contain table IDs which contain connection ID
  const tableIdsToRemove = scanned.tables.map(t => t.tableId);
  store.columns = store.columns.filter(col => !tableIdsToRemove.includes(col.tableId));
  store.relationships = store.relationships.filter(rel => {
    // If table exists in scanned, it belongs to this connection
    return !['SalesOrders', 'Customers', 'Products', 'MarketingCampaigns'].includes(rel.sourceTable);
  });

  store.tables.push(...scanned.tables);
  store.columns.push(...scanned.columns);
  store.relationships.push(...scanned.relationships);

  writeStore(store);
  res.json({
    success: true,
    tablesParsed: scanned.tables.length,
    columnsParsed: scanned.columns.length,
    relationshipsParsed: scanned.relationships.length,
    timestamp: new Date().toISOString()
  });
});


// 2. Schema Explorer
app.get('/api/schema/tables', (req, res) => {
  const store = readStore();
  const connectionId = req.query.connectionId as string;
  if (connectionId) {
    res.json(store.tables.filter(t => t.connectionId === connectionId));
  } else {
    res.json(store.tables);
  }
});

app.get('/api/schema/columns', (req, res) => {
  const store = readStore();
  const tableId = req.query.tableId as string;
  if (tableId) {
    res.json(store.columns.filter(c => c.tableId === tableId));
  } else {
    res.json(store.columns);
  }
});

app.get('/api/schema/relationships', (req, res) => {
  const store = readStore();
  res.json(store.relationships);
});


// 3. Dashboards
app.get('/api/dashboards', (req, res) => {
  const store = readStore();
  res.json(store.dashboards);
});

app.post('/api/dashboards', (req, res) => {
  const store = readStore();
  const dash: Partial<Dashboard> = req.body;
  
  const newDash: Dashboard = {
    dashboardId: `dash-${Date.now()}`,
    dashboardName: dash.dashboardName || 'New Dynamic Dashboard',
    description: dash.description || '',
    connectionId: dash.connectionId || (store.connections[0]?.connectionId || ''),
    createdBy: 'quangzero98@gmail.com',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    status: 'Draft'
  };

  store.dashboards.push(newDash);

  // Initialize a few boilerplate widgets if requested or save an empty Canvas
  writeStore(store);
  res.status(201).json(newDash);
});

app.put('/api/dashboards/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const dashIdx = store.dashboards.findIndex(d => d.dashboardId === id);

  if (dashIdx === -1) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }

  const updatedDash: Dashboard = {
    ...store.dashboards[dashIdx],
    ...req.body,
    updatedDate: new Date().toISOString()
  };

  store.dashboards[dashIdx] = updatedDash;

  // Handle saving and incrementing the Version Control if layout or widgets were changed!
  if (req.body.widgets) {
    const updatedWidgets: DashboardWidget[] = req.body.widgets;
    // Wipe old widgets for this dashboard
    store.widgets = store.widgets.filter(w => w.dashboardId !== id);
    // Append updated configurations
    store.widgets.push(...updatedWidgets);

    // Dynamic Version Control setup
    const nextVerNum = (store.versions.filter(v => v.dashboardId === id).length || 0) + 1;
    const miniLayout = updatedWidgets.map(w => ({
      widgetId: w.widgetId,
      positionX: w.positionX,
      positionY: w.positionY,
      width: w.width,
      height: w.height
    }));

    store.versions.push({
      versionId: `ver-${Date.now()}`,
      dashboardId: id,
      versionNumber: nextVerNum,
      layoutJson: JSON.stringify(miniLayout),
      createdDate: new Date().toISOString()
    });
  }

  writeStore(store);
  res.json(updatedDash);
});

app.delete('/api/dashboards/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const originalLength = store.dashboards.length;

  store.dashboards = store.dashboards.filter(d => d.dashboardId !== id);
  store.widgets = store.widgets.filter(w => w.dashboardId !== id);
  store.versions = store.versions.filter(v => v.dashboardId !== id);

  if (store.dashboards.length === originalLength) {
    return res.status(404).json({ error: 'Dashboard Record not found' });
  }

  writeStore(store);
  res.json({ success: true, message: 'Dashboard and all underlying metrics deleted' });
});

app.post('/api/dashboards/:id/publish', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const dash = store.dashboards.find(d => d.dashboardId === id);

  if (!dash) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }

  dash.status = 'Published';
  dash.updatedDate = new Date().toISOString();
  writeStore(store);
  res.json(dash);
});

app.post('/api/dashboards/:id/clone', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const dash = store.dashboards.find(d => d.dashboardId === id);

  if (!dash) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }

  const newId = `dash-${Date.now()}`;
  const clonedDash: Dashboard = {
    ...dash,
    dashboardId: newId,
    dashboardName: `${dash.dashboardName} (Clone)`,
    status: 'Draft',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  };

  // Clone widgets
  const targetWidgets = store.widgets.filter(w => w.dashboardId === id);
  const clonedWidgets = targetWidgets.map(w => ({
    ...w,
    widgetId: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dashboardId: newId
  }));

  store.dashboards.push(clonedDash);
  store.widgets.push(...clonedWidgets);

  // Initialize version v1
  store.versions.push({
    versionId: `ver-${Date.now()}`,
    dashboardId: newId,
    versionNumber: 1,
    layoutJson: JSON.stringify(clonedWidgets.map(cw => ({
      widgetId: cw.widgetId,
      positionX: cw.positionX,
      positionY: cw.positionY,
      width: cw.width,
      height: cw.height
    }))),
    createdDate: new Date().toISOString()
  });

  writeStore(store);
  res.json(clonedDash);
});


// 4. Runtime
app.get('/api/dashboard/:id/layout', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const dash = store.dashboards.find(d => d.dashboardId === id);

  if (!dash) {
    return res.status(404).json({ error: 'Selected dashboard was not found or is restricted' });
  }

  const dashWidgets = store.widgets.filter(w => w.dashboardId === id);
  const dashVersions = store.versions.filter(v => v.dashboardId === id);

  res.json({
    dashboard: dash,
    widgets: dashWidgets,
    versions: dashVersions
  });
});

app.post('/api/dashboard/query', (req, res) => {
  const queryReq: QueryRequest = req.body;
  
  if (!queryReq.tableName) {
    return res.status(400).json({ error: 'TableName is required to route database queries' });
  }

  try {
    const result = mockDatabase.runQuery(queryReq);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'SQL query execution failed', details: error.message });
  }
});

app.post('/api/dashboard/export', (req, res) => {
  const { docName, format, headers, rows } = req.body;

  if (!rows || !headers) {
    return res.status(400).json({ error: 'Payload requires headers and row structures to format downloads' });
  }

  // Return formatted CSV/Plain contents or signal trigger
  let outputText = '';
  if (format === 'csv' || format === 'excel') {
    outputText += headers.join(',') + '\n';
    rows.forEach((r: any) => {
      const line = headers.map((h: string) => {
        let val = r[h];
        if (val === undefined || val === null) return '';
        // Escape commas
        val = String(val).replace(/"/g, '""');
        return val.includes(',') ? `"${val}"` : val;
      });
      outputText += line.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${docName || 'export'}.csv"`);
    return res.send(outputText);
  } else {
    // PDF mockup response
    res.json({
      success: true,
      format,
      message: 'Secure system PDF stream triggered. Download package serialized and prepared.',
      previewText: `PDF Document: ${docName || 'Report'}\nRows count: ${rows.length}\nTimestamp: ${new Date().toISOString()}`
    });
  }
});


// FRONTEND EMBEDDING MIDDLEWARES & STATICS

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Dist staging serve
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Modern Full-Stack BI Client-Server active on http://localhost:${PORT}`);
  });
}

startServer();
