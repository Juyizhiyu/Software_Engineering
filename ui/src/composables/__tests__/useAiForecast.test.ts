import { describe, expect, it, vi } from 'vitest'
import { useAiForecast } from '../useAiForecast'
import { forecastDemand } from '@/api/ai'
import { getSuppliersPerformance } from '@/api/suppliers'

vi.mock('@/api/ai', () => ({
  forecastDemand: vi.fn<typeof forecastDemand>(),
}))

vi.mock('@/api/suppliers', () => ({
  getSuppliersPerformance: vi.fn<typeof getSuppliersPerformance>(),
}))

describe('useAiForecast', () => {
  it('submits an uppercased product id and stores the forecast result', async () => {
    vi.mocked(forecastDemand).mockResolvedValueOnce({
      success: true,
      data: {
        product_id: 'P001',
        product_name: '核心零件',
        forecast_demand_7d: 120,
        forecast_demand_30d: 520,
        confidence: 'medium',
        trend: 'up',
        analysis: '需求上升',
      },
    })

    const forecast = useAiForecast()
    forecast.productId.value = 'p001'

    await forecast.submit()

    expect(forecastDemand).toHaveBeenCalledWith({ product_id: 'P001', forecast_scope: 'product' })
    expect(forecast.loading.value).toBe(false)
    expect(forecast.result.value?.forecast_demand_7d).toBe(120)

    forecast.reset()
    expect(forecast.productId.value).toBe('')
    expect(forecast.result.value).toBeNull()
  })

  it('loads suppliers and submits a supplier forecast request', async () => {
    vi.mocked(getSuppliersPerformance).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'S001-0',
          supplierId: 'S001',
          supplierName: 'Supplier A',
          region: '华东',
          onTimeRate: 96,
          qualityRate: 97,
          priceStability: 92,
          responseScore: 95,
          cooperationYears: 3,
          compositeScore: 95,
          riskLevel: 'low',
          riskLabel: '低风险',
          totalGmv: 1000,
          totalUnits: 100,
          productCount: 5,
        },
      ],
    })
    vi.mocked(forecastDemand).mockResolvedValueOnce({
      success: true,
      data: {
        product_id: 'S001',
        product_name: 'Supplier A',
        forecast_demand_7d: 880,
        forecast_demand_30d: 3780,
        confidence: 'medium',
        trend: 'up',
        analysis: '供应商需求上升',
      },
    })

    const forecast = useAiForecast()

    await forecast.fetchSuppliers()
    forecast.scope.value = 'supplier'
    await forecast.submit()

    expect(forecast.supplierId.value).toBe('S001')
    expect(forecastDemand).toHaveBeenCalledWith({
      product_id: 'S001',
      product_name: 'Supplier A',
      supplier_id: 'S001',
      supplier_name: 'Supplier A',
      brand_name: 'Supplier A',
      forecast_scope: 'supplier',
    })
    expect(forecast.result.value?.forecast_demand_7d).toBe(880)
  })
})
