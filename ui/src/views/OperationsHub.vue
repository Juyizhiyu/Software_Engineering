<script setup lang="ts">
import { onMounted } from 'vue'
import { useOperations } from '@/composables/useOperations'
import { formatCurrency, formatPercent, stockStatusColor } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'

const { loading, snapshot, fetchSnapshot } = useOperations()

onMounted(() => {
  fetchSnapshot()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="业务分析" description="库存、供应商、物流、成本四大维度综合分析" />

    <el-skeleton :loading="loading" animated :count="2">
      <template #default>
        <div class="operations">
          <!-- 库存优先处理 -->
          <div class="operations__card">
            <h3 class="operations__card-title">库存优先处理</h3>
            <el-table :data="snapshot?.inventory" size="small" stripe :max-height="300">
              <el-table-column prop="productName" label="产品" min-width="100" show-overflow-tooltip />
              <el-table-column prop="warehouseName" label="仓库" width="100" show-overflow-tooltip />
              <el-table-column prop="currentStock" label="当前库存" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono">{{ row.currentStock }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="safetyStock" label="安全库存" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono">{{ row.safetyStock }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="stockStatusLabel" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    :color="stockStatusColor(row.stockStatus)"
                    effect="dark"
                    size="small"
                    style="border: none"
                  >
                    {{ row.stockStatusLabel }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 供应商履约排名 -->
          <div class="operations__card">
            <h3 class="operations__card-title">供应商履约排名</h3>
            <el-table :data="snapshot?.suppliers" size="small" stripe :max-height="300">
              <el-table-column prop="supplierName" label="供应商" min-width="100" show-overflow-tooltip />
              <el-table-column prop="region" label="区域" width="70" />
              <el-table-column prop="onTimeRate" label="准时率" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono">{{ formatPercent(row.onTimeRate) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="qualityRate" label="质量率" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono">{{ formatPercent(row.qualityRate) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="compositeScore" label="综合评分" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono" style="font-weight: 600">{{ row.compositeScore.toFixed(1) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 物流异常 -->
          <div class="operations__card">
            <h3 class="operations__card-title">物流异常</h3>
            <el-table :data="snapshot?.logistics" size="small" stripe :max-height="300">
              <el-table-column prop="shipmentId" label="运单号" width="80" />
              <el-table-column prop="routeName" label="路线" min-width="100" show-overflow-tooltip />
              <el-table-column prop="carrier" label="承运商" width="80" />
              <el-table-column prop="delayHours" label="延迟(h)" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono" style="color: #f56c6c">{{ row.delayHours }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="statusLabel" label="状态" width="70" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.statusLabel }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 高成本记录 -->
          <div class="operations__card">
            <h3 class="operations__card-title">高成本记录</h3>
            <el-table :data="snapshot?.costs" size="small" stripe :max-height="300">
              <el-table-column prop="productName" label="产品" min-width="100" show-overflow-tooltip />
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="purchaseCost" label="采购" width="80" align="right">
                <template #default="{ row }">
                  <span class="mono">{{ formatCurrency(row.purchaseCost) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalCost" label="总成本" width="90" align="right">
                <template #default="{ row }">
                  <span class="mono" style="font-weight: 600">{{ formatCurrency(row.totalCost) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
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

  &__card {
    @include card;
  }

  &__card-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
  }
}
</style>
