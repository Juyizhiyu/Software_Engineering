<script setup>
import { onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format'

const snapshot = ref(null)

onMounted(async () => {
  const res = await request.get('/operations/snapshot')
  if (res.success) snapshot.value = res.data
})
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">Operations</p>
          <h3>业务分析工作区</h3>
        </div>
      </div>
      <p class="section-copy">
        将库存、供应商、物流和成本分析整合在一页，避免多个零散页面来回切换，帮助运营负责人快速定位异常并制定动作。
      </p>
    </article>

    <div v-if="snapshot" class="two-column">
      <article class="table-panel">
        <h4>库存优先处理项</h4>
        <table>
          <thead>
            <tr>
              <th>产品</th>
              <th>仓库</th>
              <th>现库存</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.inventory" :key="item.id">
              <td>{{ item.productName }}</td>
              <td>{{ item.warehouseName }}</td>
              <td>{{ formatNumber(item.currentStock) }}</td>
              <td><span class="tone-chip" :data-tone="item.stockStatus === 'shortage' ? 'danger' : item.stockStatus === 'warning' ? 'warning' : 'success'">{{ item.stockStatusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="table-panel">
        <h4>供应商履约排名</h4>
        <table>
          <thead>
            <tr>
              <th>供应商</th>
              <th>区域</th>
              <th>评分</th>
              <th>风险</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.suppliers" :key="item.id">
              <td>{{ item.supplierName }}</td>
              <td>{{ item.region }}</td>
              <td>{{ formatPercent(item.compositeScore) }}</td>
              <td><span class="tone-chip" :data-tone="item.riskLevel === 'high' ? 'danger' : item.riskLevel === 'medium' ? 'warning' : 'success'">{{ item.riskLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="table-panel">
        <h4>物流异常任务</h4>
        <table>
          <thead>
            <tr>
              <th>线路</th>
              <th>承运商</th>
              <th>延迟</th>
              <th>运费</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.logistics" :key="item.shipmentId">
              <td>{{ item.routeName }}</td>
              <td>{{ item.carrier }}</td>
              <td>{{ item.delayHours }}h</td>
              <td>{{ formatCurrency(item.transportCost) }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="table-panel">
        <h4>高成本记录</h4>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>产品</th>
              <th>总成本</th>
              <th>采购成本</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.costs" :key="`${item.date}-${item.productId}`">
              <td>{{ item.date }}</td>
              <td>{{ item.productName }}</td>
              <td>{{ formatCurrency(item.totalCost) }}</td>
              <td>{{ formatCurrency(item.purchaseCost) }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  </section>
</template>
