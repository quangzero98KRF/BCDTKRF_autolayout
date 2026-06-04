export type DatabaseType = 'MySQL' | 'PostgreSQL' | 'BigQuery';

export interface DatabaseConnection {
  connectionId: string;
  connectionName: string;
  description: string;
  databaseType: DatabaseType;
  
  // relational settings
  host?: string;
  port?: number;
  databaseName?: string;
  username?: string;
  password?: string; // stored security in production, masked here
  
  // BigQuery settings
  projectId?: string;
  dataset?: string;
  serviceAccountFile?: string; // JSON contents filename or contents
  
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface SchemaTable {
  tableId: string;
  connectionId: string;
  tableName: string;
  schemaName: string;
  description: string;
}

export interface SchemaColumn {
  columnId: string;
  tableId: string;
  columnName: string;
  dataType: string;
  length?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface SchemaRelationship {
  relationshipId: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export type DashboardStatus = 'Draft' | 'Published';

export interface Dashboard {
  dashboardId: string;
  dashboardName: string;
  description: string;
  connectionId: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  status: DashboardStatus;
}

export interface DashboardVersion {
  versionId: string;
  dashboardId: string;
  versionNumber: number;
  layoutJson: string; // DashboardWidget[] serialized
  createdDate: string;
}

export type WidgetType = 'KPI' | 'Chart_Bar' | 'Chart_Line' | 'Chart_Pie' | 'Chart_Donut' | 'Table' | 'Filter';

export interface WidgetConfig {
  title: string;
  datasetTable: string; // The selected table name
  
  // KPI Config
  measureColumn?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  
  // Chart Config
  dimensionColumn?: string; // For x-axis or slices
  chartColor?: string;
  sortOrder?: 'ASC' | 'DESC' | 'None';
  
  // Table Widget Config
  tableColumns?: string[]; // Selected columns to display
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  
  // Filter Config
  filterType?: 'Date' | 'Dropdown' | 'MultiSelect';
  filterColumn?: string;
  filterDefaultValue?: string;
}

export interface DashboardWidget {
  widgetId: string;
  dashboardId: string;
  widgetType: WidgetType;
  positionX: number; // grid coordinates (0-11)
  positionY: number; // row index
  width: number;     // columns width (1-12)
  height: number;    // row height units
  config: WidgetConfig;
}

export interface GlobalFilterState {
  [columnName: string]: string | string[] | { start: string; end: string } | null;
}

export interface QueryRequest {
  connectionId: string;
  tableName: string;
  widgetType: WidgetType;
  measureColumn?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  dimensionColumn?: string;
  filters?: {
    columnName: string;
    value: any;
    operator: string;
  }[];
  tableColumns?: string[];
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  totalCount?: number;
  sqlQuery: string; // Dynamic SQL generated
}
