import { beforeEach, describe, expect, it } from 'vitest'
import { defaultOverviewConfig, useOverviewConfig } from '../useOverviewConfig'

describe('useOverviewConfig', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads default overview config', () => {
    const overview = useOverviewConfig()

    expect(overview.config.visibleMetrics.totalOrders).toBe(true)
    expect(overview.config.visibleMetrics.averageOrderAmount).toBe(false)
    expect(overview.config.visibleCharts.salesTrend).toBe(true)
    expect(overview.config.visibleTables.recentOrders).toBe(true)
  })

  it('saves and restores visible modules', () => {
    const overview = useOverviewConfig()
    overview.config.visibleMetrics.totalOrders = false
    overview.config.visibleCharts.costTrend = true
    overview.config.visibleTables.costRanking = true
    overview.config.compactMode = true
    overview.saveConfig()

    const restored = useOverviewConfig()

    expect(restored.config.visibleMetrics.totalOrders).toBe(false)
    expect(restored.config.visibleCharts.costTrend).toBe(true)
    expect(restored.config.visibleTables.costRanking).toBe(true)
    expect(restored.config.compactMode).toBe(true)
  })

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem('supply-chain-bi:overview-config', '{invalid')

    const overview = useOverviewConfig()

    expect(overview.config.visibleMetrics).toEqual(defaultOverviewConfig.visibleMetrics)
    expect(overview.config.visibleCharts).toEqual(defaultOverviewConfig.visibleCharts)
    expect(overview.config.visibleTables).toEqual(defaultOverviewConfig.visibleTables)
  })

  it('restores defaults after reset', () => {
    const overview = useOverviewConfig()
    overview.config.visibleTables.inventoryAlerts = false
    overview.config.compactMode = true
    overview.saveConfig()

    overview.resetConfig()

    expect(overview.config.visibleTables.inventoryAlerts).toBe(true)
    expect(overview.config.compactMode).toBe(false)
  })
})
