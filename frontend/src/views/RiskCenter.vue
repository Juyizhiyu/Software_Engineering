<script setup>
import { computed, onMounted, ref } from 'vue'
import request from '../api/request'
import { levelTone } from '../utils/format'

const risks = ref([])

const openRisks = computed(() => risks.value.filter((item) => item.status === 'open'))

onMounted(async () => {
  const res = await request.get('/risks')
  if (res.success) risks.value = res.data
})
</script>

<template>
  <section class="page-layout">
    <article class="hero-panel">
      <div class="page-header">
        <div>
          <p class="kicker">Risk Center</p>
          <h3>风险监控与闭环</h3>
        </div>
      </div>
      <p class="section-copy">
        聚焦所有待处理风险，按等级展示影响对象、描述和建议动作，适合管理者每天例行巡检。
      </p>
    </article>

    <div v-if="openRisks.length" class="three-column">
      <article v-for="risk in openRisks" :key="risk.riskId" class="insight-panel">
        <div class="page-header">
          <h4>{{ risk.riskType }}</h4>
          <span class="tone-chip" :data-tone="levelTone(risk.riskLevel)">{{ risk.riskLevelLabel }}</span>
        </div>
        <p><strong>关联对象：</strong>{{ risk.relatedObject }}</p>
        <p><strong>描述：</strong>{{ risk.description }}</p>
        <p><strong>建议：</strong>{{ risk.suggestion }}</p>
        <p class="helper-text">创建时间：{{ risk.createdAt }}</p>
      </article>
    </div>
    <div v-else class="empty-state">当前没有待处理风险。</div>
  </section>
</template>
