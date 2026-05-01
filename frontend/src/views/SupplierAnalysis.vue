<script setup>
import { onMounted, ref } from 'vue'
import request from '../api/request'
import { formatPercent } from '../utils/format'

const suppliers = ref([])

onMounted(async () => {
  const res = await request.get('/suppliers/performance')
  if (res.success) suppliers.value = res.data
})
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">Suppliers</p>
        <h3>供应商分析</h3>
      </div>
      <p class="section-note">综合准时率、质量、价格稳定性和响应效率，识别优选与高风险供应商。</p>
    </div>

    <article class="table-card">
      <h4>供应商评分榜</h4>
      <table>
        <thead>
          <tr>
            <th>供应商</th>
            <th>区域</th>
            <th>准时率</th>
            <th>质量</th>
            <th>价格稳定</th>
            <th>响应</th>
            <th>综合评分</th>
            <th>风险</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in suppliers"
            :key="item.supplierId"
          >
            <td>{{ item.supplierName }}</td>
            <td>{{ item.region }}</td>
            <td>{{ formatPercent(item.onTimeRate) }}</td>
            <td>{{ formatPercent(item.qualityRate) }}</td>
            <td>{{ formatPercent(item.priceStability) }}</td>
            <td>{{ formatPercent(item.responseScore) }}</td>
            <td class="accent-text">{{ formatPercent(item.compositeScore) }}</td>
            <td><span class="pill" :data-tone="item.riskLevel === 'high' ? 'danger' : item.riskLevel === 'medium' ? 'warning' : 'success'">{{ item.riskLabel }}</span></td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>
