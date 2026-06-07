<script setup lang="ts">
import type { LogisticsItem } from '@/types'

defineProps<{
  data: LogisticsItem[]
}>()
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">物流异常</span>
    </template>
    <el-table :data="data" size="small" stripe :max-height="300">
      <el-table-column prop="shipmentId" label="运单号" width="130" />
      <el-table-column prop="routeName" label="路线" min-width="100" show-overflow-tooltip />
      <el-table-column prop="carrier" label="承运商" min-width="80" />
      <el-table-column prop="delayHours" label="延迟(h)" width="80" align="right">
        <template #default="{ row }">
          <span class="mono" style="color: var(--el-color-danger)">{{ row.delayHours }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="statusLabel" label="状态" width="70" align="center">
        <template #default="{ row }">
          <el-tag type="danger" size="small">{{ row.statusLabel }}</el-tag>
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
