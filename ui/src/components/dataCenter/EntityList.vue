<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { SchemaField } from '@/types'

const props = defineProps<{
  loading: boolean
  records: Record<string, unknown>[]
  formFields: SchemaField[]
}>()

interface SortRule {
  id: number
  field: string
  order: 'asc' | 'desc'
}

const tableWrapperRef = ref<HTMLElement>()
const containerWidth = ref(0)
const keyword = ref('')
const filterField = ref('')
const filterValue = ref('')
const rangeFilters = reactive<Record<string, { min: string; max: string }>>({})
const sortRules = ref<SortRule[]>([{ id: Date.now(), field: '', order: 'asc' }])

const searchableFields = computed(() => props.formFields)
const selectFields = computed(() => props.formFields.filter((field) => field.type === 'select'))
const numericFields = computed(() => props.formFields.filter((field) => field.type === 'number' || field.type === 'date'))

const activeSortRules = computed(() =>
  sortRules.value.filter((rule) => rule.field),
)

function getCellValue(row: Record<string, unknown>, columnKey: string) {
  const value = row[columnKey]
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function normalize(value: unknown) {
  return String(value ?? '').toLowerCase()
}

function comparableValue(row: Record<string, unknown>, field: string) {
  const value = row[field]
  const fieldDef = props.formFields.find((item) => item.key === field)
  if (fieldDef?.type === 'number') return Number(value ?? 0)
  if (fieldDef?.type === 'date') return new Date(String(value ?? '')).getTime() || 0
  return normalize(value)
}

function compareRows(a: Record<string, unknown>, b: Record<string, unknown>, rule: SortRule) {
  const aValue = comparableValue(a, rule.field)
  const bValue = comparableValue(b, rule.field)
  let result = 0

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    result = aValue - bValue
  } else {
    result = String(aValue).localeCompare(String(bValue), 'zh-Hans-CN')
  }

  return rule.order === 'asc' ? result : -result
}

function uniqueValues(fieldKey: string) {
  return Array.from(
    new Set(
      props.records
        .map((row) => row[fieldKey])
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map(String),
    ),
  ).slice(0, 100)
}

function getRange(fieldKey: string) {
  if (!rangeFilters[fieldKey]) {
    rangeFilters[fieldKey] = { min: '', max: '' }
  }
  return rangeFilters[fieldKey]
}

function matchesKeyword(row: Record<string, unknown>) {
  const term = keyword.value.trim().toLowerCase()
  if (!term) return true
  return searchableFields.value.some((field) => normalize(row[field.key]).includes(term))
}

function matchesFieldFilter(row: Record<string, unknown>) {
  if (!filterField.value || !filterValue.value.trim()) return true
  return normalize(row[filterField.value]).includes(filterValue.value.trim().toLowerCase())
}

function matchesRangeFilters(row: Record<string, unknown>) {
  return numericFields.value.every((field) => {
    const range = rangeFilters[field.key]
    if (!range || (!range.min && !range.max)) return true

    const raw = row[field.key]
    const value = field.type === 'date' ? new Date(String(raw ?? '')).getTime() : Number(raw)
    const min = field.type === 'date' ? new Date(range.min).getTime() : Number(range.min)
    const max = field.type === 'date' ? new Date(range.max).getTime() : Number(range.max)

    if (range.min && Number.isFinite(min) && value < min) return false
    if (range.max && Number.isFinite(max) && value > max) return false
    return true
  })
}

const filteredRecords = computed(() =>
  props.records.filter((row) => matchesKeyword(row) && matchesFieldFilter(row) && matchesRangeFilters(row)),
)

const displayedRecords = computed(() => {
  const rows = [...filteredRecords.value]
  if (!activeSortRules.value.length) return rows

  return rows.sort((a, b) => {
    for (const rule of activeSortRules.value) {
      const result = compareRows(a, b, rule)
      if (result !== 0) return result
    }
    return 0
  })
})

function getColumnWeight(key: string) {
  if (key === 'id' || key.includes('_id')) return 1
  if (key.includes('name')) return 1.5
  return 1.2
}

const columns = computed(() => {
  const fields = props.formFields.slice(0, 6)
  const width = containerWidth.value || 720
  const totalWeight = fields.reduce((sum, field) => sum + getColumnWeight(field.key), 0)
  return fields.map((field) => {
    const weight = getColumnWeight(field.key)
    return {
      key: field.key,
      dataKey: field.key,
      title: field.label,
      width: Math.max(120, Math.floor((weight / totalWeight) * width)),
    }
  })
})

const tableWidth = computed(() => {
  const width = containerWidth.value || 720
  return Math.max(
    width,
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

function addSortRule() {
  sortRules.value.push({ id: Date.now() + sortRules.value.length, field: '', order: 'asc' })
}

function removeSortRule(id: number) {
  sortRules.value = sortRules.value.length > 1 ? sortRules.value.filter((rule) => rule.id !== id) : sortRules.value
}

function resetControls() {
  keyword.value = ''
  filterField.value = ''
  filterValue.value = ''
  Object.keys(rangeFilters).forEach((key) => {
    rangeFilters[key] = { min: '', max: '' }
  })
  sortRules.value = [{ id: Date.now(), field: '', order: 'asc' }]
}

watch(tableWrapperRef, (el) => {
  if (el) nextTick(() => setupObserver(el))
})

watch(
  () => props.formFields,
  () => resetControls(),
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <el-card class="entity-list">
    <template #header>
      <div class="entity-list__header">
        <span>已有记录</span>
        <div class="entity-list__counts">
          <el-tag
            size="small"
            type="info"
          >
            筛选后 {{ displayedRecords.length }}
          </el-tag>
          <el-tag size="small">总计 {{ records.length }}</el-tag>
        </div>
      </div>
    </template>

    <div class="entity-list__toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="全局搜索"
      />

      <el-select
        v-model="filterField"
        clearable
        placeholder="筛选字段"
      >
        <el-option
          v-for="field in formFields"
          :key="field.key"
          :label="field.label"
          :value="field.key"
        />
      </el-select>

      <el-select
        v-if="filterField && selectFields.some((field) => field.key === filterField)"
        v-model="filterValue"
        clearable
        filterable
        placeholder="选择筛选值"
      >
        <el-option
          v-for="value in uniqueValues(filterField)"
          :key="value"
          :label="value"
          :value="value"
        />
      </el-select>
      <el-input
        v-else
        v-model="filterValue"
        clearable
        :disabled="!filterField"
        placeholder="字段包含"
      />

      <el-button @click="resetControls">清空</el-button>
    </div>

    <el-collapse class="entity-list__advanced">
      <el-collapse-item
        title="高级筛选与多字段排序"
        name="advanced"
      >
        <div class="entity-list__range-grid">
          <div
            v-for="field in numericFields"
            :key="field.key"
            class="range-filter"
          >
            <span class="range-filter__label">{{ field.label }}</span>
            <el-date-picker
              v-if="field.type === 'date'"
              v-model="getRange(field.key).min"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="开始"
            />
            <el-input
              v-else
              v-model="getRange(field.key).min"
              type="number"
              placeholder="最小"
            />
            <el-date-picker
              v-if="field.type === 'date'"
              v-model="getRange(field.key).max"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="结束"
            />
            <el-input
              v-else
              v-model="getRange(field.key).max"
              type="number"
              placeholder="最大"
            />
          </div>
        </div>

        <div class="entity-list__sort-list">
          <div
            v-for="(rule, index) in sortRules"
            :key="rule.id"
            class="sort-rule"
          >
            <span class="sort-rule__index">排序 {{ index + 1 }}</span>
            <el-select
              v-model="rule.field"
              clearable
              placeholder="排序字段"
            >
              <el-option
                v-for="field in formFields"
                :key="field.key"
                :label="field.label"
                :value="field.key"
              />
            </el-select>
            <el-segmented
              v-model="rule.order"
              :options="[
                { label: '升序', value: 'asc' },
                { label: '降序', value: 'desc' },
              ]"
            />
            <el-button
              text
              type="danger"
              :disabled="sortRules.length === 1"
              @click="removeSortRule(rule.id)"
            >
              删除
            </el-button>
          </div>
          <el-button
            type="primary"
            plain
            @click="addSortRule"
          >
            添加排序条件
          </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>

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
      v-else-if="!displayedRecords.length"
      class="entity-list__empty"
    >
      <el-empty description="没有符合条件的数据" />
    </div>

    <div
      v-else
      ref="tableWrapperRef"
      class="entity-list__table-wrapper"
    >
      <el-table-v2
        :columns="columns"
        :data="displayedRecords"
        :width="tableWidth"
        :height="500"
        :row-key="'id'"
      >
        <template #header-cell="{ column }">
          <div class="entity-list__header-cell">
            <span>{{ column.title }}</span>
            <el-tag
              v-if="activeSortRules.find((rule) => rule.field === column.dataKey)"
              size="small"
              effect="plain"
            >
              {{ activeSortRules.findIndex((rule) => rule.field === column.dataKey) + 1 }}
              {{ activeSortRules.find((rule) => rule.field === column.dataKey)?.order === 'asc' ? '升' : '降' }}
            </el-tag>
          </div>
        </template>

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
  &__header,
  &__counts,
  &__toolbar,
  &__header-cell,
  .sort-rule {
    display: flex;
    align-items: center;
  }

  &__header {
    justify-content: space-between;
    font-weight: 600;
  }

  &__counts {
    gap: $spacing-sm;
  }

  &__toolbar {
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;

    .el-input,
    .el-select {
      width: 180px;
    }
  }

  &__advanced {
    margin-bottom: $spacing-md;
  }

  &__range-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__sort-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__skeleton,
  &__empty {
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

  &__header-cell {
    gap: 6px;
    overflow: hidden;
  }

  &__cell {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.range-filter {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: $spacing-sm;

  &__label {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-date-editor,
  .el-input {
    width: 100%;
  }
}

.sort-rule {
  gap: $spacing-sm;

  &__index {
    width: 64px;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  .el-select {
    width: 180px;
  }
}

@media (max-width: 960px) {
  .entity-list {
    &__toolbar {
      .el-input,
      .el-select,
      .el-button {
        width: 100%;
      }
    }

    &__range-grid {
      grid-template-columns: 1fr;
    }
  }

  .range-filter,
  .sort-rule {
    align-items: stretch;
    grid-template-columns: 1fr;
    flex-direction: column;

    .el-select {
      width: 100%;
    }
  }
}
</style>
