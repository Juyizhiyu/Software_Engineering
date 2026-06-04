<script setup lang="ts">
import type { SupplierItem } from '@/types'

defineProps<{
  data: SupplierItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">优选供应商</span>
    </template>
    <el-table :data="data.slice(0, 5)" size="small" stripe :max-height="280">
      <el-table-column prop="supplierName" label="供应商" min-width="100" show-overflow-tooltip />
      <el-table-column prop="region" label="区域" width="70" />
      <el-table-column prop="compositeScore" label="综合评分" width="80" align="right">
        <template #default="{ row }">
          <span class="mono">{{ row.compositeScore.toFixed(1) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="riskLabel" label="风险" width="70" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.riskLevel === 'low' ? 'success' : row.riskLevel === 'medium' ? 'warning' : 'danger'"
            size="small"
          >
            {{ row.riskLabel }}
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
