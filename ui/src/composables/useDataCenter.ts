import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getSchemas, getEntityData, createEntityData } from '@/api/data'
import type {
  EntityType,
  EntitySchema,
  SchemaField,
  ResponseMetadata,
  EntityDataResponse,
} from '@/types'
import { entityConfig, fallbackFormFields } from '@/config/dataForms'

export function useDataCenter() {
  const loading = ref(false)
  const submitting = ref(false)
  const activeEntity = ref<EntityType>('orders')
  const schemas = ref<EntitySchema>({})
  const records = ref<Record<string, unknown>[]>([])
  const form = ref<Record<string, string | number | null>>({})
  const formFields = ref<SchemaField[]>(fallbackFormFields.orders)
  const metadata = ref<ResponseMetadata | null>(null)
  const error = ref('')

  const entityOptions = Object.entries(entityConfig).map(([key, val]) => ({
    value: key as EntityType,
    label: val.label,
    icon: val.icon,
  }))

  async function fetchSchemas() {
    try {
      const { data } = await getSchemas()
      schemas.value = data
    } catch {
      schemas.value = {}
    }
    updateFormFields()
  }

  async function fetchEntityData() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await getEntityData(activeEntity.value)
      if (Array.isArray(data)) {
        records.value = data
        metadata.value = null
      } else {
        const payload = data as EntityDataResponse
        records.value = payload.items || []
        metadata.value = payload.metadata || null
      }
    } catch (err: unknown) {
      records.value = []
      error.value = err instanceof Error ? err.message : '数据加载失败'
    } finally {
      loading.value = false
    }
  }

  function updateFormFields() {
    const entity = activeEntity.value
    const serverSchema = schemas.value[entity]
    formFields.value = serverSchema?.fields?.length ? serverSchema.fields : fallbackFormFields[entity] || []
    form.value = {}
  }

  async function submitData() {
    submitting.value = true
    error.value = ''
    try {
      await createEntityData(activeEntity.value, form.value)
      ElMessage.success('数据提交成功')
      form.value = {}
      await fetchEntityData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失败'
      error.value = message
      ElMessage.error(message)
    } finally {
      submitting.value = false
    }
  }

  function switchEntity(entity: EntityType) {
    activeEntity.value = entity
  }

  watch(activeEntity, () => {
    updateFormFields()
    fetchEntityData()
  })

  return {
    loading,
    submitting,
    activeEntity,
    schemas,
    records,
    form,
    formFields,
    metadata,
    error,
    entityOptions,
    fetchSchemas,
    fetchEntityData,
    submitData,
    switchEntity,
  }
}
