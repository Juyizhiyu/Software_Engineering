import { ref } from 'vue'
import { scoreRisk } from '@/api/ai'
import type { RiskScoreResponse } from '@/types'

export function useAiRiskScore() {
  const loading = ref(false)
  const supplierId = ref('')
  const result = ref<RiskScoreResponse | null>(null)

  async function submit() {
    if (!supplierId.value.trim()) return
    loading.value = true
    try {
      const { data } = await scoreRisk({ supplier_id: supplierId.value })
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '风险评分失败'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    supplierId.value = ''
    result.value = null
  }

  return { loading, supplierId, result, submit, reset }
}
