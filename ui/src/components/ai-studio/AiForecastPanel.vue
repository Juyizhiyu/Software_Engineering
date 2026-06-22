<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiForecast } from '@/composables/useAiForecast'
import { formatLargeNumber } from '@/utils/format'
import {
  borderColors,
  getChartAxisLabel,
  getChartSplitLine,
  getChartTooltip,
  textColors,
  themeColors,
} from '@/utils/theme'

const {
  loading,
  suppliersLoading,
  scope,
  productId,
  supplierId,
  suppliers,
  selectedSupplier,
  result,
  error,
  fetchSuppliers,
  submit,
} = useAiForecast()

const demoProductId = 'DEMO_FORECAST_SKU_001'

const confidenceLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const trendLabels: Record<string, string> = {
  up: '上升',
  upward: '上升',
  down: '下降',
  stable: '平稳',
  unknown: '未知',
}
const sourceLabels: Record<string, string> = {
  mysql: 'MySQL真实历史',
  demo: '演示序列',
  'supplier-rule-fallback': '供应商规则降级',
}

function formatForecastRange(
  interval: { lower: number; point: number; upper: number } | undefined,
  fallback: number | undefined,
) {
  if (interval) {
    return `${interval.lower.toFixed(0)} - ${interval.upper.toFixed(0)}`
  }
  return fallback != null ? fallback.toFixed(0) : '-'
}

const demandChartOption = computed(() => {
  const history = result.value?.chart_data?.history ?? []
  const forecast = result.value?.chart_data?.forecast ?? []
  const dates = [...history.map((item) => item.date), ...forecast.map((item) => item.date)]

  return {
    tooltip: {
      trigger: 'axis' as const,
      ...getChartTooltip(),
    },
    legend: {
      data: ['历史销量', '预测中位', '预测下界', '预测上界'],
      bottom: 0,
      textStyle: { color: textColors.secondary(), fontSize: 12 },
    },
    grid: { left: 64, right: 24, top: 28, bottom: 64 },
    xAxis: {
      type: 'category' as const,
      data: dates.map((date) => date.slice(5)),
      axisLabel: getChartAxisLabel(),
      axisLine: { lineStyle: { color: borderColors.light() } },
    },
    yAxis: {
      type: 'value' as const,
      name: '销量',
      nameTextStyle: { color: textColors.secondary(), fontSize: 11 },
      axisLabel: {
        ...getChartAxisLabel(),
        formatter: (value: number) => formatLargeNumber(value),
      },
      splitLine: getChartSplitLine(),
    },
    series: [
      {
        name: '历史销量',
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: [...history.map((item) => item.quantity), ...forecast.map(() => null)],
        lineStyle: { color: themeColors.primary(), width: 2 },
        itemStyle: { color: themeColors.primary() },
        areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
      },
      {
        name: '预测中位',
        type: 'line' as const,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        data: [...history.map(() => null), ...forecast.map((item) => item.quantity)],
        lineStyle: { color: themeColors.warning(), width: 2, type: 'dashed' },
        itemStyle: { color: themeColors.warning() },
        areaStyle: { color: 'rgba(230, 162, 60, 0.12)' },
      },
      {
        name: '预测下界',
        type: 'line' as const,
        smooth: true,
        symbol: 'none',
        data: [...history.map(() => null), ...forecast.map((item) => item.quantityLower ?? item.quantity)],
        lineStyle: { color: themeColors.warning(), width: 1, type: 'dotted' },
        itemStyle: { color: themeColors.warning() },
      },
      {
        name: '预测上界',
        type: 'line' as const,
        smooth: true,
        symbol: 'none',
        data: [...history.map(() => null), ...forecast.map((item) => item.quantityUpper ?? item.quantity)],
        lineStyle: { color: themeColors.warning(), width: 1, type: 'dotted' },
        itemStyle: { color: themeColors.warning() },
      },
    ],
  }
})

const costChartOption = computed(() => {
  const breakdown = result.value?.chart_data?.cost_breakdown ?? []

  return {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      ...getChartTooltip(),
      formatter: (params: { name: string; value: number }[]) => {
        const item = params[0]
        return item ? `${item.name}<br/>${formatLargeNumber(item.value)}` : ''
      },
    },
    grid: { left: 78, right: 86, top: 20, bottom: 24 },
    xAxis: {
      type: 'value' as const,
      axisLabel: {
        ...getChartAxisLabel(),
        show: false,
        formatter: (value: number) => formatLargeNumber(value),
      },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: {
        ...getChartSplitLine(),
        lineStyle: { color: borderColors.lighter(), type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category' as const,
      data: breakdown.map((item) => item.name),
      axisLabel: getChartAxisLabel(),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: borderColors.light() } },
    },
    series: [
      {
        name: '历史成本',
        type: 'bar' as const,
        data: breakdown.map((item) => item.value),
        barWidth: 20,
        label: {
          show: true,
          position: 'right' as const,
          color: textColors.secondary(),
          fontSize: 11,
          formatter: (params: { value: number }) => formatLargeNumber(params.value),
        },
        itemStyle: {
          color: themeColors.success(),
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  }
})

const hasDemandChart = computed(() => {
  const chartData = result.value?.chart_data
  return Boolean((chartData?.history?.length ?? 0) || (chartData?.forecast?.length ?? 0))
})

const hasCostChart = computed(() => Boolean(result.value?.chart_data?.cost_breakdown?.length))

async function handleSubmit() {
  try {
    await submit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '预测失败')
  }
}

function useDemoProduct() {
  scope.value = 'product'
  productId.value = demoProductId
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<template>
  <div class="ai-panel">
    <el-card
      shadow="hover"
      class="ai-panel__input"
    >
      <div class="ai-panel__scope">
        <el-segmented
          v-model="scope"
          :options="[
            { label: '按商品预测', value: 'product' },
            { label: '按供应商预测', value: 'supplier' },
          ]"
        />
      </div>

      <div class="ai-panel__input-row">
        <el-input
          v-if="scope === 'product'"
          v-model="productId"
          placeholder="输入商品 ID（如 P001）"
          style="max-width: 320px"
          @keyup.enter="handleSubmit"
        >
          <template #prepend>商品ID</template>
        </el-input>

        <el-select
          v-else
          v-model="supplierId"
          class="ai-panel__supplier-select"
          filterable
          :loading="suppliersLoading"
          placeholder="选择供应商"
          no-data-text="暂无供应商数据"
        >
          <el-option
            v-for="supplier in suppliers"
            :key="supplier.supplierId"
            :label="`${supplier.supplierName}（${supplier.supplierId}）`"
            :value="supplier.supplierId"
          >
            <div class="supplier-option">
              <span>{{ supplier.supplierName }}</span>
              <span class="supplier-option__meta">
                {{ supplier.supplierId }} · {{ supplier.region }} · {{ supplier.compositeScore.toFixed(1) }}分
              </span>
            </div>
          </el-option>
        </el-select>

        <el-button
          type="primary"
          :loading="loading"
          :disabled="scope === 'product' ? !productId : !supplierId"
          style="min-width: 88px"
          @click="handleSubmit"
        >
          预测
        </el-button>
      </div>

      <div
        v-if="scope === 'supplier' && selectedSupplier"
        class="supplier-summary"
      >
        <el-tag type="info">{{ selectedSupplier.region }}</el-tag>
        <span>综合评分 {{ selectedSupplier.compositeScore.toFixed(1) }}</span>
        <span>销量 {{ selectedSupplier.totalUnits }}</span>
        <span>GMV {{ selectedSupplier.totalGmv.toFixed(0) }}</span>
      </div>

      <el-alert
        v-if="error"
        type="warning"
        :closable="false"
        show-icon
        class="ai-panel__demo-alert"
        :title="error"
      />

      <el-alert
        v-if="scope === 'product'"
        type="info"
        :closable="false"
        show-icon
        class="ai-panel__demo-alert"
      >
        <template #title>
          测试预测 ID：
          <button
            class="ai-panel__demo-id"
            type="button"
            @click="useDemoProduct"
          >
            {{ demoProductId }}
          </button>
          。真实商品历史不足时会显示原因说明。
        </template>
      </el-alert>
    </el-card>

    <el-card
      v-if="result"
      shadow="hover"
      class="ai-panel__result"
    >
      <h4 class="ai-panel__title">{{ result.product_name || result.product_id }} 需求预测</h4>
      <div class="forecast-stats">
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">7天预测区间</span>
          <span class="forecast-stats__value forecast-stats__value--range mono">
            {{ formatForecastRange(result.forecast_interval_7d, result.forecast_demand_7d) }}
          </span>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">30天预测区间</span>
          <span class="forecast-stats__value forecast-stats__value--range mono">
            {{ formatForecastRange(result.forecast_interval_30d, result.forecast_demand_30d) }}
          </span>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">置信度</span>
          <el-tag
            :type="result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'warning' : 'danger'"
            effect="dark"
          >
            {{ confidenceLabels[result.confidence] || result.confidence }}
          </el-tag>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">趋势</span>
          <el-tag
            :type="result.trend === 'up' || result.trend === 'upward' ? 'success' : result.trend === 'down' ? 'danger' : 'info'"
            effect="dark"
          >
            {{ trendLabels[result.trend] || result.trend }}
          </el-tag>
        </el-card>
      </div>
      <p class="ai-panel__answer">{{ result.analysis }}</p>
      <div
        v-if="hasDemandChart"
        class="forecast-report"
      >
        <div class="forecast-report__main">
          <div class="forecast-report__header">
            <h5>销量趋势与预测</h5>
            <span>历史 {{ result.chart_data?.history?.length ?? 0 }} 天 · 预测 7 天</span>
          </div>
          <div class="forecast-report__chart forecast-report__chart--large">
            <v-chart
              :option="demandChartOption"
              autoresize
            />
          </div>
        </div>

        <div
          v-if="hasCostChart"
          class="forecast-report__side"
        >
          <div class="forecast-report__header">
            <h5>成本结构</h5>
            <span>历史窗口汇总</span>
          </div>
          <div class="forecast-report__chart">
            <v-chart
              :option="costChartOption"
              autoresize
            />
          </div>
        </div>
      </div>

      <div
        v-if="result.report_sections?.length"
        class="report-sections"
      >
        <div
          v-for="section in result.report_sections"
          :key="section.title"
          class="report-section"
        >
          <span class="report-section__title">{{ section.title }}</span>
          <p>{{ section.content }}</p>
        </div>
      </div>

      <div
        v-if="result.recommendations?.length"
        class="recommendations"
      >
        <h5>处理建议</h5>
        <ul>
          <li
            v-for="item in result.recommendations"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <el-alert
        v-if="result.metadata?.mode === 'insufficient-data'"
        type="warning"
        :closable="false"
        show-icon
        class="ai-panel__warning"
        title="当前对象缺少连续历史销量，无法完成可靠预测。"
      />
      <div
        v-if="result.metadata"
        class="ai-panel__meta"
      >
        <el-tag
          size="small"
          effect="plain"
        >
          {{ result.metadata.mode }}
        </el-tag>
        <el-tag
          v-if="result.metadata.method"
          size="small"
          effect="plain"
          type="info"
        >
          {{ result.metadata.method }}
        </el-tag>
        <el-tag
          v-if="result.metadata.history_source"
          size="small"
          effect="plain"
          type="success"
        >
          {{ sourceLabels[result.metadata.history_source] || result.metadata.history_source }}
        </el-tag>
        <el-tag
          v-if="result.metadata.history_count"
          size="small"
          effect="plain"
          type="info"
        >
          历史记录 {{ result.metadata.history_count }} 条
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.ai-panel {
  width: 100%;
  max-width: none;
  min-width: 0;

  &__input {
    margin-bottom: $spacing-lg;
  }

  &__scope {
    margin-bottom: $spacing-md;
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__supplier-select {
    max-width: 520px;
    width: 100%;
  }

  &__demo-alert,
  &__warning {
    margin-top: $spacing-md;
  }

  &__demo-id {
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--el-color-primary);
    font: inherit;
    font-family: $font-family-mono;
    cursor: pointer;
  }

  &__result {
    animation: fadeIn 0.3s ease;
  }

  &__title {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-primary);
    font-weight: 600;
    font-size: $font-size-lg;
  }

  &__answer {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }
}

.supplier-option {
  display: flex;
  justify-content: space-between;
  gap: $spacing-md;

  &__meta {
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
  }
}

.supplier-summary {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  color: var(--el-text-color-secondary);
  font-size: $font-size-sm;
}

.forecast-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  &__item {
    text-align: center;

    :deep(.el-card__body) {
      padding: $spacing-md;
    }
  }

  &__label {
    display: block;
    margin-bottom: $spacing-xs;
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
  }

  &__value {
    display: block;
    color: var(--el-text-color-primary);
    font-weight: 700;
    font-size: $font-size-xxl;

    &--range {
      font-size: $font-size-xl;
      white-space: nowrap;
    }
  }
}

.forecast-report {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(360px, 0.9fr);
  gap: $spacing-md;
  margin: $spacing-lg 0;

  &__main,
  &__side {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $border-radius;
    padding: $spacing-md;
    background: var(--el-bg-color);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: $spacing-sm;

    h5 {
      margin: 0;
      color: var(--el-text-color-primary);
      font-size: $font-size-md;
    }

    span {
      color: var(--el-text-color-secondary);
      font-size: $font-size-xs;
    }
  }

  &__chart {
    height: clamp(280px, 34vh, 420px);
    min-width: 0;

    &--large {
      height: clamp(380px, 48vh, 560px);
    }

    :deep(> div) {
      width: 100% !important;
      height: 100% !important;
    }
  }
}

.report-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.report-section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $border-radius;
  padding: $spacing-md;
  background: var(--el-fill-color-extra-light);

  &__title {
    display: block;
    margin-bottom: $spacing-xs;
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--el-text-color-regular);
    line-height: 1.7;
    font-size: $font-size-sm;
  }
}

.recommendations {
  margin-bottom: $spacing-md;

  h5 {
    margin: 0 0 $spacing-sm;
    color: var(--el-text-color-primary);
    font-size: $font-size-md;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }
}

@media (max-width: 1180px) {
  .forecast-report {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .ai-panel__input-row,
  .supplier-option {
    align-items: stretch;
    flex-direction: column;
  }

  .forecast-stats {
    grid-template-columns: 1fr;
  }

  .report-sections {
    grid-template-columns: 1fr;
  }

  .forecast-stats__value--range {
    white-space: normal;
  }

  .forecast-report__chart,
  .forecast-report__chart--large {
    height: 320px;
  }
}

@keyframes fadeIn {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
