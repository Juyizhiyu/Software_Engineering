import { describe, expect, it, vi } from 'vitest'
import { useDashboard } from '../useDashboard'
import { getDashboardOverview, getDashboardSummary } from '@/api/dashboard'

vi.mock('@/api/dashboard', () => ({
  getDashboardSummary: vi.fn<typeof getDashboardSummary>(),
  getDashboardOverview: vi.fn<typeof getDashboardOverview>(),
}))

describe('useDashboard', () => {
  it('loads summary and overview data into state', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValueOnce({
      success: true,
      data: {
        totalOrders: 10,
        totalSales: 2000,
        averageOrderAmount: 200,
        totalStock: 500,
        shortageCount: 1,
        delayedShipments: 2,
        openRisks: 3,
        totalCost: 1200,
        supplierScoreAvg: 91,
      },
    })
    vi.mocked(getDashboardOverview).mockResolvedValueOnce({
      success: true,
      data: {
        salesTrend: [{ date: '2026-06-19', amount: 2000, quantity: 10 }],
        inventoryAlerts: [],
        topSuppliers: [],
        riskDistribution: [{ level: 'High', count: 3 }],
        recentOrders: [],
      },
    })

    const dashboard = useDashboard()

    await dashboard.fetchAll()

    expect(dashboard.loading.value).toBe(false)
    expect(dashboard.summary.value?.openRisks).toBe(3)
    expect(dashboard.overview.value?.salesTrend[0]?.amount).toBe(2000)
    expect(getDashboardSummary).toHaveBeenCalledTimes(1)
    expect(getDashboardOverview).toHaveBeenCalledTimes(1)
  })
})
