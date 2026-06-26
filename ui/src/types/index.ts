// ============================================
// 全局 TypeScript 类型定义
// ============================================

// --- 通用 API 响应 ---
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
  metadata?: ResponseMetadata & {
    ai?: {
      mode?: string
      model?: string
      reason?: string
    }
    filteredCounts?: Record<string, number>
  }
}

export interface DataQualitySummary {
  status: 'complete' | 'partial' | string
  recordCounts: Record<string, number>
  emptyEntities: string[]
}

export interface ResponseMetadata {
  source: string
  updatedAt: string
  fallbackReason?: string | null
  filters?: Record<string, unknown>
  quality?: DataQualitySummary
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
  metadata?: ResponseMetadata & {
    ai?: {
      mode?: string
      model?: string
      reason?: string
    }
    filteredCounts?: Record<string, number>
  }
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

export interface InventoryStatusItem {
  status: string
  label: string
  count: number
}

export interface SupplierScoreItem {
  supplierId: string
  supplierName: string
  compositeScore: number
  riskLevel?: 'low' | 'medium' | 'high'
  riskLabel?: string
}

export interface CostRankingItem {
  date: string
  productId: string
  productName: string
  purchaseCost: number
  storageCost: number
  transportCost: number
  returnCost: number
  totalCost: number
}

export interface DashboardOverview {
  salesTrend: SalesTrendItem[]
  inventoryAlerts: InventoryAlertItem[]
  topSuppliers: TopSupplierItem[]
  delayedRoutes?: LogisticsItem[]
  costTrend?: CostTrendItem[]
  inventoryStatus?: InventoryStatusItem[]
  supplierScores?: SupplierScoreItem[]
  costRanking?: CostRankingItem[]
  riskDistribution: RiskDistItem[]
  recentOrders: RecentOrder[]
  recordCounts?: RecordCounts
  metadata?: ResponseMetadata
}

export type OverviewMetricKey =
  | 'totalOrders'
  | 'totalSales'
  | 'totalStock'
  | 'openRisks'
  | 'averageOrderAmount'
  | 'shortageCount'
  | 'delayedShipments'
  | 'totalCost'
  | 'supplierScoreAvg'

export type OverviewChartKey =
  | 'salesTrend'
  | 'riskDistribution'
  | 'costTrend'
  | 'delayedRoutes'
  | 'inventoryStatus'
  | 'supplierScores'

export type OverviewTableKey =
  | 'inventoryAlerts'
  | 'topSuppliers'
  | 'recentOrders'
  | 'delayedRoutes'
  | 'costRanking'

export interface OverviewDashboardConfig {
  visibleMetrics: Record<OverviewMetricKey, boolean>
  visibleCharts: Record<OverviewChartKey, boolean>
  visibleTables: Record<OverviewTableKey, boolean>
  compactMode: boolean
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
  brandName?: string
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

export interface RiskCenterAnalysisFilters {
  riskLevel?: string
  status?: string
  scope?: string
}

export interface RiskCenterAnalysisResponse {
  filters: RiskCenterAnalysisFilters
  risks: RiskItem[]
  openRisks: RiskItem[]
  riskStats: Record<'Critical' | 'High' | 'Medium' | 'Low', number>
  anomaly: AnomalyResponse
  supplierRiskScores: RiskScoreResponse[]
  summary: {
    openRisks: number
    anomalyCount: number
    scoredSuppliers: number
    highRiskSuppliers: number
  }
  metadata?: ResponseMetadata & {
    ai?: {
      anomalyMode?: string
      riskScoreModes?: string[]
    }
    cache?: {
      hit: boolean
      key: string
      createdAt: string
      signature: string
    }
  }
}

// --- 运营快照 ---
export interface OperationsSnapshot {
  inventory: InventoryItem[]
  suppliers: SupplierItem[]
  logistics: LogisticsItem[]
  costs: CostItem[]
  metrics?: {
    shortageItems: number
    warningItems: number
    highRiskSuppliers: number
    delayedRoutes: number
    highCostItems: number
  }
  suggestions?: string[]
  metadata?: ResponseMetadata
}

// --- 决策分析 ---
export interface DecisionMetric {
  key: string
  label: string
  value: number
  unit?: string
  trend: 'up' | 'down' | 'stable'
  status: 'normal' | 'warning' | 'danger'
}

export interface DecisionSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: 'inventory' | 'logistics' | 'supplier' | 'cost' | 'risk' | string
  title: string
  problem: string
  impact: string
  action: string
  evidence: string[]
}

export interface DecisionRiskMatrixItem {
  name: string
  value: number
  level: 'low' | 'medium' | 'high' | string
}

export interface DecisionCostItem {
  name: string
  value: number
}

export interface DecisionChartData {
  salesTrend: SalesTrendItem[]
  riskMatrix: DecisionRiskMatrixItem[]
  costBreakdown: DecisionCostItem[]
}

export interface DecisionAnalysisFilters {
  region?: string
  date?: string
  category?: string
  riskLevel?: string
  dimension?: string
}

export interface DecisionAnalysisResponse {
  filters: DecisionAnalysisFilters
  metrics: DecisionMetric[]
  charts: DecisionChartData
  suggestions: DecisionSuggestion[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  summary: {
    shortageItems: number
    warningItems: number
    highRiskSuppliers: number
    delayedRoutes: number
    openRisks: number
    totalCost: number
  }
  metadata?: ResponseMetadata & {
    ai?: {
      mode?: string
      model?: string
      reason?: string
    }
    filteredCounts?: Record<string, number>
  }
}

export interface UserDashboardConfig {
  dimension: string
  defaultFilters: DecisionAnalysisFilters
  visibleModules: Record<string, boolean>
  compactMode: boolean
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

export interface EntityDataResponse {
  items: Record<string, unknown>[]
  metadata?: ResponseMetadata
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
    source?: string
    updatedAt?: string
    fallbackReason?: string | null
    quality?: DataQualitySummary
  }
}

// --- AI 分析 ---
export interface ForecastRequest {
  product_id: string
  product_name?: string
  supplier_id?: string
  supplier_name?: string
  brand_name?: string
  forecast_scope?: 'product' | 'supplier'
}

export interface ForecastResponse {
  product_id: string
  product_name?: string
  forecast_demand_7d: number
  forecast_demand_30d?: number
  forecast_interval_7d?: ForecastInterval
  forecast_interval_30d?: ForecastInterval
  confidence: 'low' | 'medium' | 'high'
  trend: 'up' | 'down' | 'stable' | 'unknown' | 'upward'
  analysis: string
  chart_data?: {
    history?: ForecastSeriesItem[]
    forecast?: ForecastSeriesItem[]
    cost_breakdown?: ForecastBreakdownItem[]
  }
  report_sections?: ForecastReportSection[]
  recommendations?: string[]
  metadata?: {
    mode: string
    method?: string
    reason?: string
    history_count?: number
    required_history_count?: number
    history_source?: string
    generated_at?: string
    demo_product_id?: string
    source?: string
    updatedAt?: string
    fallbackReason?: string | null
    forecast_scope?: 'product' | 'supplier'
    supplier_id?: string
  }
}

export interface ForecastInterval {
  lower: number
  point: number
  upper: number
  confidence?: number
}

export interface ForecastSeriesItem {
  date: string
  quantity: number
  quantityLower?: number
  quantityUpper?: number
  amount?: number
  purchaseCost?: number
  storageCost?: number
  transportCost?: number
  totalCost?: number
  type?: 'history' | 'forecast' | string
}

export interface ForecastBreakdownItem {
  name: string
  value: number
}

export interface ForecastReportSection {
  title: string
  content: string
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
  metadata?: { mode: string; method?: string; reason?: string; source?: string; updatedAt?: string; fallbackReason?: string | null }
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
  metadata?: { mode: string; method?: string; reason?: string; source?: string; updatedAt?: string; fallbackReason?: string | null }
}

export interface AiHealthData {
  online: boolean
  status?: string
  service?: string
  llm_enabled?: boolean
  model?: string
  error?: string
  metadata?: ResponseMetadata
}
