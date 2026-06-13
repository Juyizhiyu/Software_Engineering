import { ref } from 'vue'
import { getDashboardSummary, getDashboardOverview } from '@/api/dashboard'
import type { DashboardSummary, DashboardOverview } from '@/types'

export function useDashboard() {
  const loading = ref(false)
  const summary = ref<DashboardSummary | null>(null)
  const overview = ref<DashboardOverview | null>(null)

  async function fetchSummary() {
    loading.value = true
    try {
      const { data } = await getDashboardSummary()
      summary.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchOverview() {
    try {
      const { data } = await getDashboardOverview()
      overview.value = data
    } catch (err) {
      console.error('Failed to fetch overview:', err)
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([fetchSummary(), fetchOverview()])
    } finally {
      loading.value = false
    }
  }

  return { loading, summary, overview, fetchSummary, fetchOverview, fetchAll }
}
