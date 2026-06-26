import { reactive } from 'vue'
import type { OverviewChartKey, OverviewDashboardConfig, OverviewMetricKey, OverviewTableKey } from '@/types'

const STORAGE_KEY = 'supply-chain-bi:overview-config'

export const overviewMetricOptions: Array<{ key: OverviewMetricKey; label: string }> = [
  { key: 'totalOrders', label: '订单总量' },
  { key: 'totalSales', label: '销售额' },
  { key: 'totalStock', label: '库存总量' },
  { key: 'openRisks', label: '供应链风险' },
  { key: 'averageOrderAmount', label: '客单价' },
  { key: 'shortageCount', label: '缺货数' },
  { key: 'delayedShipments', label: '延迟发货' },
  { key: 'totalCost', label: '总成本' },
  { key: 'supplierScoreAvg', label: '供应商均分' },
]

export const overviewChartOptions: Array<{ key: OverviewChartKey; label: string }> = [
  { key: 'salesTrend', label: '销售趋势' },
  { key: 'riskDistribution', label: '风险分布' },
  { key: 'costTrend', label: '成本趋势' },
  { key: 'delayedRoutes', label: '物流延迟路线' },
  { key: 'inventoryStatus', label: '库存状态分布' },
  { key: 'supplierScores', label: '供应商评分排行' },
]

export const overviewTableOptions: Array<{ key: OverviewTableKey; label: string }> = [
  { key: 'inventoryAlerts', label: '库存预警' },
  { key: 'topSuppliers', label: '优选供应商' },
  { key: 'recentOrders', label: '最近订单' },
  { key: 'delayedRoutes', label: '延迟物流列表' },
  { key: 'costRanking', label: '成本排行' },
]

export const defaultOverviewConfig: OverviewDashboardConfig = {
  compactMode: false,
  visibleMetrics: {
    totalOrders: true,
    totalSales: true,
    totalStock: true,
    openRisks: true,
    averageOrderAmount: false,
    shortageCount: false,
    delayedShipments: false,
    totalCost: false,
    supplierScoreAvg: false,
  },
  visibleCharts: {
    salesTrend: true,
    riskDistribution: true,
    costTrend: false,
    delayedRoutes: false,
    inventoryStatus: false,
    supplierScores: false,
  },
  visibleTables: {
    inventoryAlerts: true,
    topSuppliers: true,
    recentOrders: true,
    delayedRoutes: false,
    costRanking: false,
  },
}

function cloneDefaultConfig(): OverviewDashboardConfig {
  return structuredClone(defaultOverviewConfig)
}

function readConfig(): OverviewDashboardConfig {
  if (typeof localStorage === 'undefined') return cloneDefaultConfig()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefaultConfig()
    const parsed = JSON.parse(raw) as Partial<OverviewDashboardConfig>
    return {
      ...cloneDefaultConfig(),
      ...parsed,
      visibleMetrics: {
        ...defaultOverviewConfig.visibleMetrics,
        ...parsed.visibleMetrics,
      },
      visibleCharts: {
        ...defaultOverviewConfig.visibleCharts,
        ...parsed.visibleCharts,
      },
      visibleTables: {
        ...defaultOverviewConfig.visibleTables,
        ...parsed.visibleTables,
      },
    }
  } catch {
    return cloneDefaultConfig()
  }
}

function writeConfig(config: OverviewDashboardConfig) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function useOverviewConfig() {
  const config = reactive<OverviewDashboardConfig>(readConfig())

  function saveConfig(nextConfig?: Partial<OverviewDashboardConfig>) {
    if (nextConfig) {
      Object.assign(config, nextConfig)
      if (nextConfig.visibleMetrics) {
        config.visibleMetrics = {
          ...config.visibleMetrics,
          ...nextConfig.visibleMetrics,
        }
      }
      if (nextConfig.visibleCharts) {
        config.visibleCharts = {
          ...config.visibleCharts,
          ...nextConfig.visibleCharts,
        }
      }
      if (nextConfig.visibleTables) {
        config.visibleTables = {
          ...config.visibleTables,
          ...nextConfig.visibleTables,
        }
      }
    }
    writeConfig(config)
  }

  function resetConfig() {
    Object.assign(config, cloneDefaultConfig())
    writeConfig(config)
  }

  return {
    config,
    saveConfig,
    resetConfig,
  }
}
