<script setup lang="ts">
import { computed } from 'vue'
import type { SchemaField } from '@/types'

const props = defineProps<{
  loading: boolean
  records: Record<string, unknown>[]
  formFields: SchemaField[]
}>()

const columns = computed(() => {
  return props.formFields.slice(0, 5).map(field => ({
    key: field.key,
    title: field.label,
    width: field.key === 'id' || field.key.includes('_id') ? 120 : field.key.includes('name') ? 150 : 120,
  }))
})

const tableWidth = computed(() => {
  const total = columns.value.reduce((sum, col) => sum + col.width, 0)
  return Math.max(total, 500)
})

function getCellValue(row: Record<string, unknown>, columnKey: string) {
  const value = row[columnKey]
  if (value === null || value === undefined) return '-'
  return String(value)
}

function getRowKey(row: Record<string, unknown>, index: number) {
  const idFields = ['id', 'order_id', 'supplier_id', 'shipment_id', 'risk_id']
  for (const field of idFields) {
    if (row[field] !== undefined) {
      return String(row[field])
    }
  }
  return String(index)
}
</script>

<template>
  <el-card class="entity-list">
    <template #header>
      <div class="entity-list__header">
        <span>已有记录</span>
        <el-tag size="small" type="info">
          {{ records.length }}
        </el-tag>
      </div>
    </template>

    <div v-if="loading" class="entity-list__skeleton">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else class="entity-list__table-wrapper">
      <el-table-v2
        :columns="columns"
        :data="records"
        :width="tableWidth"
        :height="500"
        :row-key="getRowKey"
      >
        <template #cell="{ column, row }">
          <span
            class="entity-list__cell"
            :title="getCellValue(row, column.key)"
          >
            {{ getCellValue(row, column.key) }}
          </span>
        </template>
      </el-table-v2>
    </div>
    
    <div v-if="!loading && records.length > 20" class="entity-list__more">
      仅展示前 20 条，共 {{ records.length }} 条记录
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.entity-list {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }

  &__skeleton {
    padding: 16px;
  }

  &__table-wrapper {
    overflow: auto;
  }

  &__cell {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  &__more {
    text-align: center;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    padding: $spacing-sm 0;
  }
}
</style>
