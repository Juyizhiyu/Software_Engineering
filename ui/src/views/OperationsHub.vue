<script setup lang="ts">
import { onMounted } from 'vue'
import { useOperations } from '@/composables/useOperations'
import PageHeader from '@/components/common/PageHeader.vue'
import InventoryPriorityTable from '@/components/operations/InventoryPriorityTable.vue'
import SupplierRankTable from '@/components/operations/SupplierRankTable.vue'
import LogisticsAlertTable from '@/components/operations/LogisticsAlertTable.vue'
import HighCostTable from '@/components/operations/HighCostTable.vue'

const { loading, snapshot, fetchSnapshot } = useOperations()

onMounted(() => {
  fetchSnapshot()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="业务分析"
      description="库存、供应商、物流、成本四大维度综合分析"
    />

    <el-skeleton
      :loading="loading"
      animated
      :count="2"
    >
      <template #default>
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
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}
</style>
