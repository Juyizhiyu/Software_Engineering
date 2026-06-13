<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import type { SchemaField } from '@/types'

const props = defineProps<{
  loading: boolean
  records: Record<string, unknown>[]
  formFields: SchemaField[]
}>()

const tableWrapperRef = ref<HTMLElement>()
const containerWidth = ref(0)

// 每列的基础权重，用于按比例分配宽度
function getColumnWeight(key: string) {
  if (key === 'id' || key.includes('_id')) return 1
  if (key.includes('name')) return 1.5
  return 1.2
}

const columns = computed(() => {
  const fields = props.formFields.slice(0, 5)
  const w = containerWidth.value || 600
  const totalWeight = fields.reduce((sum, f) => sum + getColumnWeight(f.key), 0)
  return fields.map((field) => {
    const weight = getColumnWeight(field.key)
    return {
      key: field.key,
      dataKey: field.key,
      title: field.label,
      width: Math.floor((weight / totalWeight) * w),
    }
  })
})

const tableWidth = computed(() => {
  const w = containerWidth.value || 600
  return Math.max(
    w,
    columns.value.reduce((sum, col) => sum + col.width, 0),
  )
})

let resizeObserver: ResizeObserver | null = null

function setupObserver(el: HTMLElement) {
  containerWidth.value = el.clientWidth
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      containerWidth.value = entry.contentRect.width
    }
  })
  resizeObserver.observe(el)
}

watch(tableWrapperRef, (el) => {
  if (el) {
    nextTick(() => setupObserver(el))
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

function getCellValue(row: Record<string, unknown>, columnKey: string) {
  const value = row[columnKey]
  if (value === null || value === undefined) return '-'
  return String(value)
}
</script>

<template>
  <el-card class="entity-list">
    <template #header>
      <div class="entity-list__header">
        <span>已有记录</span>
        <el-tag
          size="small"
          type="info"
        >
          {{ records.length }}
        </el-tag>
      </div>
    </template>

    <div
      v-if="loading"
      class="entity-list__skeleton"
    >
      <el-skeleton
        :rows="5"
        animated
      />
    </div>

    <div
      v-else
      ref="tableWrapperRef"
      class="entity-list__table-wrapper"
    >
      <el-table-v2
        :columns="columns"
        :data="records"
        :width="tableWidth"
        :height="500"
        :row-key="'id'"
      >
        <template #cell="{ column, rowData }">
          <el-tooltip
            :content="getCellValue(rowData, column.dataKey as string)"
            placement="top"
            :show-after="300"
            :disabled="getCellValue(rowData, column.dataKey as string) === '-'"
          >
            <span class="entity-list__cell">
              {{ getCellValue(rowData, column.dataKey as string) }}
            </span>
          </el-tooltip>
        </template>
      </el-table-v2>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.entity-list {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  &__skeleton {
    padding: 16px;
  }

  &__table-wrapper {
    overflow: auto;

    :deep(.el-table-v2__header-wrapper) {
      background-color: var(--el-fill-color-blank);
    }

    :deep(.el-table-v2__row-wrapper:hover) {
      background-color: var(--el-table-row-hover-bg-color);
    }
  }

  &__cell {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__more {
    padding: $spacing-sm 0;
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
    text-align: center;
  }
}
</style>
