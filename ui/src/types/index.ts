// ============================================
// 全局 TypeScript 类型定义
// ============================================

// --- 通用 API 响应 ---
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
}

// --- 认证 ---
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  name: string
  role: string
  token: string
}

export interface UserInfo {
  name: string
  role: string
  token: string
}

// --- 仪表盘 ---
export interface DashboardSummary {
  totalOrders: number
  totalSales: number
  averageOrderAmount: number
  totalStock: number
  shortageCount: number
  delayedShipments: number
  openRisks: number
  totalCost: number
  supplierScoreAvg: number
}

export interface SalesTrendItem {
  date: string
  amount: number
  quantity?: number
}

export interface CostTrendItem {
  date: string
  totalCost: number
  purchaseCost: number
}

export interface RiskDistItem {
  level: string
  count: number
}

export interface RecentOrder {
  orderId: string
  date: string
  amount: number
}

export interface RecordCounts {
  [key: string]: number
}

export interface InventoryAlertItem {
  id?: string
  productId?: string
  productName: string
  warehouseId?: string
  warehouseName: string
  currentStock: number
  safetyStock?: number
  maxStock?: number
  stockGap?: number
  fillRate?: number
  unitCost?: number
  lastUpdate?: string
  stockStatus?: 'healthy' | 'shortage' | 'overstock' | 'warning' | 'danger'
  stockStatusLabel?: string
  status?: string
}

export interface TopSupplierItem {
  supplierId: string
  supplierName: string
  region: string
  compositeScore: number
  riskLevel?: 'low' | 'medium' | 'high'
  riskLabel?: string
}

export interface DashboardOverview {
  salesTrend: SalesTrendItem[]
  inventoryAlerts: InventoryAlertItem[]
  topSuppliers: TopSupplierItem[]
  delayedRoutes?: LogisticsItem[]
  costTrend?: CostTrendItem[]
  riskDistribution: RiskDistItem[]
  recentOrders: RecentOrder[]
  recordCounts?: RecordCounts
}

// --- 库存 ---
export interface InventoryItem {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  currentStock: number
  safetyStock: number
  maxStock: number
  stockGap: number
  fillRate: number
  unitCost: number
  lastUpdate: string
  stockStatus: 'healthy' | 'shortage' | 'overstock' | 'warning'
  stockStatusLabel: string
}

// --- 供应商 ---
export interface SupplierItem {
  id: string
  supplierId: string
  supplierName: string
  region: string
  onTimeRate: number
  qualityRate: number
  priceStability: number
  responseScore: number
  cooperationYears: number
  compositeScore: number
  riskLevel: 'low' | 'medium' | 'high'
  riskLabel: string
  totalGmv: number
  totalUnits: number
  productCount: number
}

// --- 物流 ---
export interface LogisticsItem {
  shipmentId: string
  orderId: string
  routeName: string
  origin: string
  destination: string
  carrier: string
  expectedHours: number
  actualHours: number
  delayHours: number
  status: string
  statusLabel: string
  transportCost: number
}

// --- 成本 ---
export interface CostItem {
  date: string
  productId: string
  productName: string
  purchaseCost: number
  storageCost: number
  transportCost: number
  returnCost: number
  totalCost: number
}

// --- 风险 ---
export interface RiskItem {
  riskId: string
  riskType: string
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'
  riskLevelLabel: string
  relatedObject: string
  description: string
  suggestion: string
  status: 'open' | 'resolved' | 'monitoring'
  statusLabel: string
  createdAt: string
}

// --- 运营快照 ---
export interface OperationsSnapshot {
  inventory: InventoryItem[]
  suppliers: SupplierItem[]
  logistics: LogisticsItem[]
  costs: CostItem[]
}

// --- 数据中心 ---
export type EntityType = 'orders' | 'inventory' | 'suppliers' | 'logistics' | 'costs' | 'risks'

export interface SchemaField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date'
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface EntitySchema {
  [entity: string]: {
    fields: SchemaField[]
  }
}

// --- AI 助手 ---
export interface ChatRequest {
  question: string
}

export interface ChatEvidence {
  type: string
  object: string
  value: unknown
}

export interface ChatResponse {
  answer: string
  summary: string[]
  suggestions: string[]
  evidence: ChatEvidence[]
  charts: unknown[]
  metadata: {
    mode: string
    model?: string
    reason?: string
  }
}

// --- AI 分析 ---
export interface ForecastRequest {
  product_id: string
  product_name?: string
}

export interface ForecastResponse {
  product_id: string
  product_name?: string
  forecast_demand_7d: number
  forecast_demand_30d?: number
  confidence: 'low' | 'medium' | 'high'
  trend: 'up' | 'down' | 'stable' | 'unknown' | 'upward'
  analysis: string
  metadata?: { mode: string; method: string }
}

export interface AnomalyRequest {
  data_type: string
  data?: Record<string, unknown>[]
}

export interface AnomalyItem {
  index?: number
  severity?: 'high' | 'medium' | 'low'
  description?: string
  field: string
  expected?: number
  actual?: number
  reason?: string
  desc?: string
}

export interface AnomalyResponse {
  data_type: string
  total_records: number
  anomalies: AnomalyItem[]
  summary: string
  metadata?: { mode: string; method: string }
}

export interface RiskScoreRequest {
  supplier_id: string
  supplier_name?: string
  metrics?: {
    on_time_rate: number
    quality_rate: number
    price_stability: number
    response_score: number
  }
}

export interface RiskScoreResponse {
  supplier_id: string
  supplier_name?: string
  score: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  breakdown?: {
    on_time_rate: number
    quality_rate: number
    price_stability: number
    response_score: number
  }
  recommendations: string[]
  metadata?: { mode: string; method: string }
}

export interface AiHealthData {
  online: boolean
  status?: string
  service?: string
  llm_enabled?: boolean
  model?: string
  error?: string
}
