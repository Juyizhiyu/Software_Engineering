import { ref } from 'vue'
import { detectAnomaly } from '@/api/ai'
import type { AnomalyResponse } from '@/types'

export function useAiAnomaly() {
  const loading = ref(false)
  const dataType = ref('costs')
  const result = ref<AnomalyResponse | null>(null)

  const dataTypeOptions = [
    { value: 'costs', label: '成本' },
    { value: 'inventory', label: '库存' },
    { value: 'orders', label: '订单' },
    { value: 'logistics', label: '物流' },
    { value: 'suppliers', label: '供应商' },
    { value: 'risks', label: '风险' },
  ]

  async function submit() {
    loading.value = true
    try {
      const { data } = await detectAnomaly({ data_type: dataType.value })
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '异常检测失败'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    dataType.value = 'costs'
    result.value = null
  }

  return { loading, dataType, dataTypeOptions, result, submit, reset }
}
