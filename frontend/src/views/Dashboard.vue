<script setup>
import { onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format'

const summary = ref(null)
const overview = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const [summaryRes, overviewRes] = await Promise.all([
      request.get('/dashboard/summary'),
      request.get('/dashboard/overview'),
    ])

    if (summaryRes.success) summary.value = summaryRes.data
    if (overviewRes.success) overview.value = overviewRes.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h3>总览驾驶舱</h3>
      </div>
      <p class="section-note">
        该页聚合订单、库存、物流、成本和风险数据，展示一个可完整运行的供应链 BI demo。
      </p>
    </div>

    <div v-if="summary" class="metric-grid">
      <article class="metric-card">
        <span class="metric-label">订单总量</span>
        <p class="metric-value">{{ formatNumber(summary.totalOrders) }}</p>
        <span class="metric-footnote">平均订单额 {{ formatCurrency(summary.averageOrderAmount) }}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">销售额</span>
        <p class="metric-value">{{ formatCurrency(summary.totalSales) }}</p>
        <span class="metric-footnote">总成本 {{ formatCurrency(summary.totalCost) }}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">库存总量</span>
        <p class="metric-value">{{ formatNumber(summary.totalStock) }}</p>
        <span class="metric-footnote">低库存项 {{ formatNumber(summary.shortageCount) }}</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">风险与履约</span>
        <p class="metric-value">{{ formatNumber(summary.openRisks) }}</p>
        <span class="metric-footnote">
          延迟运输 {{ formatNumber(summary.delayedShipments) }}，供应商均分 {{ formatPercent(summary.supplierScoreAvg) }}
        </span>
      </article>
    </div>

    <div v-if="overview" class="dashboard-grid">
      <article class="surface-card">
        <h4>销售趋势</h4>
        <div class="chart-list">
          <div
            v-for="item in overview.salesTrend.slice(-6)"
            :key="item.date"
            class="chart-row"
          >
            <span>{{ item.date }} · {{ formatCurrency(item.amount) }}</span>
            <div class="chart-track">
              <div
                class="chart-fill"
                :style="{ width: `${Math.max(18, item.amount / 3000)}%` }"
              />
            </div>
          </div>
        </div>
      </article>

      <article class="surface-card">
        <h4>风险分布</h4>
        <div class="chart-list">
          <div
            v-for="item in overview.riskDistribution"
            :key="item.level"
            class="chart-row"
          >
            <span>{{ item.level }} · {{ item.count }} 条</span>
            <div class="chart-track">
              <div
                class="chart-fill"
                :style="{ width: `${Math.max(8, item.count * 20)}%` }"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="overview" class="two-col-grid">
      <article class="table-card">
        <h4>库存预警 Top 6</h4>
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
            <tr
              v-for="item in overview.inventoryAlerts"
              :key="item.id"
            >
              <td>{{ item.productName }}</td>
              <td>{{ item.warehouseName }}</td>
              <td>{{ formatNumber(item.currentStock) }}</td>
              <td><span class="pill" :data-tone="item.stockStatus === 'shortage' ? 'danger' : 'warning'">{{ item.stockStatusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="table-card">
        <h4>延迟路线</h4>
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
            <tr
              v-for="item in overview.delayedRoutes"
              :key="item.shipmentId"
            >
              <td>{{ item.routeName }}</td>
              <td>{{ item.carrier }}</td>
              <td class="danger-text">{{ item.delayHours }} 小时</td>
              <td>{{ formatCurrency(item.transportCost) }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>

    <div v-if="overview" class="two-col-grid">
      <article class="surface-card">
        <h4>优选供应商</h4>
        <div class="mini-list">
          <div
            v-for="item in overview.topSuppliers"
            :key="item.supplierId"
            class="mini-item"
          >
            <strong>{{ item.supplierName }}</strong>
            <span>{{ item.region }} · 评分 {{ formatPercent(item.compositeScore) }}</span>
          </div>
        </div>
      </article>

      <article class="surface-card">
        <h4>成本变化</h4>
        <div class="chart-list">
          <div
            v-for="item in overview.costTrend.slice(-6)"
            :key="item.date"
            class="chart-row"
          >
            <span>{{ item.date }} · {{ formatCurrency(item.totalCost) }}</span>
            <div class="chart-track">
              <div
                class="chart-fill"
                :style="{ width: `${Math.max(15, item.totalCost / 450)}%` }"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="loading" class="empty-state">正在加载驾驶舱数据...</div>
  </section>
</template>
