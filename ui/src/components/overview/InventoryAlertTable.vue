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
        prop="stockStatusLabel"
        label="状态"
        width="90"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            v-if="row.stockStatus"
            :type="
              row.stockStatus === 'shortage'
                ? 'danger'
                : row.stockStatus === 'warning' || row.stockStatus === 'overstock'
                  ? 'warning'
                  : 'info'
            "
            size="small"
          >
            {{ row.stockStatusLabel }}
          </el-tag>
          <el-tag
            v-else
            :type="row.stockStatusLabel?.includes('缺货') || row.stockStatusLabel?.includes('紧张') ? 'danger' : row.stockStatusLabel?.includes('预警') || row.stockStatusLabel?.includes('积压') ? 'warning' : 'info'"
            size="small"
          >
            {{ row.stockStatusLabel }}
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
