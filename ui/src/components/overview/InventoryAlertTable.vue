<script setup lang="ts">
import type { InventoryAlertItem } from '@/types'

defineProps<{
  data: InventoryAlertItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">库存预警</span>
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
        prop="productName"
        label="产品"
        min-width="100"
        show-overflow-tooltip
      />
      <el-table-column
        prop="warehouseName"
        label="仓库"
        width="100"
        show-overflow-tooltip
      />
      <el-table-column
        prop="currentStock"
        label="当前库存"
        width="80"
        align="right"
      >
        <template #default="{ row }">
          <span class="mono">{{ row.currentStock }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="状态"
        width="90"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            :type="
              row.stockStatus === 'shortage' || row.stockStatus === 'danger' || row.status === 'danger'
                ? 'danger'
                : row.stockStatus === 'warning' || row.stockStatus === 'overstock'
                  ? 'warning'
                  : 'info'
            "
            size="small"
          >
            {{ row.stockStatusLabel || (row.stockStatus === 'shortage' || row.status === 'danger' ? '缺货' : row.stockStatus === 'warning' ? '预警' : row.stockStatus === 'overstock' ? '积压' : row.stockStatus === 'healthy' ? '正常' : row.status === 'danger' ? '缺货' : row.status || '-') }}
          </el-tag>
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
