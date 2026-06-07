<script setup lang="ts">
import { computed } from 'vue'
import {
  themeColors,
  textColors,
  borderColors,
  bgColors,
  riskLevelColors,
  riskLevelLabels,
  getChartTooltip,
} from '@/utils/theme'
import type { RiskDistItem } from '@/types'

const props = defineProps<{
  data: RiskDistItem[]
}>()

const chartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item' as const,
      ...getChartTooltip(),
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColors.secondary(), fontSize: 12 },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: textColors.primary(),
            textBorderColor: bgColors.card(),
            textBorderWidth: 2,
          },
        },
        data: props.data.map((i) => ({
          name: riskLevelLabels[i.level] || i.level,
          value: i.count,
          itemStyle: {
            color: riskLevelColors[i.level]?.() || themeColors.info(),
          },
        })),
      },
    ],
  }
})
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <span class="card-title">风险分布</span>
    </template>
    <div class="chart-wrap">
      <v-chart
        :option="chartOption"
        autoresize
      />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.card-title {
  font-weight: 600;
  font-size: $font-size-md;
}

.chart-wrap {
  height: 280px;

  :deep(> div) {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
