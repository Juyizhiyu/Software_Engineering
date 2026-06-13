import { ref, computed } from 'vue'
import { getRisks } from '@/api/risks'
import type { RiskItem } from '@/types'

export function useRisks() {
  const loading = ref(false)
  const risks = ref<RiskItem[]>([])

  const openRisks = computed(() => risks.value.filter((r) => r.status === 'open'))
  const riskStats = computed(() => {
    const stats = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    openRisks.value.forEach((r) => {
      if (r.riskLevel in stats) stats[r.riskLevel as keyof typeof stats]++
    })
    return stats
  })

  async function fetchRisks() {
    loading.value = true
    try {
      const { data } = await getRisks()
      risks.value = data
    } catch (err) {
      console.error('Failed to fetch risks:', err)
    } finally {
      loading.value = false
    }
  }

  return { loading, risks, openRisks, riskStats, fetchRisks }
}
