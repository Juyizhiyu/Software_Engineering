<script setup>
import { computed, onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency, formatNumber } from '../utils/format'

const rows = ref([])

const avgDelay = computed(() => {
  if (!rows.value.length) return 0
  return rows.value.reduce((sum, item) => sum + item.delayHours, 0) / rows.value.length
})

onMounted(async () => {
  const res = await request.get('/logistics/anomalies')
  if (res.success) rows.value = res.data
})
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">Logistics</p>
        <h3>物流分析</h3>
      </div>
      <p class="section-note">当前 demo 聚焦异常运输任务，突出线路、承运商和延迟时长。</p>
    </div>

    <div class="triple-grid">
      <article class="metric-card">
        <span class="metric-label">延迟任务数</span>
        <p class="metric-value">{{ formatNumber(rows.length) }}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">平均延迟</span>
        <p class="metric-value">{{ avgDelay.toFixed(1) }}h</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">最高运费</span>
        <p class="metric-value">{{ formatCurrency(Math.max(...rows.map((item) => item.transportCost), 0)) }}</p>
      </article>
    </div>

    <article class="table-card">
      <h4>异常运输明细</h4>
      <table>
        <thead>
          <tr>
            <th>运单</th>
            <th>线路</th>
            <th>承运商</th>
            <th>计划</th>
            <th>实际</th>
            <th>延迟</th>
            <th>运费</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.shipmentId"
          >
            <td>{{ item.shipmentId }}</td>
            <td>{{ item.routeName }}</td>
            <td>{{ item.carrier }}</td>
            <td>{{ item.expectedHours }}h</td>
            <td>{{ item.actualHours }}h</td>
            <td class="danger-text">{{ item.delayHours }}h</td>
            <td>{{ formatCurrency(item.transportCost) }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>
