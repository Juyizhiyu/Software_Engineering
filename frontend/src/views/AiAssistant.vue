<script setup>
import { ref } from 'vue'
import request from '../api/request'

const question = ref('请结合库存、物流和风险数据，给出本周运营优先级。')
const response = ref(null)
const loading = ref(false)

const prompts = [
  '请结合库存、物流和风险数据，给出本周运营优先级。',
  '哪些产品当前最需要补货？请说明理由。',
  '如果只能处理三项动作，最值得优先做什么？',
]

async function ask() {
  if (!question.value.trim() || loading.value) return
  loading.value = true
  response.value = null
  try {
    response.value = await request.post('/assistant/chat', { question: question.value })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page-section">
    <div class="page-head">
      <div>
        <p class="eyebrow">AI Assistant</p>
        <h3>AI 助手</h3>
      </div>
      <p class="section-note">优先调用 Python AI 服务；若未启动，则自动回退到 Node 本地演示分析。</p>
    </div>

    <article class="chat-card">
      <h4>提问面板</h4>
      <div class="composer">
        <textarea v-model="question" placeholder="输入你的供应链分析问题" />
        <div class="action-row">
          <div class="prompt-group">
            <button
              v-for="prompt in prompts"
              :key="prompt"
              class="ghost-button"
              @click="question = prompt"
            >
              {{ prompt }}
            </button>
          </div>
          <button class="primary-button" :disabled="loading" @click="ask">
            {{ loading ? '分析中...' : '发送分析请求' }}
          </button>
        </div>
      </div>
    </article>

    <article v-if="response" class="chat-card">
      <h4>分析结论</h4>
      <div class="bullet-list">
        <div class="bullet-item">
          <strong>回答</strong>
          <span>{{ response.answer }}</span>
        </div>
      </div>

      <div class="two-col-grid" style="margin-top: 16px;">
        <div class="bullet-list">
          <div
            v-for="(item, index) in response.summary"
            :key="`summary-${index}`"
            class="bullet-item"
          >
            <strong>摘要 {{ index + 1 }}</strong>
            <span>{{ item }}</span>
          </div>
        </div>

        <div class="bullet-list">
          <div
            v-for="(item, index) in response.suggestions"
            :key="`suggestion-${index}`"
            class="bullet-item"
          >
            <strong>建议 {{ index + 1 }}</strong>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <div v-if="response.evidence?.length" class="evidence-list" style="margin-top: 16px;">
        <div
          v-for="(item, index) in response.evidence"
          :key="`evidence-${index}`"
          class="evidence-item"
        >
          <strong>{{ item.type }}</strong>
          <span>{{ item.object }}: {{ item.value }}</span>
        </div>
      </div>
    </article>
  </section>
</template>
