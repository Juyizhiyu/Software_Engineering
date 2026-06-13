import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getSchemas, getEntityData, createEntityData } from '@/api/data'
import type { EntityType, EntitySchema, SchemaField } from '@/types'
import { entityConfig, fallbackFormFields } from '@/config/dataForms'

export function useDataCenter() {
  const loading = ref(false)
  const submitting = ref(false)
  const activeEntity = ref<EntityType>('orders')
  const schemas = ref<EntitySchema>({})
  const records = ref<Record<string, unknown>[]>([])
  const form = ref<Record<string, string | number | null>>({})

  // 当前实体的表单字段
  const formFields = ref<SchemaField[]>(fallbackFormFields.orders)

  // 实体配置
  const entityOptions = Object.entries(entityConfig).map(([key, val]) => ({
    value: key as EntityType,
    label: val.label,
    icon: val.icon,
  }))

  // 加载 Schema
  async function fetchSchemas() {
    try {
      const { data } = await getSchemas()
      schemas.value = data
    } catch {
      // 降级使用前端定义
    }
    updateFormFields()
  }

  // 加载实体数据
  async function fetchEntityData() {
    loading.value = true
    try {
      const { data } = await getEntityData(activeEntity.value)
      records.value = data
    } catch {
      records.value = []
    } finally {
      loading.value = false
    }
  }

  // 更新表单字段
  function updateFormFields() {
    const entity = activeEntity.value
    const serverSchema = schemas.value[entity]
    if (serverSchema?.fields?.length) {
      formFields.value = serverSchema.fields
    } else {
      formFields.value = fallbackFormFields[entity] || []
    }
    // 重置表单
    form.value = {}
  }

  // 提交数据
  async function submitData() {
    submitting.value = true
    try {
      await createEntityData(activeEntity.value, form.value)
      ElMessage.success('数据提交成功')
      form.value = {}
      await fetchEntityData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失败'
      ElMessage.error(message)
    } finally {
      submitting.value = false
    }
  }

  // 切换实体
  function switchEntity(entity: EntityType) {
    activeEntity.value = entity
  }

  // 监听实体切换
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
    entityOptions,
    fetchSchemas,
    fetchEntityData,
    submitData,
    switchEntity,
  }
}
