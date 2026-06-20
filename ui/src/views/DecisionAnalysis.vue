<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import { useDecisionAnalysis } from '@/composables/useDecisionAnalysis'

const {
  loading,
  error,
  analysis,
  filters,
  config,
  visibleMetrics,
  visibleSuggestions,
  fetchAnalysis,
  refreshAnalysis,
  applyFilters,
  saveConfig,
  resetConfig,
} = useDecisionAnalysis()

const configDrawerVisible = ref(false)
const regionOptions = ['华南', '华东', '华北', '西南', '华中']
const categoryOptions = ['综合', '服饰', '食品', '美妆', '电子', '家居']
const riskOptions = [
  { label: '全部风险', value: '' },
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
  { label: '严重风险', value: 'critical' },
]
const dimensionOptions = [
  { label: '综合决策', value: 'overview' },
  { label: '库存优先', value: 'inventory' },
  { label: '供应商优先', value: 'supplier' },
  { label: '物流优先', value: 'logistics' },
  { label: '成本优先', value: 'cost' },
]
const moduleOptions = [
  { key: 'metrics', label: '核心指标' },
  { key: 'salesTrend', label: '销售趋势' },
  { key: 'riskMatrix', label: '风险矩阵' },
  { key: 'costBreakdown', label: '成本拆分' },
  { key: 'suggestions', label: '智能建议' },
]

const riskLevelText = computed(() => {
  const map = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '严重风险',
  }
  return analysis.value ? map[analysis.value.riskLevel] : '待分析'
})

const riskLevelType = computed(() => {
  const level = analysis.value?.riskLevel
  if (level === 'critical' || level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'success'
})

const salesTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 24, top: 32, bottom: 40 },
  xAxis: {
    type: 'category',
    data: analysis.value?.charts.salesTrend.map((item) => item.date.slice(5)) ?? [],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      areaStyle: {},
      data: analysis.value?.charts.salesTrend.map((item) => item.amount) ?? [],
    },
  ],
}))

const riskMatrixOption = computed(() => ({
  tooltip: { trigger: 'item' },
  xAxis: {
    type: 'category',
    data: analysis.value?.charts.riskMatrix.map((item) => item.name) ?? [],
  },
  yAxis: { type: 'value' },
  grid: { left: 36, right: 20, top: 24, bottom: 36 },
  series: [
    {
      name: '风险数量',
      type: 'bar',
      barWidth: '42%',
      data:
        analysis.value?.charts.riskMatrix.map((item) => ({
          value: item.value,
          itemStyle: {
            color:
              item.level === 'high'
                ? '#f56c6c'
                : item.level === 'medium'
                  ? '#e6a23c'
                  : '#67c23a',
          },
        })) ?? [],
    },
  ],
}))

const costBreakdownOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { show: false },
  series: [
    {
      name: '成本',
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      minShowLabelAngle: 8,
      label: {
        formatter: (params: { name: string; percent?: number }) => {
          const name = params.name.length > 10 ? `${params.name.slice(0, 10)}...` : params.name
          return `${name}\n${params.percent ?? 0}%`
        },
        width: 92,
        overflow: 'break',
        lineHeight: 16,
        fontSize: 11,
      },
      labelLine: {
        length: 12,
        length2: 8,
        maxSurfaceAngle: 80,
      },
      labelLayout: {
        hideOverlap: true,
      },
      data: analysis.value?.charts.costBreakdown ?? [],
    },
  ],
}))

function statusColor(status: string) {
  if (status === 'danger') return '#f56c6c'
  if (status === 'warning') return '#e6a23c'
  return '#409eff'
}

function priorityType(priority: string) {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function priorityText(priority: string) {
  if (priority === 'high') return '高优先级'
  if (priority === 'medium') return '中优先级'
  return '低优先级'
}

function handleApplyFilters() {
  applyFilters({ ...filters })
}

function handleSaveConfig() {
  saveConfig()
  configDrawerVisible.value = false
}

function handleResetConfig() {
  resetConfig()
  fetchAnalysis()
}

function exportAnalysis() {
  if (!analysis.value) return
  const blob = new Blob([JSON.stringify(analysis.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `decision-analysis-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchAnalysis()
})
</script>

<template>
  <div class="page-container decision-analysis" data-testid="decision-analysis-page">
    <div class="decision-analysis__header">
      <PageHeader
        title="决策分析"
        description="交互式分析、风险研判与智能决策建议"
      />
      <div class="decision-analysis__actions">
        <el-tag :type="riskLevelType" size="large">{{ riskLevelText }}</el-tag>
        <el-button :loading="loading" @click="refreshAnalysis()">刷新</el-button>
        <el-button @click="configDrawerVisible = true">配置</el-button>
        <el-button type="primary" :disabled="!analysis" @click="exportAnalysis">导出</el-button>
      </div>
    </div>

    <div class="decision-analysis__filters" data-testid="decision-filters">
      <el-select v-model="filters.region" clearable placeholder="区域">
        <el-option v-for="item in regionOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-date-picker v-model="filters.date" type="date" value-format="YYYY-MM-DD" placeholder="业务日期" />
      <el-select v-model="filters.category" clearable placeholder="品类">
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="filters.riskLevel" clearable placeholder="风险等级">
        <el-option v-for="item in riskOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="filters.dimension" placeholder="分析维度">
        <el-option v-for="item in dimensionOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="handleApplyFilters">应用分析</el-button>
    </div>

    <el-alert
      v-if="error"
      class="decision-analysis__alert"
      type="error"
      :title="error"
      show-icon
      :closable="false"
    />

    <div v-if="analysis?.metadata" class="decision-analysis__meta">
      <span>数据源：{{ analysis.metadata.source }}</span>
      <span>更新时间：{{ analysis.metadata.updatedAt }}</span>
      <span v-if="analysis.metadata.quality">数据质量：{{ analysis.metadata.quality.status }}</span>
      <span v-if="analysis.metadata.ai">AI 模式：{{ analysis.metadata.ai.mode }}</span>
    </div>

    <el-skeleton :loading="loading" animated :count="2">
      <template #default>
        <div
          v-if="config.visibleModules.metrics"
          class="card-grid card-grid--4 decision-analysis__metrics"
          data-testid="decision-metrics"
        >
          <MetricCard
            v-for="metric in visibleMetrics"
            :key="metric.key"
            :title="metric.label"
            :value="metric.value.toLocaleString('zh-CN')"
            :suffix="metric.unit"
            icon="DataAnalysis"
            :color="statusColor(metric.status)"
          />
        </div>

        <div class="decision-analysis__charts" :class="{ 'is-compact': config.compactMode }">
          <el-card v-if="config.visibleModules.salesTrend" shadow="hover" data-testid="sales-trend-card">
            <template #header>销售趋势</template>
            <div class="decision-analysis__chart">
              <v-chart :option="salesTrendOption" autoresize />
            </div>
          </el-card>
          <el-card v-if="config.visibleModules.riskMatrix" shadow="hover" data-testid="risk-matrix-card">
            <template #header>风险矩阵</template>
            <div class="decision-analysis__chart">
              <v-chart :option="riskMatrixOption" autoresize />
            </div>
          </el-card>
          <el-card v-if="config.visibleModules.costBreakdown" shadow="hover" data-testid="cost-breakdown-card">
            <template #header>成本拆分</template>
            <div class="decision-analysis__chart">
              <v-chart :option="costBreakdownOption" autoresize />
            </div>
          </el-card>
        </div>

        <el-card v-if="config.visibleModules.suggestions" shadow="hover" data-testid="decision-suggestions">
          <template #header>
            <div class="decision-analysis__card-header">
              <span>智能决策建议</span>
              <el-tag>{{ visibleSuggestions.length }} 条</el-tag>
            </div>
          </template>
          <el-empty v-if="!visibleSuggestions.length" description="暂无需要处理的决策建议" />
          <div v-else class="decision-analysis__suggestions">
            <div v-for="item in visibleSuggestions" :key="item.id" class="decision-analysis__suggestion">
              <div class="decision-analysis__suggestion-title">
                <strong>{{ item.title }}</strong>
                <el-tag :type="priorityType(item.priority)" size="small">{{ priorityText(item.priority) }}</el-tag>
              </div>
              <p>{{ item.problem }}</p>
              <p>{{ item.impact }}</p>
              <p class="decision-analysis__action">{{ item.action }}</p>
              <div class="decision-analysis__evidence">
                <el-tag v-for="evidence in item.evidence" :key="evidence" size="small" effect="plain">
                  {{ evidence }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </template>
    </el-skeleton>

    <el-drawer v-model="configDrawerVisible" title="分析配置" size="360px">
      <div class="decision-analysis__config">
        <el-form label-position="top">
          <el-form-item label="默认分析维度">
            <el-select v-model="filters.dimension">
              <el-option v-for="item in dimensionOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示模块">
            <el-checkbox
              v-for="item in moduleOptions"
              :key="item.key"
              v-model="config.visibleModules[item.key]"
              :label="item.label"
            />
          </el-form-item>
          <el-form-item label="布局">
            <el-switch v-model="config.compactMode" active-text="紧凑模式" inactive-text="标准模式" />
          </el-form-item>
        </el-form>
        <div class="decision-analysis__drawer-actions">
          <el-button @click="handleResetConfig">恢复默认</el-button>
          <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.decision-analysis {
  &__header {
    @include flex-between;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__actions,
  &__filters,
  &__meta,
  &__card-header,
  &__suggestion-title,
  &__evidence,
  &__drawer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__filters {
    margin-bottom: $spacing-md;

    .el-select,
    .el-date-editor {
      width: 170px;
    }
  }

  &__alert,
  &__meta,
  &__metrics {
    margin-bottom: $spacing-md;
  }

  &__meta {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__charts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    &.is-compact {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__chart {
    height: 300px;
  }

  &__suggestions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
  }

  &__suggestion {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: $spacing-md;
    background: var(--el-bg-color-page);

    p {
      margin: $spacing-xs 0;
      color: var(--el-text-color-regular);
    }
  }

  &__action {
    font-weight: 600;
    color: var(--el-color-primary) !important;
  }

  &__config {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__drawer-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 960px) {
  .decision-analysis {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__actions,
    &__filters {
      width: 100%;

      .el-select,
      .el-date-editor,
      .el-button {
        width: 100%;
      }
    }

    &__charts,
    &__charts.is-compact,
    &__suggestions {
      grid-template-columns: 1fr;
    }

    &__chart {
      height: 260px;
    }
  }
}
</style>
