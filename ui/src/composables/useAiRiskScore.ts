import { computed, ref } from 'vue'
import { scoreRisk } from '@/api/ai'
import { getSuppliersPerformance } from '@/api/suppliers'
import type { RiskScoreResponse, SupplierItem } from '@/types'

export function useAiRiskScore() {
  const loading = ref(false)
  const suppliersLoading = ref(false)
  const supplierId = ref('')
  const suppliers = ref<SupplierItem[]>([])
  const result = ref<RiskScoreResponse | null>(null)
  const error = ref('')

  const selectedSupplier = computed(() =>
    suppliers.value.find((item) => item.supplierId === supplierId.value),
  )

  async function fetchSuppliers() {
    suppliersLoading.value = true
    error.value = ''
    try {
      const { data } = await getSuppliersPerformance()
      suppliers.value = Array.isArray(data) ? data : []
      const firstSupplier = suppliers.value[0]
      if (!supplierId.value && firstSupplier) {
        supplierId.value = firstSupplier.supplierId
      }
    } catch (err: unknown) {
      suppliers.value = []
      error.value = err instanceof Error ? err.message : '供应商列表加载失败'
    } finally {
      suppliersLoading.value = false
    }
  }

  async function submit() {
    if (!supplierId.value.trim()) return
    loading.value = true
    error.value = ''
    try {
      const supplier = selectedSupplier.value
      const { data } = await scoreRisk({
        supplier_id: supplierId.value.toUpperCase(),
        supplier_name: supplier?.supplierName,
        metrics: supplier
          ? {
              on_time_rate: supplier.onTimeRate,
              quality_rate: supplier.qualityRate,
              price_stability: supplier.priceStability,
              response_score: supplier.responseScore,
            }
          : undefined,
      })
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '风险评分失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    supplierId.value = ''
    result.value = null
  }

  return {
    loading,
    suppliersLoading,
    supplierId,
    suppliers,
    selectedSupplier,
    result,
    error,
    fetchSuppliers,
    submit,
    reset,
  }
}
