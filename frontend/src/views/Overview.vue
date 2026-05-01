<script setup>
import { onMounted, ref } from 'vue'
import request from '../api/request'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format'

const summary = ref(null)
const overview = ref(null)

onMounted(async () => {
  const [summaryRes, overviewRes] = await Promise.all([
    request.get('/dashboard/summary'),
    request.get('/dashboard/overview'),
  ])

  if (summaryRes.success) summary.value = summaryRes.data
  if (overviewRes.success) overview.value = overviewRes.data
})
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">Overview</p>
          <h3>经营全局总览</h3>
        </div>
      </div>
      <p class="section-copy">
        面向管理层快速展示销售、库存、履约、成本和风险五条主线，用最少的信息表达最关键的经营状态。
      </p>
    </article>

    <div v-if="summary" class="metric-grid">
      <article class="metric-tile">
        <span>订单总量</span>
        <strong>{{ formatNumber(summary.totalOrders) }}</strong>
        <p>平均订单额 {{ formatCurrency(summary.averageOrderAmount) }}</p>
      </article>
      <article class="metric-tile">
        <span>销售额</span>
        <strong>{{ formatCurrency(summary.totalSales) }}</strong>
        <p>累计成本 {{ formatCurrency(summary.totalCost) }}</p>
      </article>
      <article class="metric-tile">
        <span>库存总量</span>
        <strong>{{ formatNumber(summary.totalStock) }}</strong>
        <p>低库存项 {{ formatNumber(summary.shortageCount) }}</p>
      </article>
      <article class="metric-tile">
        <span>供应链风险</span>
        <strong>{{ formatNumber(summary.openRisks) }}</strong>
        <p>延迟运输 {{ formatNumber(summary.delayedShipments) }}，供应商均分 {{ formatPercent(summary.supplierScoreAvg) }}</p>
      </article>
    </div>

    <div v-if="overview" class="two-column">
      <article class="panel-card">
        <h4>销售走势</h4>
        <div class="bar-list">
          <div v-for="item in overview.salesTrend" :key="item.date" class="bar-row">
            <div class="bar-caption">
              <span>{{ item.date }}</span>
              <strong>{{ formatCurrency(item.amount) }}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${Math.max(18, item.amount / 3000)}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <h4>风险分布</h4>
        <div class="bar-list">
          <div v-for="item in overview.riskDistribution" :key="item.level" class="bar-row">
            <div class="bar-caption">
              <span>{{ item.level }}</span>
              <strong>{{ item.count }} 条</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${Math.max(12, item.count * 18)}%` }" />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="overview" class="three-column">
      <article class="panel-card">
        <h4>库存预警</h4>
        <div class="mini-list">
          <div v-for="item in overview.inventoryAlerts" :key="item.id" class="mini-list-item">
            <strong>{{ item.productName }}</strong>
            <span>{{ item.warehouseName }} · {{ item.stockStatusLabel }} · 当前 {{ formatNumber(item.currentStock) }}</span>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <h4>优选供应商</h4>
        <div class="mini-list">
          <div v-for="item in overview.topSuppliers" :key="item.supplierId" class="mini-list-item">
            <strong>{{ item.supplierName }}</strong>
            <span>{{ item.region }} · 评分 {{ formatPercent(item.compositeScore) }}</span>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <h4>最近订单</h4>
        <div class="mini-list">
          <div v-for="item in overview.recentOrders" :key="item.orderId" class="mini-list-item">
            <strong>{{ item.productName }}</strong>
            <span>{{ item.date }} · {{ item.customerRegion }} · {{ formatCurrency(item.amount) }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
