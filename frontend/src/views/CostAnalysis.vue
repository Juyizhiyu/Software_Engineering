<script setup>
import { computed, onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency } from '../utils/format'

const rows = ref([])

const totals = computed(() => rows.value.reduce((acc, item) => {
  acc.purchase += item.purchaseCost
  acc.storage += item.storageCost
  acc.transport += item.transportCost
  acc.return += item.returnCost
  acc.total += item.totalCost
  return acc
}, { purchase: 0, storage: 0, transport: 0, return: 0, total: 0 }))

onMounted(async () => {
  const res = await request.get('/costs/analysis')
  if (res.success) rows.value = res.data
})
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cost</p>
        <h3>成本分析</h3>
      </div>
      <p class="section-note">按日期和产品查看采购、仓储、运输与退货成本，支撑成本归因演示。</p>
    </div>

    <div class="metric-grid">
      <article class="metric-card">
        <span class="metric-label">采购成本</span>
        <p class="metric-value">{{ formatCurrency(totals.purchase) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">仓储成本</span>
        <p class="metric-value">{{ formatCurrency(totals.storage) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">运输成本</span>
        <p class="metric-value">{{ formatCurrency(totals.transport) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">总成本</span>
        <p class="metric-value">{{ formatCurrency(totals.total) }}</p>
      </article>
    </div>

    <article class="table-card">
      <h4>成本明细</h4>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>产品</th>
            <th>采购</th>
            <th>仓储</th>
            <th>运输</th>
            <th>退货</th>
            <th>总计</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="`${item.date}-${item.productId}`"
          >
            <td>{{ item.date }}</td>
            <td>{{ item.productName }}</td>
            <td>{{ formatCurrency(item.purchaseCost) }}</td>
            <td>{{ formatCurrency(item.storageCost) }}</td>
            <td>{{ formatCurrency(item.transportCost) }}</td>
            <td>{{ formatCurrency(item.returnCost) }}</td>
            <td class="accent-text">{{ formatCurrency(item.totalCost) }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>
