<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { formatLargeNumber } from '@/utils/format'
import type { SalesTrendItem } from '@/types'

const props = defineProps<{
  data: SalesTrendItem[]
}>()

const isDark = useDark()
const scaleType = ref<'linear' | 'log'>('linear')

const chartOption = computed(() => {
  const textColor = isDark.value ? '#cfd3dc' : '#606266'
  const tooltipBg = isDark.value ? '#252538' : '#fff'
  const tooltipBorder = isDark.value ? '#4c4d4f' : '#e4e7ed'
  return {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: textColor },
    },
    legend: {
      data: ['销售额', '订单量'],
      bottom: 0,
      textStyle: { color: textColor, fontSize: 12 },
    },
    grid: { left: 60, right: 60, top: 20, bottom: 80 },
    xAxis: {
      type: 'category' as const,
      data: props.data.map((i) => i.date.slice(5)),
      axisLabel: { color: textColor, fontSize: 11 },
      axisLine: { lineStyle: { color: isDark.value ? '#4c4d4f' : '#e4e7ed' } },
    },
    yAxis: [
      {
        type: scaleType.value === 'log' ? 'log' : 'value',
        name: '销售额',
        nameTextStyle: { color: textColor, fontSize: 11 },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (v: number) => formatLargeNumber(v),
        },
        splitLine: { lineStyle: { color: isDark.value ? '#363637' : '#f0f0f0' } },
      },
      {
        type: 'value' as const,
        name: '订单量',
        nameTextStyle: { color: textColor, fontSize: 11 },
        axisLabel: {
          color: textColor,
          fontSize: 11,
        },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: 'inside' as const,
        start: 0,
        end: 100,
      },
      {
        type: 'slider' as const,
        start: 0,
        end: 100,
        height: 20,
        bottom: 30,
        borderColor: isDark.value ? '#4c4d4f' : '#e4e7ed',
        fillerColor: isDark.value ? 'rgba(64,158,255,0.2)' : 'rgba(64,158,255,0.15)',
        handleStyle: { color: '#409eff' },
        textStyle: { color: textColor },
      },
    ],
    series: [
      {
        name: '销售额',
        type: 'bar' as const,
        yAxisIndex: 0,
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
        barWidth: '50%',
      },
      {
        name: '订单量',
        type: 'line' as const,
        yAxisIndex: 1,
        data: props.data.map((i) => i.quantity),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#67c23a', width: 2 },
        itemStyle: { color: '#67c23a' },
      },
    ],
  }
})
</script>

<template>
  <el-card shadow="hover">
    <template #header>
      <div class="chart-header">
        <span class="card-title">销售走势</span>
        <el-radio-group v-model="scaleType" size="small">
          <el-radio-button value="linear">线性</el-radio-button>
          <el-radio-button value="log">对数</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <div class="chart-wrap">
      <v-chart :option="chartOption" autoresize />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.chart-header {
  @include flex-between;
}

.card-title {
  font-size: $font-size-md;
  font-weight: 600;
}

.chart-wrap {
  height: 320px;

  :deep(> div) {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
