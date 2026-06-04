<script setup>
import { ref, computed } from 'vue'
import request from '../api/request'

// ── Tab 状态 ──
const activeTab = ref('chat')
const tabs = [
  { key: 'chat', label: '智能问答' },
  { key: 'forecast', label: '需求预测' },
  { key: 'anomaly', label: '异常检测' },
  { key: 'risk', label: '风险评分' },
]

// ── 智能问答 ──
const question = ref('请结合当前所有数据，给出本周供应链运营的优先级和具体动作建议。')
const loadingChat = ref(false)
const response = ref(null)

const prompts = [
  '请结合当前所有数据，给出本周供应链运营的优先级和具体动作建议。',
  '请分析当前最值得关注的库存与物流风险，并给出处理顺序。',
  '基于现有订单、成本和供应商表现，生成一份管理层汇报摘要。',
]

async function analyzeChat() {
  if (!question.value.trim() || loadingChat.value) return
  loadingChat.value = true
  response.value = null
  try {
    response.value = await request.post('/assistant/chat', { question: question.value })
  } finally {
    loadingChat.value = false
  }
}

// ── 需求预测 ──
const forecastProductId = ref('')
const forecastResult = ref(null)
const loadingForecast = ref(false)

async function runForecast() {
  if (!forecastProductId.value.trim() || loadingForecast.value) return
  loadingForecast.value = true
  forecastResult.value = null
  try {
    const res = await request.post('/ai/forecast', {
      product_id: forecastProductId.value.trim(),
      product_name: forecastProductId.value.trim()
    })
    forecastResult.value = res.data || res
  } finally {
    loadingForecast.value = false
  }
}

// ── 异常检测 ──
const anomalyDataType = ref('inventory')
const anomalyResult = ref(null)
const loadingAnomaly = ref(false)
const dataTypes = [
  { key: 'inventory', label: '库存' },
  { key: 'orders', label: '订单' },
  { key: 'costs', label: '成本' },
  { key: 'logistics', label: '物流' },
  { key: 'suppliers', label: '供应商' },
  { key: 'risks', label: '风险' },
]

async function runAnomaly() {
  if (loadingAnomaly.value) return
  loadingAnomaly.value = true
  anomalyResult.value = null
  try {
    const res = await request.post('/ai/anomaly', { data_type: anomalyDataType.value })
    anomalyResult.value = res.data || res
  } finally {
    loadingAnomaly.value = false
  }
}

// ── 风险评分 ──
const riskSupplierId = ref('')
const riskResult = ref(null)
const loadingRisk = ref(false)

async function runRiskScore() {
  if (!riskSupplierId.value.trim() || loadingRisk.value) return
  loadingRisk.value = true
  riskResult.value = null
  try {
    const res = await request.post('/ai/risk-score', { supplier_id: riskSupplierId.value.trim() })
    riskResult.value = res.data || res
  } finally {
    loadingRisk.value = false
  }
}

// ── 辅助 ──
const riskLevelClass = (level) => {
  const map = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }
  return map[level] || ''
}

const severityClass = (s) => s === 'high' ? 'critical' : 'medium'
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">AI Studio</p>
          <h3>AI 智能分析工作台</h3>
        </div>
      </div>
      <p class="section-copy">
        支持智能问答、需求预测、异常检测和供应商风险评分四大分析能力，由 DeepSeek 大模型驱动。
      </p>
    </article>

    <!-- Tab 切换 -->
    <div class="tabs-row" style="margin-bottom: 20px;">
      <button
        v-for="tab in tabs" :key="tab.key"
        :class="['tab-button', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- ========== 智能问答 ========== -->
    <div class="split-layout" v-if="activeTab === 'chat'">
      <article class="form-panel">
        <h4>输入分析指令</h4>
        <div class="field-block full">
          <label>分析问题</label>
          <textarea v-model="question" placeholder="输入要分析的问题，例如：请判断当前供应链的主要风险和优化建议" />
        </div>
        <div class="tabs-row" style="margin-top: 16px;">
          <button v-for="prompt in prompts" :key="prompt" class="ghost-button" @click="question = prompt">
            {{ prompt.slice(0, 18) }}...
          </button>
        </div>
        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="loadingChat" @click="analyzeChat">
            {{ loadingChat ? '分析中...' : '开始分析' }}
          </button>
        </div>
        <div class="alert-banner" style="margin-top: 16px;">
          已配置 DeepSeek 大模型；如 LLM 不可用将自动降级为本地规则分析。
        </div>
      </article>

      <article class="insight-panel">
        <h4>分析结果</h4>
        <div v-if="response" class="analysis-list">
          <div class="analysis-item">
            <strong>结论</strong>
            <div class="answer-block">{{ response.answer }}</div>
          </div>
          <div class="analysis-item">
            <strong>摘要</strong>
            <ul>
              <li v-for="(item, index) in response.summary" :key="`s-${index}`">{{ item }}</li>
            </ul>
          </div>
          <div class="analysis-item">
            <strong>建议</strong>
            <ul>
              <li v-for="(item, index) in response.suggestions" :key="`sg-${index}`">{{ item }}</li>
            </ul>
          </div>
          <div v-if="response.evidence?.length" class="analysis-item">
            <strong>证据</strong>
            <div class="evidence-list">
              <div v-for="(item, index) in response.evidence" :key="`ev-${index}`" class="evidence-item">
                <strong>{{ item.type }}</strong>
                <span>{{ item.object }}: {{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="metadata-line">
            模式：{{ response.metadata?.mode || 'unknown' }} · 模型：{{ response.metadata?.model || 'N/A' }}
          </div>
        </div>
        <div v-else class="empty-state">提交分析指令后，这里会显示结构化结果。</div>
      </article>
    </div>

    <!-- ========== 需求预测 ========== -->
    <div class="split-layout" v-if="activeTab === 'forecast'">
      <article class="form-panel">
        <h4>需求预测</h4>
        <div class="field-block full">
          <label>产品 ID</label>
          <input v-model="forecastProductId" placeholder="输入产品 ID，例如 P001" @keyup.enter="runForecast" />
        </div>
        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="loadingForecast" @click="runForecast">
            {{ loadingForecast ? '预测中...' : '执行预测' }}
          </button>
        </div>
        <div class="alert-banner" style="margin-top: 16px;">
          基于历史订单和成本数据，结合 LLM 分析生成 7 天 / 30 天需求预测。
        </div>
      </article>

      <article class="insight-panel">
        <h4>预测结果</h4>
        <div v-if="forecastResult" class="analysis-list">
          <div class="metric-row">
            <div class="metric-tile">
              <span class="metric-label">7 天预测需求</span>
              <span class="metric-value">{{ forecastResult.forecast_demand_7d }}</span>
            </div>
            <div class="metric-tile" v-if="forecastResult.forecast_demand_30d">
              <span class="metric-label">30 天预测需求</span>
              <span class="metric-value">{{ forecastResult.forecast_demand_30d }}</span>
            </div>
          </div>
          <div class="analysis-item">
            <strong>趋势</strong>
            <span :class="['badge', forecastResult.trend]">{{ forecastResult.trend === 'up' ? '上升' : forecastResult.trend === 'down' ? '下降' : '稳定' }}</span>
            <span style="margin-left:12px;">置信度：{{ forecastResult.confidence === 'high' ? '高' : forecastResult.confidence === 'medium' ? '中' : '低' }}</span>
          </div>
          <div class="analysis-item" v-if="forecastResult.analysis">
            <strong>分析说明</strong>
            <div class="answer-block">{{ forecastResult.analysis }}</div>
          </div>
          <div class="metadata-line">
            模式：{{ forecastResult.metadata?.mode || 'unknown' }} · 模型：{{ forecastResult.metadata?.model || 'N/A' }}
          </div>
        </div>
        <div v-else class="empty-state">输入产品 ID 执行预测后，这里会显示预测结果。</div>
      </article>
    </div>

    <!-- ========== 异常检测 ========== -->
    <div class="split-layout" v-if="activeTab === 'anomaly'">
      <article class="form-panel">
        <h4>异常检测</h4>
        <div class="field-block full">
          <label>数据类型</label>
          <select v-model="anomalyDataType">
            <option v-for="dt in dataTypes" :key="dt.key" :value="dt.key">{{ dt.label }}</option>
          </select>
        </div>
        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="loadingAnomaly" @click="runAnomaly">
            {{ loadingAnomaly ? '检测中...' : '执行检测' }}
          </button>
        </div>
        <div class="alert-banner" style="margin-top: 16px;">
          使用 Z-score 统计方法 + LLM 增强分析，自动识别数据中的离群异常点。
        </div>
      </article>

      <article class="insight-panel">
        <h4>检测结果</h4>
        <div v-if="anomalyResult" class="analysis-list">
          <div class="analysis-item">
            <strong>摘要</strong>
            <div class="answer-block">{{ anomalyResult.summary }}</div>
          </div>
          <div class="analysis-item" v-if="anomalyResult.anomalies?.length">
            <strong>异常详情（{{ anomalyResult.anomalies.length }} 个）</strong>
            <div class="evidence-list">
              <div v-for="(a, i) in anomalyResult.anomalies.slice(0, 10)" :key="`an-${i}`" class="evidence-item" :class="severityClass(a.severity)">
                <strong>{{ a.field || a.description?.slice(0, 20) }}</strong>
                <span :class="['badge', severityClass(a.severity)]">{{ a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低' }}</span>
                <span>{{ a.description }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">未检测到明显异常。</div>
          <div class="metadata-line">
            总记录：{{ anomalyResult.total_records }} · 模式：{{ anomalyResult.metadata?.mode || 'unknown' }}
          </div>
        </div>
        <div v-else class="empty-state">选择数据类型执行检测后，这里会显示异常结果。</div>
      </article>
    </div>

    <!-- ========== 风险评分 ========== -->
    <div class="split-layout" v-if="activeTab === 'risk'">
      <article class="form-panel">
        <h4>供应商风险评分</h4>
        <div class="field-block full">
          <label>供应商 ID</label>
          <input v-model="riskSupplierId" placeholder="输入供应商 ID，例如 S001" @keyup.enter="runRiskScore" />
        </div>
        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="loadingRisk" @click="runRiskScore">
            {{ loadingRisk ? '评分中...' : '执行评分' }}
          </button>
        </div>
        <div class="alert-banner" style="margin-top: 16px;">
          基于准时率、品质率、价格稳定性和响应速度的加权评分 + LLM 建议生成。
        </div>
      </article>

      <article class="insight-panel">
        <h4>评分结果</h4>
        <div v-if="riskResult" class="analysis-list">
          <div class="metric-row">
            <div class="metric-tile">
              <span class="metric-label">风险评分</span>
              <span class="metric-value">{{ riskResult.score }}</span>
            </div>
            <div class="metric-tile">
              <span class="metric-label">风险等级</span>
              <span class="metric-value" :class="riskLevelClass(riskResult.risk_level)">{{ riskResult.risk_level }}</span>
            </div>
          </div>
          <div class="analysis-item" v-if="riskResult.breakdown">
            <strong>评分明细</strong>
            <div class="evidence-list">
              <div class="evidence-item">
                <strong>准时率</strong><span>{{ (riskResult.breakdown.on_time_rate * 100).toFixed(1) }}%</span>
              </div>
              <div class="evidence-item">
                <strong>品质率</strong><span>{{ (riskResult.breakdown.quality_rate * 100).toFixed(1) }}%</span>
              </div>
              <div class="evidence-item">
                <strong>价格稳定性</strong><span>{{ (riskResult.breakdown.price_stability * 100).toFixed(1) }}%</span>
              </div>
              <div class="evidence-item">
                <strong>响应速度</strong><span>{{ (riskResult.breakdown.response_score * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <div class="analysis-item" v-if="riskResult.recommendations?.length">
            <strong>AI 建议</strong>
            <ul>
              <li v-for="(rec, i) in riskResult.recommendations" :key="`rec-${i}`">{{ rec }}</li>
            </ul>
          </div>
          <div class="metadata-line">
            模式：{{ riskResult.metadata?.mode || 'unknown' }} · 模型：{{ riskResult.metadata?.model || 'N/A' }}
          </div>
        </div>
        <div v-else class="empty-state">输入供应商 ID 执行评分后，这里会显示风险评分结果。</div>
      </article>
    </div>
  </section>
</template>
