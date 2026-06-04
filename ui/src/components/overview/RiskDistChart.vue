<script setup lang="ts">
import { computed } from 'vue'
import { useDark } from '@vueuse/core'
import type { RiskDistItem } from '@/types'

const props = defineProps<{
  data: RiskDistItem[]
}>()

const isDark = useDark()

const riskLevelMap: Record<string, string> = {
  Critical: '严重',
  High: '高危',
  Medium: '中等',
  Low: '低危',
}

const riskColorMap: Record<string, string> = {
  Critical: '#f56c6c',
  High: '#e6a23c',
  Medium: '#409eff',
  Low: '#67c23a',
}

const chartOption = computed(() => {
  const textColor = isDark.value ? '#cfd3dc' : '#606266'
  const tooltipBg = isDark.value ? '#252538' : '#fff'
  const tooltipBorder = isDark.value ? '#4c4d4f' : '#e4e7ed'
  return {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: textColor },
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColor, fontSize: 12 },
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
            color: textColor,
            textBorderColor: isDark.value ? '#252538' : '#fff',
            textBorderWidth: 2,
          },
        },
        data: props.data.map((i) => ({
          name: riskLevelMap[i.level] || i.level,
          value: i.count,
          itemStyle: {
            color: riskColorMap[i.level] || '#909399',
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

  :deep(> div) {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
