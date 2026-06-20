<script setup lang="ts">
import { onMounted } from 'vue'
import { useOperations } from '@/composables/useOperations'
import PageHeader from '@/components/common/PageHeader.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import InventoryPriorityTable from '@/components/operations/InventoryPriorityTable.vue'
import SupplierRankTable from '@/components/operations/SupplierRankTable.vue'
import LogisticsAlertTable from '@/components/operations/LogisticsAlertTable.vue'
import HighCostTable from '@/components/operations/HighCostTable.vue'
import AiForecastPanel from '@/components/ai-studio/AiForecastPanel.vue'

const { loading, snapshot, error, fetchSnapshot } = useOperations()

onMounted(() => {
  fetchSnapshot()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="业务分析"
      description="库存、供应商、物流、成本四大维度综合分析与处理建议"
    />

    <el-alert
      v-if="error"
      class="operations__alert"
      type="error"
      :title="error"
      show-icon
      :closable="false"
    />

    <div
      v-if="snapshot?.metadata"
      class="operations__meta"
    >
      <span>数据源：{{ snapshot.metadata.source }}</span>
      <span>更新时间：{{ snapshot.metadata.updatedAt }}</span>
      <span v-if="snapshot.metadata.quality">数据质量：{{ snapshot.metadata.quality.status }}</span>
    </div>

    <el-skeleton
      :loading="loading"
      animated
      :count="2"
    >
      <template #default>
        <div class="card-grid card-grid--4 operations__metrics">
          <MetricCard
            title="缺货商品"
            :value="snapshot?.metrics?.shortageItems ?? 0"
            icon="Box"
            color="#f56c6c"
            suffix="项"
          />
          <MetricCard
            title="库存预警"
            :value="snapshot?.metrics?.warningItems ?? 0"
            icon="Warning"
            color="#e6a23c"
            suffix="项"
          />
          <MetricCard
            title="高风险供应商"
            :value="snapshot?.metrics?.highRiskSuppliers ?? 0"
            icon="User"
            color="#f56c6c"
            suffix="家"
          />
          <MetricCard
            title="延迟路线"
            :value="snapshot?.metrics?.delayedRoutes ?? 0"
            icon="Van"
            color="#409eff"
            suffix="条"
          />
        </div>

        <el-alert
          v-if="snapshot?.suggestions?.length"
          class="operations__suggestions"
          type="info"
          show-icon
          :closable="false"
        >
          <template #title>
            <span>{{ snapshot.suggestions.join(' ') }}</span>
          </template>
        </el-alert>

        <section class="operations__forecast">
          <h3 class="operations__section-title">需求预测</h3>
          <AiForecastPanel />
        </section>

        <div class="operations">
          <InventoryPriorityTable :data="snapshot?.inventory ?? []" />
          <SupplierRankTable :data="snapshot?.suppliers ?? []" />
          <LogisticsAlertTable :data="snapshot?.logistics ?? []" />
          <HighCostTable :data="snapshot?.costs ?? []" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped lang="scss">
.operations {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-md;

  &__alert,
  &__meta,
  &__metrics,
  &__suggestions {
    margin-bottom: $spacing-md;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__forecast {
    margin-bottom: $spacing-lg;
  }

  &__section-title {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-primary);
    font-weight: 600;
    font-size: $font-size-lg;
  }
}

@media (max-width: 960px) {
  .operations {
    grid-template-columns: 1fr;
  }
}
</style>
