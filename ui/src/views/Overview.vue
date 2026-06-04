<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { getDashboardSummary, getDashboardOverview } from '@/api/dashboard'
import type { DashboardSummary, DashboardOverview } from '@/types'
import { formatCurrency, formatNumber, formatLargeNumber } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import ServiceStatus from '@/components/common/ServiceStatus.vue'

const isDark = useDark()
const loading = ref(true)
const summary = ref<DashboardSummary | null>(null)
const overview = ref<DashboardOverview | null>(null)

onMounted(async () => {
  try {
    const [summaryRes, overviewRes] = await Promise.all([
      getDashboardSummary(),
      getDashboardOverview(),
    ])
    summary.value = summaryRes.data
    overview.value = overviewRes.data
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  } finally {
    loading.value = false
  }
})

// ECharts 主题色
const chartTheme = computed(() => ({
  textColor: isDark.value ? '#cfd3dc' : '#606266',
  backgroundColor: 'transparent',
}))

// 销售趋势图表配置
const salesChartOption = computed(() => ({
  tooltip: { trigger: 'axis' as const },
  grid: { left: 60, right: 20, top: 20, bottom: 40 },
  xAxis: {
    type: 'category' as const,
    data: overview.value?.salesTrend.map((i) => i.date.slice(5)) || [],
    axisLabel: { color: chartTheme.value.textColor, fontSize: 11 },
    axisLine: { lineStyle: { color: isDark.value ? '#4c4d4f' : '#e4e7ed' } },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: {
      color: chartTheme.value.textColor,
      fontSize: 11,
      formatter: (v: number) => formatLargeNumber(v),
    },
    splitLine: { lineStyle: { color: isDark.value ? '#363637' : '#f0f0f0' } },
  },
  series: [
    {
      type: 'bar' as const,
      data: overview.value?.salesTrend.map((i) => i.amount) || [],
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
}))

// 风险分布图表配置
const riskChartOption = computed(() => ({
  tooltip: { trigger: 'item' as const },
  legend: {
    bottom: 0,
    textStyle: { color: chartTheme.value.textColor, fontSize: 12 },
  },
  series: [
    {
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data:
        overview.value?.riskDistribution.map((i) => ({
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
        })) || [],
    },
  ],
}))
</script>

<template>
  <div class="page-container">
    <div class="overview">
      <!-- 页面头部 -->
      <div class="overview__header">
        <PageHeader title="全局总览" description="供应链经营核心指标一览" />
        <ServiceStatus />
      </div>

      <el-skeleton :loading="loading" animated :count="1">
        <template #default>
          <!-- 指标卡片 -->
          <div class="card-grid card-grid--4 overview__stats">
            <StatCard
              title="订单总量"
              :value="summary ? formatNumber(summary.totalOrders) : '-'"
              icon="Document"
              color="#409eff"
            />
            <StatCard
              title="销售额"
              :value="summary ? formatCurrency(summary.totalSales) : '-'"
              icon="Money"
              color="#67c23a"
            />
            <StatCard
              title="库存总量"
              :value="summary ? formatNumber(summary.totalStock) : '-'"
              icon="Box"
              color="#e6a23c"
            />
            <StatCard
              title="供应链风险"
              :value="summary ? String(summary.openRisks) : '-'"
              icon="Warning"
              color="#f56c6c"
              suffix="项"
            />
          </div>

          <!-- 图表区域 -->
          <div class="overview__charts">
            <div class="overview__chart-card">
              <h3 class="overview__chart-title">销售走势</h3>
              <div class="overview__chart-wrap">
                <v-chart :option="salesChartOption" autoresize />
              </div>
            </div>
            <div class="overview__chart-card">
              <h3 class="overview__chart-title">风险分布</h3>
              <div class="overview__chart-wrap">
                <v-chart :option="riskChartOption" autoresize />
              </div>
            </div>
          </div>

          <!-- 信息列表区域 -->
          <div class="overview__lists">
            <!-- 库存预警 -->
            <div class="overview__list-card">
              <h3 class="overview__list-title">库存预警</h3>
              <el-table
                :data="overview?.inventoryAlerts.slice(0, 5)"
                size="small"
                stripe
                :max-height="280"
              >
                <el-table-column prop="productName" label="产品" min-width="100" show-overflow-tooltip />
                <el-table-column prop="warehouseName" label="仓库" width="100" show-overflow-tooltip />
                <el-table-column prop="currentStock" label="当前库存" width="80" align="right">
                  <template #default="{ row }">
                    <span class="mono">{{ row.currentStock }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="stockStatusLabel" label="状态" width="70" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="
                        row.stockStatus === 'shortage'
                          ? 'danger'
                          : row.stockStatus === 'warning'
                            ? 'warning'
                            : 'info'
                      "
                      size="small"
                    >
                      {{ row.stockStatusLabel }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 优选供应商 -->
            <div class="overview__list-card">
              <h3 class="overview__list-title">优选供应商</h3>
              <el-table
                :data="overview?.topSuppliers.slice(0, 5)"
                size="small"
                stripe
                :max-height="280"
              >
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
            </div>

            <!-- 最近订单 -->
            <div class="overview__list-card">
              <h3 class="overview__list-title">最近订单</h3>
              <el-table
                :data="overview?.recentOrders.slice(0, 5)"
                size="small"
                stripe
                :max-height="280"
              >
                <el-table-column prop="orderId" label="订单号" min-width="80" show-overflow-tooltip />
                <el-table-column prop="date" label="日期" width="100" />
                <el-table-column prop="amount" label="金额" width="100" align="right">
                  <template #default="{ row }">
                    <span class="mono">{{ formatCurrency(row.amount) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.overview {
  &__header {
    @include flex-between;
    margin-bottom: $spacing-lg;
  }

  &__stats {
    margin-bottom: $spacing-lg;
  }

  &__charts {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__chart-card {
    @include card;
  }

  &__chart-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
  }

  &__chart-wrap {
    height: 280px;

    :deep(div) {
      width: 100% !important;
      height: 100% !important;
    }
  }

  &__lists {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;
  }

  &__list-card {
    @include card;
  }

  &__list-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
  }
}
</style>
