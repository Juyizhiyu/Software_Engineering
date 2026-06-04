<script setup lang="ts">
import { computed } from 'vue'
import { useDark } from '@vueuse/core'
import { formatLargeNumber } from '@/utils/format'
import type { SalesTrendItem } from '@/types'

const props = defineProps<{
  data: SalesTrendItem[]
}>()

const isDark = useDark()

const chartOption = computed(() => {
  const textColor = isDark.value ? '#cfd3dc' : '#606266'
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: props.data.map((i) => i.date.slice(5)),
      axisLabel: { color: textColor, fontSize: 11 },
      axisLine: { lineStyle: { color: isDark.value ? '#4c4d4f' : '#e4e7ed' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (v: number) => formatLargeNumber(v),
      },
      splitLine: { lineStyle: { color: isDark.value ? '#363637' : '#f0f0f0' } },
    },
    series: [
      {
        type: 'bar' as const,
        data: props.data.map((i) => i.amount),
        itemStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#79bbff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '60%',
      },
    ],
  }
})
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">销售走势</span>
    </template>
    <div class="chart-wrap">
      <v-chart :option="chartOption" autoresize />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.card-title {
  font-size: $font-size-md;
  font-weight: 600;
}

.chart-wrap {
  height: 280px;

  :deep(div) {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
