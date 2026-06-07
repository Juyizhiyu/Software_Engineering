<script setup lang="ts">
import type { SupplierItem } from '@/types'
import { formatPercent } from '@/utils/format'

defineProps<{
  data: SupplierItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">供应商履约排名</span>
    </template>
    <el-table :data="data" size="small" stripe :max-height="300">
      <el-table-column prop="supplierName" label="供应商" min-width="100" show-overflow-tooltip />
      <el-table-column prop="region" label="区域" width="70" />
      <el-table-column prop="onTimeRate" label="准时率" width="80" align="right">
        <template #default="{ row }">
          <span class="mono">{{ formatPercent(row.onTimeRate) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="qualityRate" label="质量率" width="80" align="right">
        <template #default="{ row }">
          <span class="mono">{{ formatPercent(row.qualityRate) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="compositeScore" label="综合评分" width="80" align="right">
        <template #default="{ row }">
          <span class="mono" style="font-weight: 600">{{ row.compositeScore.toFixed(1) }}</span>
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
