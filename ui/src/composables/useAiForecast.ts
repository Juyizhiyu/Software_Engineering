import { computed, ref } from 'vue'
import { forecastDemand } from '@/api/ai'
import { getSuppliersPerformance } from '@/api/suppliers'
import type { ForecastResponse, SupplierItem } from '@/types'

export type ForecastScope = 'product' | 'supplier'

export function useAiForecast() {
  const loading = ref(false)
  const suppliersLoading = ref(false)
  const scope = ref<ForecastScope>('product')
  const productId = ref('')
  const supplierId = ref('')
  const suppliers = ref<SupplierItem[]>([])
  const result = ref<ForecastResponse | null>(null)
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
    const supplier = selectedSupplier.value
    const request =
      scope.value === 'supplier'
        ? {
            product_id: supplierId.value,
            product_name: supplier?.supplierName || supplierId.value,
            supplier_id: supplierId.value,
            supplier_name: supplier?.supplierName,
            brand_name: supplier?.brandName || supplier?.supplierName,
            forecast_scope: 'supplier' as const,
          }
        : {
            product_id: productId.value.toUpperCase(),
            forecast_scope: 'product' as const,
          }

    if (!request.product_id.trim()) return

    loading.value = true
    error.value = ''
    try {
      const { data } = await forecastDemand(request)
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '预测失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    productId.value = ''
    result.value = null
  }

  return {
    loading,
    suppliersLoading,
    scope,
    productId,
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
