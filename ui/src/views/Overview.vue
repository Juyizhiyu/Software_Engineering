<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getDashboardSummary, getDashboardOverview } from '@/api/dashboard'
import type { DashboardSummary, DashboardOverview } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import ServiceStatus from '@/components/common/ServiceStatus.vue'
import SalesTrendChart from '@/components/overview/SalesTrendChart.vue'
import RiskDistChart from '@/components/overview/RiskDistChart.vue'
import InventoryAlertTable from '@/components/overview/InventoryAlertTable.vue'
import TopSupplierTable from '@/components/overview/TopSupplierTable.vue'
import RecentOrderTable from '@/components/overview/RecentOrderTable.vue'

defineOptions({
  name: 'OverviewView',
})

const loading = ref(true)
const error = ref('')
const summary = ref<DashboardSummary | null>(null)
const overview = ref<DashboardOverview | null>(null)

const filters = reactive({
  region: '',
  date: '',
  category: '',
})

const regionOptions = ['华南', '华东', '华北', '西南', '华中']
const categoryOptions = ['综合', '服饰', '食品', '美妆', '电子', '家居']

const metadata = computed(() => summary.value?.metadata || overview.value?.metadata || null)

async function loadDashboard() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      region: filters.region || undefined,
      date: filters.date || undefined,
      category: filters.category || undefined,
    }
    const [summaryRes, overviewRes] = await Promise.all([getDashboardSummary(params), getDashboardOverview()])
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
        <ServiceStatus />
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

      <el-skeleton
        :loading="loading"
        animated
        :count="1"
      >
        <template #default>
          <div class="card-grid card-grid--4 overview__stats">
            <MetricCard
              title="订单总量"
              :value="summary ? formatNumber(summary.totalOrders) : '-'"
              icon="Document"
              color="#409eff"
            />
            <MetricCard
              title="销售额"
              :value="summary ? formatCurrency(summary.totalSales) : '-'"
              icon="Money"
              color="#67c23a"
            />
            <MetricCard
              title="库存总量"
              :value="summary ? formatNumber(summary.totalStock) : '-'"
              icon="Box"
              color="#e6a23c"
            />
            <MetricCard
              title="供应链风险"
              :value="summary ? String(summary.openRisks) : '-'"
              icon="Warning"
              color="#f56c6c"
              suffix="项"
            />
          </div>

          <div class="overview__charts">
            <SalesTrendChart :data="overview?.salesTrend ?? []" />
            <RiskDistChart :data="overview?.riskDistribution ?? []" />
          </div>

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
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
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
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__stats {
    margin-bottom: $spacing-lg;
  }

  &__charts {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__lists {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-md;
  }
}

@media (max-width: 960px) {
  .overview {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__filters {
      .el-select,
      .el-date-editor,
      .el-button {
        width: 100%;
      }
    }

    &__charts,
    &__lists {
      grid-template-columns: 1fr;
    }
  }
}
</style>
