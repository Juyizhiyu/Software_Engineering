<script setup>
import { computed, onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency, formatNumber } from '../utils/format'

const items = ref([])

const stats = computed(() => ({
  shortage: items.value.filter((item) => item.stockStatus === 'shortage').length,
  warning: items.value.filter((item) => item.stockStatus === 'warning').length,
  overstock: items.value.filter((item) => item.stockStatus === 'overstock').length,
}))

onMounted(async () => {
  const res = await request.get('/inventory/analysis')
  if (res.success) items.value = res.data
})
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">Inventory</p>
        <h3>库存分析</h3>
      </div>
      <p class="section-note">按安全库存、补货缺口和单位成本识别最需要处理的库存项。</p>
    </div>

    <div class="triple-grid">
      <article class="metric-card">
        <span class="metric-label">缺货风险</span>
        <p class="metric-value">{{ formatNumber(stats.shortage) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">预警项</span>
        <p class="metric-value">{{ formatNumber(stats.warning) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">积压项</span>
        <p class="metric-value">{{ formatNumber(stats.overstock) }}</p>
      </article>
    </div>

    <article class="table-card">
      <h4>库存明细</h4>
      <table>
        <thead>
          <tr>
            <th>产品</th>
            <th>仓库</th>
            <th>现库存</th>
            <th>安全库存</th>
            <th>缺口</th>
            <th>单位成本</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <td>{{ item.productName }}</td>
            <td>{{ item.warehouseName }}</td>
            <td>{{ formatNumber(item.currentStock) }}</td>
            <td>{{ formatNumber(item.safetyStock) }}</td>
            <td :class="item.stockGap < 0 ? 'danger-text' : 'success-text'">{{ formatNumber(item.stockGap) }}</td>
            <td>{{ formatCurrency(item.unitCost) }}</td>
            <td><span class="pill" :data-tone="item.stockStatus === 'shortage' ? 'danger' : item.stockStatus === 'warning' ? 'warning' : 'success'">{{ item.stockStatusLabel }}</span></td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>
