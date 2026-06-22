import { ref } from 'vue'
import { getOperationsSnapshot } from '@/api/operations'
import type { OperationsSnapshot } from '@/types'

export function useOperations() {
  const loading = ref(false)
  const snapshot = ref<OperationsSnapshot | null>(null)
  const error = ref('')

  async function fetchSnapshot() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await getOperationsSnapshot()
      snapshot.value = data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '业务分析数据加载失败'
      console.error('Failed to fetch operations snapshot:', err)
    } finally {
      loading.value = false
    }
  }

  return { loading, snapshot, error, fetchSnapshot }
}
