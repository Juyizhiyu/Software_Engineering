import { describe, expect, it, vi } from 'vitest'
import { useAiRiskScore } from '../useAiRiskScore'
import { scoreRisk } from '@/api/ai'
import { getSuppliersPerformance } from '@/api/suppliers'

vi.mock('@/api/ai', () => ({
  scoreRisk: vi.fn<typeof scoreRisk>(),
}))

vi.mock('@/api/suppliers', () => ({
  getSuppliersPerformance: vi.fn<typeof getSuppliersPerformance>(),
}))

describe('useAiRiskScore', () => {
  it('loads suppliers and selects the first supplier by default', async () => {
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

    const riskScore = useAiRiskScore()

    await riskScore.fetchSuppliers()

    expect(riskScore.suppliers.value).toHaveLength(1)
    expect(riskScore.supplierId.value).toBe('S001')
    expect(riskScore.selectedSupplier.value?.supplierName).toBe('Supplier A')
  })

  it('stores the unwrapped risk score response', async () => {
    vi.mocked(scoreRisk).mockResolvedValueOnce({
      success: true,
      data: {
        supplier_id: 'S001',
        score: 81,
        risk_level: 'Medium',
        recommendations: ['Review delivery performance'],
      },
    })

    const riskScore = useAiRiskScore()
    riskScore.supplierId.value = 's001'

    await riskScore.submit()

    expect(scoreRisk).toHaveBeenCalledWith({ supplier_id: 'S001' })
    expect(riskScore.result.value?.score).toBe(81)
    expect(riskScore.result.value?.risk_level).toBe('Medium')
  })

  it('submits selected supplier metrics with the risk score request', async () => {
    vi.mocked(scoreRisk).mockResolvedValueOnce({
      success: true,
      data: {
        supplier_id: 'S002',
        supplier_name: 'Supplier B',
        score: 88,
        risk_level: 'Low',
        recommendations: [],
      },
    })

    const riskScore = useAiRiskScore()
    riskScore.suppliers.value = [
      {
        id: 'S002-0',
        supplierId: 'S002',
        supplierName: 'Supplier B',
        region: '华南',
        onTimeRate: 91,
        qualityRate: 93,
        priceStability: 89,
        responseScore: 90,
        cooperationYears: 4,
        compositeScore: 91,
        riskLevel: 'low',
        riskLabel: '低风险',
        totalGmv: 2000,
        totalUnits: 200,
        productCount: 8,
      },
    ]
    riskScore.supplierId.value = 'S002'

    await riskScore.submit()

    expect(scoreRisk).toHaveBeenCalledWith({
      supplier_id: 'S002',
      supplier_name: 'Supplier B',
      metrics: {
        on_time_rate: 91,
        quality_rate: 93,
        price_stability: 89,
        response_score: 90,
      },
    })
  })
})
