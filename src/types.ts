export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type HealthStatus = 'healthy' | 'attention' | 'critical';

// Operational Modules
export type OOMSModule = 'Correspondence' | 'Subscriptions' | 'Inventory' | 'Fuel' | 'Printer' | 'Printers' | 'Documents';

export interface PrinterAlertDTO {
  id: string;
  printerId: string;
  type: string;
  message: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

export interface PrinterUsageMetricDTO {
  id: string;
  printerId: string;
  pagesPrinted: number;
  pagesColor: number;
  pagesMono: number;
  timestamp: string;
}

export interface KPIStats {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  icon: string; // Dynamic icon name (Lucide)
  description: string;
}

export interface ActionAlert {
  id: string;
  severity: Severity;
  module: OOMSModule;
  message: string;
  date: string;
  actionLabel: string;
  actionType: string;
}

export interface ExecutiveInsight {
  id: string;
  insight: string;
  category: 'efficiency' | 'cost' | 'risk' | 'operations';
  impact: 'high' | 'medium' | 'low';
  generatedTime: string;
  details?: string;
}

export interface ModuleHealth {
  name: OOMSModule;
  score: number;
  status: HealthStatus;
  lastChecked: string;
  description: string;
}

export interface UpcomingTask {
  id: string;
  task: string;
  dueDate: string;
  owner: string;
  module: OOMSModule;
  priority: Severity;
  status: 'pending' | 'completed' | 'in-progress';
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  module: OOMSModule;
  timestamp: string;
}

// Module schemas representing the 10,000+ total database rows
export interface CorrespondenceRecord {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  subject: string;
  status: 'In Transit' | 'Delivered' | 'Returned' | 'Processing';
  type: 'Incoming' | 'Outgoing';
  date: string;
  department: string;
  location: string;
}

export interface SubscriptionRecord {
  id: string;
  serviceName: string;
  provider: string;
  cost: number;
  status: 'Active' | 'Expiring' | 'Expired' | 'Suspended';
  dueDate: string;
  billingCycle: 'Monthly' | 'Annual';
  department: string;
  owner: string;
  autoRenew: boolean;
}

export interface InventoryRecord {
  id: string;
  itemName: string;
  sku: string;
  category: 'Office Supplies' | 'Hardware' | 'Breakroom' | 'Cleaning';
  stock: number;
  minThreshold: number;
  unit: string;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface FuelLogRecord {
  id: string;
  vehiclePlate: string;
  vehicleType: string;
  driver: string;
  liters: number;
  totalCost: number;
  date: string;
  location: string;
  vendor: string;
}

export interface PrinterRecord {
  id: string;
  printerName: string;
  name: string;
  vendor: string;
  model: string;
  department: string;
  departmentId?: string;
  ipAddress: string;
  location: string;
  serialNumber: string;
  status: 'Online' | 'Offline' | 'Low Toner' | 'Paper Jam';
  pagesPrintedMonth: number;
  createdAt?: string;
  updatedAt?: string;
  paperLevel?: number;
  tonerLevel: number;
  drumLife?: number;
  maintenanceKitLife?: number;
  pagesPrinted?: number;
  dailyPages?: number;
  monthlyPages?: number;
  alerts?: PrinterAlertDTO[];
  usageMetrics?: PrinterUsageMetricDTO[];
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  sizeKb: number;
  category: 'Contract' | 'Invoice' | 'Policy' | 'Manual' | 'Confidential';
  classification: 'Public' | 'Restricted' | 'Internal';
  uploadedBy: string;
  uploadedAt: string;
  status: 'Approved' | 'Pending Review' | 'Flagged';
}

export interface DashboardSummary {
  kpis: KPIStats[];
  moduleHealth: ModuleHealth[];
  actionsRequired: ActionAlert[];
  executiveInsights: ExecutiveInsight[];
  recentActivities: ActivityLog[];
  upcomingTasks: UpcomingTask[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
