import { describe, expect, it, vi } from 'vitest'
import { useRisks } from '../useRisks'
import { getRiskCenterAnalysis, getRisks } from '@/api/risks'
import type { RiskCenterAnalysisResponse, RiskItem } from '@/types'

vi.mock('@/api/risks', () => ({
  getRiskCenterAnalysis: vi.fn<typeof getRiskCenterAnalysis>(),
  getRisks: vi.fn<typeof getRisks>(),
}))

const openCritical: RiskItem = {
  riskId: 'R001',
  riskType: '库存不足',
  riskLevel: 'Critical',
  riskLevelLabel: '严重',
  relatedObject: 'P001',
  description: '库存低于安全线',
  suggestion: '立即补货',
  status: 'open',
  statusLabel: '待处理',
  createdAt: '2026-06-19 10:00:00',
}

const openHigh: RiskItem = {
  riskId: 'R002',
  riskType: '物流延迟',
  riskLevel: 'High',
  riskLevelLabel: '高',
  relatedObject: 'L001',
  description: '路线延迟',
  suggestion: '启用备用承运商',
  status: 'open',
  statusLabel: '待处理',
  createdAt: '2026-06-19 11:00:00',
}

const resolvedHigh: RiskItem = {
  riskId: 'R003',
  riskType: '成本异常',
  riskLevel: 'High',
  riskLevelLabel: '高',
  relatedObject: 'C001',
  description: '成本偏高',
  suggestion: '复核成本',
  status: 'resolved',
  statusLabel: '已关闭',
  createdAt: '2026-06-19 12:00:00',
}

function buildAnalysis(): RiskCenterAnalysisResponse {
  return {
    filters: { status: 'open', scope: 'all' },
    risks: [openCritical, openHigh, resolvedHigh],
    openRisks: [openCritical, openHigh],
    riskStats: { Critical: 1, High: 1, Medium: 0, Low: 0 },
    anomaly: {
      data_type: 'risk-center',
      total_records: 2,
      anomalies: [{ field: 'stock', reason: 'low_stock', desc: '库存异常' }],
      summary: '检测到 1 项异常',
    },
    supplierRiskScores: [
      {
        supplier_id: 'S001',
        supplier_name: 'Supplier A',
        score: 78,
        risk_level: 'Medium',
        recommendations: ['复核供应商履约表现'],
      },
    ],
    summary: { openRisks: 2, anomalyCount: 1, scoredSuppliers: 1, highRiskSuppliers: 0 },
    metadata: {
      source: 'mixed',
      updatedAt: '2026-06-20T00:00:00.000Z',
      ai: { anomalyMode: 'node-fallback', riskScoreModes: ['node-fallback'] },
      cache: { hit: false, key: 'risk', createdAt: '2026-06-20T00:00:00.000Z', signature: 'sig' },
    },
  }
}

describe('useRisks', () => {
  it('loads integrated risk analysis data', async () => {
    vi.mocked(getRiskCenterAnalysis).mockResolvedValueOnce({
      success: true,
      data: buildAnalysis(),
    })

    const risks = useRisks()
    await risks.fetchRisks()

    expect(risks.loading.value).toBe(false)
    expect(risks.openRisks.value).toHaveLength(2)
    expect(risks.riskStats.value).toEqual({ Critical: 1, High: 1, Medium: 0, Low: 0 })
    expect(risks.anomaly.value?.anomalies).toHaveLength(1)
    expect(risks.supplierRiskScores.value).toHaveLength(1)
  })

  it('passes forceRefresh when refreshing risk analysis', async () => {
    vi.mocked(getRiskCenterAnalysis).mockResolvedValueOnce({
      success: true,
      data: buildAnalysis(),
    })

    const risks = useRisks()
    await risks.refreshRiskAnalysis({ riskLevel: 'High' })

    expect(getRiskCenterAnalysis).toHaveBeenCalledWith({ riskLevel: 'High', forceRefresh: true })
  })
})
