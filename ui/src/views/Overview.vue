<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getDashboardSummary, getDashboardOverview } from '@/api/dashboard'
import type {
  CostRankingItem,
  DashboardOverview,
  DashboardSummary,
  LogisticsItem,
  OverviewChartKey,
  OverviewMetricKey,
  OverviewTableKey,
} from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'
import {
  borderColors,
  getChartAxisLabel,
  getChartSplitLine,
  getChartTooltip,
  riskLevelColors,
  riskLevelLabels,
  stockStatusColors,
  textColors,
  themeColors,
} from '@/utils/theme'
import PageHeader from '@/components/common/PageHeader.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import ServiceStatus from '@/components/common/ServiceStatus.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import InventoryAlertTable from '@/components/overview/InventoryAlertTable.vue'
import TopSupplierTable from '@/components/overview/TopSupplierTable.vue'
import RecentOrderTable from '@/components/overview/RecentOrderTable.vue'
import {
  overviewChartOptions,
  overviewMetricOptions,
  overviewTableOptions,
  useOverviewConfig,
} from '@/composables/useOverviewConfig'

defineOptions({
  name: 'OverviewView',
})

const loading = ref(true)
const error = ref('')
const summary = ref<DashboardSummary | null>(null)
const overview = ref<DashboardOverview | null>(null)
const configDrawerVisible = ref(false)
const configDrawerTab = ref<'metrics' | 'charts' | 'tables'>('metrics')
const { config, saveConfig, resetConfig } = useOverviewConfig()

const filters = reactive({
  region: '',
  date: '',
  category: '',
})

const regionOptions = ['华南', '华东', '华北', '西南', '华中']
const categoryOptions = ['综合', '服饰', '食品', '美妆', '电子', '家居']

const metadata = computed(() => summary.value?.metadata || overview.value?.metadata || null)

const metricDefinitions: Record<
  OverviewMetricKey,
  { title: string; icon: string; color: string; suffix?: string; value: (data: DashboardSummary) => string }
> = {
  totalOrders: {
    title: '订单总量',
    icon: 'Document',
    color: '#409eff',
    value: (data) => formatNumber(data.totalOrders),
  },
  totalSales: {
    title: '销售额',
    icon: 'Money',
    color: '#67c23a',
    value: (data) => formatCurrency(data.totalSales),
  },
  totalStock: {
    title: '库存总量',
    icon: 'Box',
    color: '#e6a23c',
    value: (data) => formatNumber(data.totalStock),
  },
  openRisks: {
    title: '供应链风险',
    icon: 'Warning',
    color: '#f56c6c',
    suffix: '项',
    value: (data) => String(data.openRisks),
  },
  averageOrderAmount: {
    title: '客单价',
    icon: 'DataLine',
    color: '#909399',
    value: (data) => formatCurrency(data.averageOrderAmount),
  },
  shortageCount: {
    title: '缺货数',
    icon: 'Bell',
    color: '#f56c6c',
    suffix: '项',
    value: (data) => String(data.shortageCount),
  },
  delayedShipments: {
    title: '延迟发货',
    icon: 'Van',
    color: '#e6a23c',
    suffix: '单',
    value: (data) => String(data.delayedShipments),
  },
  totalCost: {
    title: '总成本',
    icon: 'Coin',
    color: '#626aef',
    value: (data) => formatCurrency(data.totalCost),
  },
  supplierScoreAvg: {
    title: '供应商均分',
    icon: 'TrendCharts',
    color: '#14b8a6',
    suffix: '分',
    value: (data) => data.supplierScoreAvg.toFixed(1),
  },
}

const visibleMetrics = computed(() =>
  overviewMetricOptions
    .filter((item) => config.visibleMetrics[item.key])
    .map((item) => ({ key: item.key, ...metricDefinitions[item.key] })),
)

const visibleCharts = computed(() => overviewChartOptions.filter((item) => config.visibleCharts[item.key]))
const visibleTables = computed(() => overviewTableOptions.filter((item) => config.visibleTables[item.key]))
const hiddenMetricCount = computed(() => overviewMetricOptions.filter((item) => !config.visibleMetrics[item.key]).length)
const hiddenChartCount = computed(() => overviewChartOptions.filter((item) => !config.visibleCharts[item.key]).length)
const hiddenTableCount = computed(() => overviewTableOptions.filter((item) => !config.visibleTables[item.key]).length)

const salesTrendOption = computed(() => ({
  tooltip: { trigger: 'axis', ...getChartTooltip() },
  legend: {
    data: ['销售额', '订单量'],
    bottom: 0,
    textStyle: { color: textColors.secondary(), fontSize: 12 },
  },
  grid: { left: 60, right: 60, top: 20, bottom: 72 },
  xAxis: {
    type: 'category',
    data: overview.value?.salesTrend.map((item) => item.date.slice(5)) ?? [],
    axisLabel: getChartAxisLabel(),
    axisLine: { lineStyle: { color: borderColors.light() } },
  },
  yAxis: [
    {
      type: 'value',
      name: '销售额',
      nameTextStyle: { color: textColors.secondary(), fontSize: 11 },
      axisLabel: getChartAxisLabel(),
      splitLine: getChartSplitLine(),
    },
    {
      type: 'value',
      name: '订单量',
      nameTextStyle: { color: textColors.secondary(), fontSize: 11 },
      axisLabel: getChartAxisLabel(),
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '销售额',
      type: 'bar',
      yAxisIndex: 0,
      data: overview.value?.salesTrend.map((item) => item.amount) ?? [],
      itemStyle: { color: themeColors.primary(), borderRadius: [4, 4, 0, 0] },
      barWidth: '48%',
    },
    {
      name: '订单量',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: overview.value?.salesTrend.map((item) => item.quantity ?? 0) ?? [],
      lineStyle: { color: themeColors.success(), width: 2 },
      itemStyle: { color: themeColors.success() },
    },
  ],
}))

const riskDistributionOption = computed(() => ({
  tooltip: { trigger: 'item', ...getChartTooltip() },
  legend: { bottom: 0, textStyle: { color: textColors.secondary(), fontSize: 12 } },
  series: [
    {
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['50%', '45%'],
      label: { show: false },
      data:
        overview.value?.riskDistribution.map((item) => ({
          name: riskLevelLabels[item.level] || item.level,
          value: item.count,
          itemStyle: { color: riskLevelColors[item.level]?.() || themeColors.info() },
        })) ?? [],
    },
  ],
}))

const costTrendOption = computed(() => ({
  tooltip: { trigger: 'axis', ...getChartTooltip() },
  legend: {
    data: ['总成本', '采购成本'],
    bottom: 0,
    textStyle: { color: textColors.secondary(), fontSize: 12 },
  },
  grid: { left: 56, right: 24, top: 24, bottom: 68 },
  xAxis: {
    type: 'category',
    data: overview.value?.costTrend?.map((item) => item.date.slice(5)) ?? [],
    axisLabel: getChartAxisLabel(),
  },
  yAxis: { type: 'value', axisLabel: getChartAxisLabel(), splitLine: getChartSplitLine() },
  series: [
    {
      name: '总成本',
      type: 'line',
      smooth: true,
      areaStyle: {},
      data: overview.value?.costTrend?.map((item) => item.totalCost) ?? [],
      itemStyle: { color: themeColors.warning() },
      lineStyle: { color: themeColors.warning(), width: 2 },
    },
    {
      name: '采购成本',
      type: 'line',
      smooth: true,
      data: overview.value?.costTrend?.map((item) => item.purchaseCost) ?? [],
      itemStyle: { color: themeColors.primary() },
      lineStyle: { color: themeColors.primary(), width: 2 },
    },
  ],
}))

const delayedRoutesOption = computed(() => ({
  tooltip: { trigger: 'axis', ...getChartTooltip() },
  grid: { left: 48, right: 24, top: 24, bottom: 52 },
  xAxis: {
    type: 'category',
    data: overview.value?.delayedRoutes?.map((item) => item.routeName || item.shipmentId) ?? [],
    axisLabel: { ...getChartAxisLabel(), interval: 0, rotate: 18 },
  },
  yAxis: { type: 'value', name: '小时', axisLabel: getChartAxisLabel(), splitLine: getChartSplitLine() },
  series: [
    {
      name: '延迟时长',
      type: 'bar',
      barWidth: '42%',
      data: overview.value?.delayedRoutes?.map((item) => item.delayHours) ?? [],
      itemStyle: { color: themeColors.danger(), borderRadius: [4, 4, 0, 0] },
    },
  ],
}))

const inventoryStatusOption = computed(() => ({
  tooltip: { trigger: 'item', ...getChartTooltip() },
  legend: { bottom: 0, textStyle: { color: textColors.secondary(), fontSize: 12 } },
  series: [
    {
      type: 'pie',
      radius: ['38%', '68%'],
      center: ['50%', '45%'],
      data:
        overview.value?.inventoryStatus?.map((item) => ({
          name: item.label,
          value: item.count,
          itemStyle: { color: stockStatusColors[item.status]?.() || themeColors.info() },
        })) ?? [],
    },
  ],
}))

const supplierScoresOption = computed(() => ({
  tooltip: { trigger: 'axis', ...getChartTooltip() },
  grid: { left: 42, right: 24, top: 24, bottom: 70 },
  xAxis: {
    type: 'category',
    data: overview.value?.supplierScores?.map((item) => item.supplierName) ?? [],
    axisLabel: { ...getChartAxisLabel(), interval: 0, rotate: 22 },
  },
  yAxis: { type: 'value', min: 0, max: 100, axisLabel: getChartAxisLabel(), splitLine: getChartSplitLine() },
  series: [
    {
      name: '综合评分',
      type: 'bar',
      barWidth: '44%',
      data: overview.value?.supplierScores?.map((item) => item.compositeScore) ?? [],
      itemStyle: { color: themeColors.success(), borderRadius: [4, 4, 0, 0] },
    },
  ],
}))

const chartOptions = computed<Record<OverviewChartKey, unknown>>(() => ({
  salesTrend: salesTrendOption.value,
  riskDistribution: riskDistributionOption.value,
  costTrend: costTrendOption.value,
  delayedRoutes: delayedRoutesOption.value,
  inventoryStatus: inventoryStatusOption.value,
  supplierScores: supplierScoresOption.value,
}))

const chartDataCounts = computed<Record<OverviewChartKey, number>>(() => ({
  salesTrend: overview.value?.salesTrend.length ?? 0,
  riskDistribution: overview.value?.riskDistribution.reduce((sum, item) => sum + item.count, 0) ?? 0,
  costTrend: overview.value?.costTrend?.length ?? 0,
  delayedRoutes: overview.value?.delayedRoutes?.length ?? 0,
  inventoryStatus: overview.value?.inventoryStatus?.reduce((sum, item) => sum + item.count, 0) ?? 0,
  supplierScores: overview.value?.supplierScores?.length ?? 0,
}))

function tableDataCount(key: OverviewTableKey) {
  if (key === 'inventoryAlerts') return overview.value?.inventoryAlerts.length ?? 0
  if (key === 'topSuppliers') return overview.value?.topSuppliers.length ?? 0
  if (key === 'recentOrders') return overview.value?.recentOrders.length ?? 0
  if (key === 'delayedRoutes') return overview.value?.delayedRoutes?.length ?? 0
  return overview.value?.costRanking?.length ?? 0
}

async function loadDashboard() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      region: filters.region || undefined,
      date: filters.date || undefined,
      category: filters.category || undefined,
    }
    const [summaryRes, overviewRes] = await Promise.all([getDashboardSummary(params), getDashboardOverview(params)])
    summary.value = summaryRes.data
    overview.value = overviewRes.data
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '总览数据加载失败'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.region = ''
  filters.date = ''
  filters.category = ''
  loadDashboard()
}

function handleSaveConfig() {
  saveConfig()
  configDrawerVisible.value = false
}

function handleResetConfig() {
  resetConfig()
}

function openAddDrawer(tab: 'metrics' | 'charts' | 'tables') {
  configDrawerTab.value = tab
  configDrawerVisible.value = true
}

function addMetric(key: OverviewMetricKey) {
  config.visibleMetrics[key] = true
  saveConfig()
}

function removeMetric(key: OverviewMetricKey) {
  config.visibleMetrics[key] = false
  saveConfig()
}

function addChart(key: OverviewChartKey) {
  config.visibleCharts[key] = true
  saveConfig()
}

function removeChart(key: OverviewChartKey) {
  config.visibleCharts[key] = false
  saveConfig()
}

function addTable(key: OverviewTableKey) {
  config.visibleTables[key] = true
  saveConfig()
}

function removeTable(key: OverviewTableKey) {
  config.visibleTables[key] = false
  saveConfig()
}

function logisticsRowKey(row: LogisticsItem) {
  return row.shipmentId || row.orderId
}

function costRowKey(row: CostRankingItem) {
  return `${row.productId}-${row.date}`
}

onMounted(loadDashboard)
</script>

<template>
  <div class="page-container">
    <div class="overview">
      <div class="overview__header">
        <PageHeader
          title="全局总览"
          description="实时监控订单、库存、供应商、物流、成本与风险状态"
        />
        <div class="overview__actions">
          <ServiceStatus />
          <el-button @click="openAddDrawer('metrics')">添加内容</el-button>
        </div>
      </div>

      <div class="overview__filters">
        <el-select
          v-model="filters.region"
          clearable
          placeholder="区域"
        >
          <el-option
            v-for="item in regionOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
        <el-date-picker
          v-model="filters.date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="业务日期"
        />
        <el-select
          v-model="filters.category"
          clearable
          placeholder="品类"
        >
          <el-option
            v-for="item in categoryOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
        <el-button
          type="primary"
          :loading="loading"
          @click="loadDashboard"
        >
          应用筛选
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-alert
        v-if="error"
        class="overview__alert"
        type="error"
        :title="error"
        show-icon
        :closable="false"
      />

      <el-alert
        v-else-if="metadata?.fallbackReason"
        class="overview__alert"
        type="warning"
        :title="`当前使用 ${metadata.source} 数据源，原因：${metadata.fallbackReason}`"
        show-icon
        :closable="false"
      />

      <div
        v-if="metadata"
        class="overview__meta"
      >
        <span>数据源：{{ metadata.source }}</span>
        <span>更新时间：{{ metadata.updatedAt }}</span>
        <span v-if="metadata.quality">数据质量：{{ metadata.quality.status }}</span>
      </div>

      <div class="overview__quick-add">
        <el-button
          plain
          @click="openAddDrawer('metrics')"
        >
          添加指标
          <el-tag
            v-if="hiddenMetricCount"
            size="small"
            effect="plain"
          >
            {{ hiddenMetricCount }}
          </el-tag>
        </el-button>
        <el-button
          plain
          @click="openAddDrawer('charts')"
        >
          添加图表
          <el-tag
            v-if="hiddenChartCount"
            size="small"
            effect="plain"
          >
            {{ hiddenChartCount }}
          </el-tag>
        </el-button>
        <el-button
          plain
          @click="openAddDrawer('tables')"
        >
          添加数据表
          <el-tag
            v-if="hiddenTableCount"
            size="small"
            effect="plain"
          >
            {{ hiddenTableCount }}
          </el-tag>
        </el-button>
      </div>

      <el-skeleton
        :loading="loading"
        animated
        :count="1"
      >
        <template #default>
          <div
            v-if="visibleMetrics.length"
            class="card-grid card-grid--4 overview__stats"
          >
            <div
              v-for="metric in visibleMetrics"
              :key="metric.key"
              class="overview__metric-shell"
            >
              <MetricCard
                :title="metric.title"
                :value="summary ? metric.value(summary) : '-'"
                :icon="metric.icon"
                :color="metric.color"
                :suffix="metric.suffix"
              />
              <el-button
                class="overview__remove-button"
                circle
                size="small"
                text
                title="移除"
                @click="removeMetric(metric.key)"
              >
                ×
              </el-button>
            </div>
          </div>

          <div
            v-if="visibleCharts.length"
            class="overview__charts"
            :class="{ 'is-compact': config.compactMode }"
          >
            <el-card
              v-for="chart in visibleCharts"
              :key="chart.key"
              shadow="hover"
            >
              <template #header>
                <div class="overview__card-header">
                  <span class="card-title">{{ chart.label }}</span>
                  <el-button
                    size="small"
                    text
                    @click="removeChart(chart.key)"
                  >
                    移除
                  </el-button>
                </div>
              </template>
              <div
                v-if="chartDataCounts[chart.key] > 0"
                class="overview__chart"
              >
                <v-chart
                  :option="chartOptions[chart.key]"
                  autoresize
                />
              </div>
              <EmptyState
                v-else
                description="暂无图表数据"
              />
            </el-card>
          </div>

          <div
            v-if="visibleTables.length"
            class="overview__lists"
            :class="{ 'is-compact': config.compactMode }"
          >
            <div
              v-for="table in visibleTables"
              :key="table.key"
              class="overview__table-shell"
            >
              <template v-if="table.key === 'inventoryAlerts'">
                <InventoryAlertTable
                  v-if="tableDataCount(table.key) > 0"
                  :data="overview?.inventoryAlerts ?? []"
                />
                <el-card
                  v-else
                  shadow="hover"
                >
                  <template #header>
                    <span class="card-title">{{ table.label }}</span>
                  </template>
                  <EmptyState description="暂无表格数据" />
                </el-card>
              </template>

              <template v-else-if="table.key === 'topSuppliers'">
                <TopSupplierTable
                  v-if="tableDataCount(table.key) > 0"
                  :data="overview?.topSuppliers ?? []"
                />
                <el-card
                  v-else
                  shadow="hover"
                >
                  <template #header>
                    <span class="card-title">{{ table.label }}</span>
                  </template>
                  <EmptyState description="暂无表格数据" />
                </el-card>
              </template>

              <template v-else-if="table.key === 'recentOrders'">
                <RecentOrderTable
                  v-if="tableDataCount(table.key) > 0"
                  :data="overview?.recentOrders ?? []"
                />
                <el-card
                  v-else
                  shadow="hover"
                >
                  <template #header>
                    <span class="card-title">{{ table.label }}</span>
                  </template>
                  <EmptyState description="暂无表格数据" />
                </el-card>
              </template>

              <el-card
                v-else-if="table.key === 'delayedRoutes'"
                shadow="hover"
              >
                <template #header>
                  <span class="card-title">延迟物流列表</span>
                </template>
                <el-table
                  v-if="tableDataCount(table.key) > 0"
                  :data="overview?.delayedRoutes ?? []"
                  :row-key="logisticsRowKey"
                  border
                  size="small"
                  stripe
                  :max-height="280"
                  style="width: 100%"
                  :scroll-x="true"
                >
                  <el-table-column
                    prop="routeName"
                    label="路线"
                    min-width="120"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="carrier"
                    label="承运商"
                    width="100"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="delayHours"
                    label="延迟"
                    width="80"
                    align="right"
                  >
                    <template #default="{ row }">
                      <span class="mono">{{ row.delayHours }}h</span>
                    </template>
                  </el-table-column>
                </el-table>
                <EmptyState
                  v-else
                  description="暂无表格数据"
                />
              </el-card>

              <el-card
                v-else-if="table.key === 'costRanking'"
                shadow="hover"
              >
                <template #header>
                  <span class="card-title">成本排行</span>
                </template>
                <el-table
                  v-if="tableDataCount(table.key) > 0"
                  :data="overview?.costRanking ?? []"
                  :row-key="costRowKey"
                  border
                  size="small"
                  stripe
                  :max-height="280"
                  style="width: 100%"
                  :scroll-x="true"
                >
                  <el-table-column
                    prop="productName"
                    label="产品"
                    min-width="130"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="date"
                    label="日期"
                    width="96"
                  />
                  <el-table-column
                    prop="totalCost"
                    label="总成本"
                    width="110"
                    align="right"
                  >
                    <template #default="{ row }">
                      <span class="mono">{{ formatCurrency(row.totalCost) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <EmptyState
                  v-else
                  description="暂无表格数据"
                />
              </el-card>

              <div class="overview__panel-remove">
                <el-button
                  size="small"
                  text
                  @click="removeTable(table.key)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>

      <el-drawer
        v-model="configDrawerVisible"
        title="添加总览内容"
        size="420px"
      >
        <div class="overview__config">
          <el-tabs v-model="configDrawerTab">
            <el-tab-pane
              label="指标"
              name="metrics"
            >
              <div class="overview__module-picker">
                <div
                  v-for="item in overviewMetricOptions"
                  :key="item.key"
                  class="overview__module-option"
                  :class="{ 'is-active': config.visibleMetrics[item.key] }"
                >
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ config.visibleMetrics[item.key] ? '已在总览中显示' : '点击添加到指标区' }}</span>
                  </div>
                  <el-button
                    v-if="config.visibleMetrics[item.key]"
                    size="small"
                    @click="removeMetric(item.key)"
                  >
                    移除
                  </el-button>
                  <el-button
                    v-else
                    size="small"
                    type="primary"
                    @click="addMetric(item.key)"
                  >
                    添加
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane
              label="图表"
              name="charts"
            >
              <div class="overview__module-picker">
                <div
                  v-for="item in overviewChartOptions"
                  :key="item.key"
                  class="overview__module-option"
                  :class="{ 'is-active': config.visibleCharts[item.key] }"
                >
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ config.visibleCharts[item.key] ? '已在总览中显示' : '点击添加到图表区' }}</span>
                  </div>
                  <el-button
                    v-if="config.visibleCharts[item.key]"
                    size="small"
                    @click="removeChart(item.key)"
                  >
                    移除
                  </el-button>
                  <el-button
                    v-else
                    size="small"
                    type="primary"
                    @click="addChart(item.key)"
                  >
                    添加
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane
              label="数据表"
              name="tables"
            >
              <div class="overview__module-picker">
                <div
                  v-for="item in overviewTableOptions"
                  :key="item.key"
                  class="overview__module-option"
                  :class="{ 'is-active': config.visibleTables[item.key] }"
                >
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ config.visibleTables[item.key] ? '已在总览中显示' : '点击添加到数据表区' }}</span>
                  </div>
                  <el-button
                    v-if="config.visibleTables[item.key]"
                    size="small"
                    @click="removeTable(item.key)"
                  >
                    移除
                  </el-button>
                  <el-button
                    v-else
                    size="small"
                    type="primary"
                    @click="addTable(item.key)"
                  >
                    添加
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
          <div class="overview__layout-toggle">
            <span>布局密度</span>
            <el-switch
              v-model="config.compactMode"
              active-text="紧凑模式"
              inactive-text="标准模式"
              @change="saveConfig()"
            />
          </div>
          <div class="overview__drawer-actions">
            <el-button @click="handleResetConfig">恢复默认</el-button>
            <el-button
              type="primary"
              @click="handleSaveConfig"
            >
              完成
            </el-button>
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.overview {
  &__header {
    @include flex-between;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__actions,
  &__filters,
  &__meta,
  &__quick-add,
  &__card-header,
  &__layout-toggle,
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
      width: 180px;
    }
  }

  &__alert,
  &__meta {
    margin-bottom: $spacing-md;
  }

  &__meta {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__stats {
    margin-bottom: $spacing-lg;
  }

  &__quick-add {
    margin-bottom: $spacing-md;

    .el-button {
      display: inline-flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }

  &__metric-shell,
  &__table-shell {
    position: relative;
    min-width: 0;
  }

  &__remove-button {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-danger);
    }
  }

  &__panel-remove {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 2;
  }

  &__card-header {
    justify-content: space-between;
    width: 100%;
  }

  &__charts,
  &__lists {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    &.is-compact {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  &__chart {
    height: 320px;

    :deep(> div) {
      width: 100% !important;
      height: 100% !important;
    }
  }

  &__config {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__module-picker {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }

  &__module-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-md;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: $spacing-sm $spacing-md;
    background: var(--el-bg-color);

    strong,
    span {
      display: block;
    }

    span {
      margin-top: 2px;
      color: var(--el-text-color-secondary);
      font-size: $font-size-sm;
    }

    &.is-active {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }

  &__layout-toggle {
    justify-content: space-between;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }

  &__drawer-actions {
    justify-content: flex-end;
  }
}

.card-title {
  font-weight: 600;
  font-size: $font-size-md;
}

@media (max-width: 1200px) {
  .overview {
    &__charts,
    &__charts.is-compact,
    &__lists,
    &__lists.is-compact {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: 960px) {
  .overview {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__actions,
    &__filters,
    &__quick-add {
      width: 100%;

      .el-select,
      .el-date-editor,
      .el-button {
        width: 100%;
      }
    }

    &__quick-add {
      .el-button {
        justify-content: center;
      }
    }

    &__charts,
    &__charts.is-compact,
    &__lists,
    &__lists.is-compact {
      grid-template-columns: 1fr;
    }

    &__chart {
      height: 280px;
    }
  }
}
</style>
