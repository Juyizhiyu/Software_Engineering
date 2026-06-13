<script setup lang="ts">
import type { CostItem } from '@/types'
import { formatCurrency } from '@/utils/format'

defineProps<{
  data: CostItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">高成本记录</span>
    </template>
    <el-table
      :data="data"
      size="small"
      stripe
      :max-height="300"
    >
      <el-table-column
        prop="productName"
        label="产品"
        min-width="100"
        show-overflow-tooltip
      />
      <el-table-column
        prop="date"
        label="日期"
        min-width="100"
      />
      <el-table-column
        prop="purchaseCost"
        label="采购"
        min-width="80"
        align="right"
      >
        <template #default="{ row }">
          <span class="mono">{{ formatCurrency(row.purchaseCost) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="totalCost"
        label="总成本"
        min-width="90"
        align="right"
      >
        <template #default="{ row }">
          <span
            class="mono"
            style="font-weight: 600"
          >
            {{ formatCurrency(row.totalCost) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped lang="scss">
.card-title {
  font-weight: 600;
  font-size: $font-size-md;
}
</style>
