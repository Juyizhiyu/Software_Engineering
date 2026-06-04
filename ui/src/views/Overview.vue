<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardSummary, getDashboardOverview } from '@/api/dashboard'
import type { DashboardSummary, DashboardOverview } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import ServiceStatus from '@/components/common/ServiceStatus.vue'
import SalesTrendChart from '@/components/overview/SalesTrendChart.vue'
import RiskDistChart from '@/components/overview/RiskDistChart.vue'
import InventoryAlertTable from '@/components/overview/InventoryAlertTable.vue'
import TopSupplierTable from '@/components/overview/TopSupplierTable.vue'
import RecentOrderTable from '@/components/overview/RecentOrderTable.vue'

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
            <SalesTrendChart :data="overview?.salesTrend ?? []" />
            <RiskDistChart :data="overview?.riskDistribution ?? []" />
          </div>

          <!-- 信息列表区域 -->
          <div class="overview__lists">
            <InventoryAlertTable :data="overview?.inventoryAlerts ?? []" />
            <TopSupplierTable :data="overview?.topSuppliers ?? []" />
            <RecentOrderTable :data="overview?.recentOrders ?? []" />
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

  &__lists {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;
  }
}
</style>
