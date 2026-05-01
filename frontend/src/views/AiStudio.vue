<script setup>
import { ref } from 'vue'
import request from '../api/request'

const question = ref('请结合当前所有数据，给出本周供应链运营的优先级和具体动作建议。')
const loading = ref(false)
const response = ref(null)

const prompts = [
  '请结合当前所有数据，给出本周供应链运营的优先级和具体动作建议。',
  '请分析当前最值得关注的库存与物流风险，并给出处理顺序。',
  '基于现有订单、成本和供应商表现，生成一份管理层汇报摘要。',
]

async function analyze() {
  if (!question.value.trim() || loading.value) return
  loading.value = true
  response.value = null
  try {
    response.value = await request.post('/assistant/chat', { question: question.value })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">AI Studio</p>
          <h3>自然语言分析工作台</h3>
        </div>
      </div>
      <p class="section-copy">
        支持直接输入管理指令，让系统基于当前订单、库存、物流、成本、风险和供应商数据输出结构化分析结论。
      </p>
    </article>

    <div class="split-layout">
      <article class="form-panel">
        <h4>输入分析指令</h4>
        <div class="field-block full">
          <label>分析问题</label>
          <textarea v-model="question" placeholder="输入要分析的问题，例如：请判断当前供应链的主要风险和优化建议" />
        </div>
        <div class="tabs-row" style="margin-top: 16px;">
          <button
            v-for="prompt in prompts"
            :key="prompt"
            class="ghost-button"
            @click="question = prompt"
          >
            {{ prompt.slice(0, 18) }}...
          </button>
        </div>
        <div class="inline-actions" style="margin-top: 16px;">
          <button class="primary-button" :disabled="loading" @click="analyze">
            {{ loading ? '分析中...' : '开始分析' }}
          </button>
        </div>
        <div class="alert-banner" style="margin-top: 16px;">
          若已配置 `backend-python/config.json` 中的 `openai_api_key`，系统会调用真实 LLM；否则会自动回退为本地规则分析。
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
              <li v-for="(item, index) in response.summary" :key="`summary-${index}`">{{ item }}</li>
            </ul>
          </div>

          <div class="analysis-item">
            <strong>建议</strong>
            <ul>
              <li v-for="(item, index) in response.suggestions" :key="`suggestion-${index}`">{{ item }}</li>
            </ul>
          </div>

          <div v-if="response.evidence?.length" class="analysis-item">
            <strong>证据</strong>
            <div class="evidence-list">
              <div v-for="(item, index) in response.evidence" :key="`evidence-${index}`" class="evidence-item">
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
  </section>
</template>
