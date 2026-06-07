<script setup lang="ts">
import { formatCurrency } from '@/utils/format'
import type { RecentOrder } from '@/types'

defineProps<{
  data: RecentOrder[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">最近订单</span>
    </template>
    <el-table
      :data="data.slice(0, 10)"
      border
      size="small"
      stripe
      :max-height="280"
      style="width: 100%"
      :scroll-x="true"
    >
      <el-table-column
        prop="orderId"
        label="订单号"
        min-width="80"
        show-overflow-tooltip
      />
      <el-table-column
        prop="date"
        label="日期"
        width="100"
      />
      <el-table-column
        prop="amount"
        label="金额"
        width="100"
        align="right"
      >
        <template #default="{ row }">
          <span class="mono">{{ formatCurrency(row.amount) }}</span>
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
