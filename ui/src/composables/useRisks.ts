import { computed, ref } from 'vue'
import { getRiskCenterAnalysis, getRisks } from '@/api/risks'
import type { RiskCenterAnalysisFilters, RiskCenterAnalysisResponse, RiskItem } from '@/types'

export function useRisks() {
  const loading = ref(false)
  const risks = ref<RiskItem[]>([])
  const analysis = ref<RiskCenterAnalysisResponse | null>(null)
  const error = ref('')

  const openRisks = computed(() => analysis.value?.openRisks || risks.value.filter((r) => r.status === 'open'))
  const riskStats = computed(() => {
    if (analysis.value?.riskStats) return analysis.value.riskStats

    const stats = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    openRisks.value.forEach((risk) => {
      if (risk.riskLevel in stats) stats[risk.riskLevel as keyof typeof stats]++
    })
    return stats
  })
  const anomaly = computed(() => analysis.value?.anomaly)
  const supplierRiskScores = computed(() => analysis.value?.supplierRiskScores || [])
  const analysisSummary = computed(() => analysis.value?.summary)
  const analysisMetadata = computed(() => analysis.value?.metadata)

  async function fetchRisks(filters: RiskCenterAnalysisFilters = {}, options: { forceRefresh?: boolean } = {}) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await getRiskCenterAnalysis({
        ...filters,
        forceRefresh: options.forceRefresh || undefined,
      })
      analysis.value = data
      risks.value = data.risks
    } catch (err: unknown) {
      try {
        const { data } = await getRisks()
        analysis.value = null
        risks.value = data
      } catch {
        error.value = err instanceof Error ? err.message : '风险数据加载失败'
        console.error('Failed to fetch risk analysis:', err)
      }
    } finally {
      loading.value = false
    }
  }

  function refreshRiskAnalysis(filters: RiskCenterAnalysisFilters = {}) {
    return fetchRisks(filters, { forceRefresh: true })
  }

  return {
    loading,
    risks,
    analysis,
    openRisks,
    riskStats,
    anomaly,
    supplierRiskScores,
    analysisSummary,
    analysisMetadata,
    error,
    fetchRisks,
    refreshRiskAnalysis,
  }
}
