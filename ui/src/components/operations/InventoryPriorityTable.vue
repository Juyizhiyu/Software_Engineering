<script setup lang="ts">
import type { InventoryItem } from '@/types'
import { stockStatusColor } from '@/utils/format'

defineProps<{
  data: InventoryItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">库存优先处理</span>
    </template>
    <el-table :data="data" size="small" stripe :max-height="300">
      <el-table-column prop="productName" label="产品" min-width="100" show-overflow-tooltip />
      <el-table-column prop="warehouseName" label="仓库" width="100" show-overflow-tooltip />
      <el-table-column prop="currentStock" label="当前库存" width="80" align="right">
        <template #default="{ row }">
          <span class="mono">{{ row.currentStock }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="safetyStock" label="安全库存" width="80" align="right">
        <template #default="{ row }">
          <span class="mono">{{ row.safetyStock }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stockStatusLabel" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag
            :color="stockStatusColor(row.stockStatus)"
            effect="dark"
            size="small"
            style="border: none"
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
  font-size: $font-size-md;
  font-weight: 600;
}
</style>
