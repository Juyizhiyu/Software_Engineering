import { ref } from 'vue'
import { forecastDemand } from '@/api/ai'
import type { ForecastResponse } from '@/types'

export function useAiForecast() {
  const loading = ref(false)
  const productId = ref('')
  const result = ref<ForecastResponse | null>(null)

  async function submit() {
    if (!productId.value.trim()) return
    loading.value = true
    try {
      const { data } = await forecastDemand({ product_id: productId.value.toUpperCase() })
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '预测失败'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    productId.value = ''
    result.value = null
  }

  return { loading, productId, result, submit, reset }
}
