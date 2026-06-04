<script setup lang="ts">
import { computed } from 'vue'
import { useDark } from '@vueuse/core'
import type { RiskDistItem } from '@/types'

const props = defineProps<{
  data: RiskDistItem[]
}>()

const isDark = useDark()

const chartOption = computed(() => {
  const textColor = isDark.value ? '#cfd3dc' : '#606266'
  return {
    tooltip: { trigger: 'item' as const },
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
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: props.data.map((i) => ({
          name: i.level,
          value: i.count,
          itemStyle: {
            color:
              i.level === 'Critical'
                ? '#f56c6c'
                : i.level === 'High'
                  ? '#e6a23c'
                  : i.level === 'Medium'
                    ? '#409eff'
                    : '#67c23a',
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

  :deep(div) {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
