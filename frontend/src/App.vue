<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

const navigation = [
  { to: '/overview', label: '全局总览', desc: '经营态势与关键预警' },
  { to: '/data-center', label: '数据中心', desc: '录入并维护供应链数据' },
  { to: '/operations', label: '业务分析', desc: '库存、供应商、物流、成本' },
  { to: '/risk-center', label: '风险中心', desc: '集中跟踪风险闭环' },
  { to: '/ai-studio', label: 'AI 工作台', desc: '自然语言分析与决策建议' },
]

const services = ref({
  node: { label: 'Node API', status: 'pending', text: '检查中', detail: 'http://localhost:3000' },
  python: { label: 'Python AI', status: 'pending', text: '检查中', detail: 'http://localhost:8000' },
})

const serviceList = computed(() => Object.values(services.value))

async function loadStatus() {
  try {
    const nodeRes = await axios.get('http://127.0.0.1:3000/api/health', { timeout: 2500 })
    services.value.node = {
      label: 'Node API',
      status: 'success',
      text: nodeRes.data?.data?.status === 'ok' ? '在线' : '异常',
      detail: '聚合分析 / 数据写入',
    }
  } catch (error) {
    services.value.node = {
      label: 'Node API',
      status: 'danger',
      text: '未连接',
      detail: '聚合分析 / 数据写入',
    }
  }

  try {
    const pythonRes = await axios.get('http://127.0.0.1:8000/health', { timeout: 2500 })
    const data = pythonRes.data || {}
    services.value.python = {
      label: 'Python AI',
      status: data.llm_enabled ? 'success' : 'warning',
      text: data.llm_enabled ? 'LLM 已连接' : '规则模式',
      detail: data.model || 'gpt-4.1-mini',
    }
  } catch (error) {
    services.value.python = {
      label: 'Python AI',
      status: 'danger',
      text: '未连接',
      detail: '模型分析不可用',
    }
  }
}

onMounted(loadStatus)
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand-block">
        <p class="kicker">Supply Chain Intelligence</p>
        <h1>AI 赋能供应链可视化分析系统</h1>
        <p class="muted-text">
          围绕数据采集、智能分析、风险预警和经营决策，形成一套真实可跑的供应链运营系统。
        </p>
      </div>

      <nav class="nav-stack">
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-card"
        >
          <strong>{{ item.label }}</strong>
          <span>{{ item.desc }}</span>
        </router-link>
      </nav>

      <section class="status-panel">
        <div class="panel-title-row">
          <div>
            <p class="kicker">System</p>
            <h3>服务状态</h3>
          </div>
        </div>
        <div
          v-for="item in serviceList"
          :key="item.label"
          class="status-item"
        >
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.detail }}</p>
          </div>
          <span class="status-badge" :data-tone="item.status">{{ item.text }}</span>
        </div>
      </section>
    </aside>

    <main class="app-main">
      <header class="page-top">
        <div>
          <p class="kicker">Project Goal</p>
          <h2>从数据录入到 AI 分析的完整业务闭环</h2>
        </div>
        <p class="top-summary">
          当前版本支持多源供应链数据录入、可视化监控、风险预警和基于指令的智能分析。
        </p>
      </header>

      <router-view />
    </main>
  </div>
</template>
