import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDecisionAnalysis } from '../useDecisionAnalysis'
import { getDecisionAnalysis } from '@/api/decision'

vi.mock('@/api/decision', () => ({
  getDecisionAnalysis: vi.fn<typeof getDecisionAnalysis>(),
}))

describe('useDecisionAnalysis', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads decision analysis data', async () => {
    vi.mocked(getDecisionAnalysis).mockResolvedValueOnce({
      success: true,
      data: {
        filters: { dimension: 'overview' },
        metrics: [{ key: 'shortageItems', label: '缺货商品', value: 1, unit: '项', trend: 'up', status: 'danger' }],
        charts: {
          salesTrend: [],
          riskMatrix: [],
          costBreakdown: [],
        },
        suggestions: [],
        riskLevel: 'medium',
        summary: {
          shortageItems: 1,
          warningItems: 0,
          highRiskSuppliers: 0,
          delayedRoutes: 0,
          openRisks: 0,
          totalCost: 0,
        },
      },
    })

    const decision = useDecisionAnalysis()
    await decision.fetchAnalysis()

    expect(decision.loading.value).toBe(false)
    expect(decision.analysis.value?.riskLevel).toBe('medium')
    expect(decision.visibleMetrics.value).toHaveLength(1)
  })

  it('restores loading state when the API fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(getDecisionAnalysis).mockRejectedValueOnce(new Error('network down'))

    const decision = useDecisionAnalysis()
    await decision.fetchAnalysis()

    expect(decision.loading.value).toBe(false)
    expect(decision.error.value).toBe('network down')
    expect(decision.analysis.value).toBeNull()

    consoleError.mockRestore()
  })

  it('saves and restores dashboard config', () => {
    const decision = useDecisionAnalysis()
    decision.filters.region = '华东'
    decision.filters.dimension = 'inventory'
    decision.config.visibleModules.costBreakdown = false
    decision.saveConfig()

    const restored = useDecisionAnalysis()

    expect(restored.filters.region).toBe('华东')
    expect(restored.filters.dimension).toBe('inventory')
    expect(restored.config.visibleModules.costBreakdown).toBe(false)
  })
})
