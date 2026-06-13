import { ref } from 'vue'
import { getOperationsSnapshot } from '@/api/operations'
import type { OperationsSnapshot } from '@/types'

export function useOperations() {
  const loading = ref(false)
  const snapshot = ref<OperationsSnapshot | null>(null)

  async function fetchSnapshot() {
    loading.value = true
    try {
      const { data } = await getOperationsSnapshot()
      snapshot.value = data
    } catch (err) {
      console.error('Failed to fetch operations snapshot:', err)
    } finally {
      loading.value = false
    }
  }

  return { loading, snapshot, fetchSnapshot }
}
