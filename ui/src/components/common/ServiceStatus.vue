<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAiHealth } from '@/api/ai'
import type { AiHealthData } from '@/types'

interface NodeHealth {
  status: string
  database?: { online: boolean; source: string; error?: string }
  dataQuality?: { status: string }
}

const nodeOnline = ref(false)
const nodeHealth = ref<NodeHealth | null>(null)
const aiHealth = ref<AiHealthData | null>(null)

const databaseOnline = computed(() => nodeHealth.value?.database?.online ?? false)
const dataSource = computed(() => nodeHealth.value?.database?.source || 'json')

onMounted(async () => {
  try {
    const res = await fetch('/api/health')
    nodeOnline.value = res.ok
    const body = await res.json()
    nodeHealth.value = body.data
  } catch {
    nodeOnline.value = false
    nodeHealth.value = null
  }

  try {
    const { data } = await getAiHealth()
    aiHealth.value = data
  } catch {
    aiHealth.value = null
  }
})
</script>

<template>
  <div class="service-status">
    <div class="service-status__item">
      <span
        class="service-status__dot"
        :class="{ 'service-status__dot--online': nodeOnline }"
      />
      <span>Node API</span>
    </div>
    <div class="service-status__item">
      <span
        class="service-status__dot"
        :class="{ 'service-status__dot--online': databaseOnline }"
      />
      <span>数据源 {{ dataSource }}</span>
    </div>
    <div class="service-status__item">
      <span
        class="service-status__dot"
        :class="{ 'service-status__dot--online': aiHealth?.online }"
      />
      <span>AI {{ aiHealth?.llm_enabled ? `(${aiHealth.model})` : '(规则模式)' }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.service-status {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  &__dot {
    flex: 0 0 8px;
    border-radius: 50%;
    background: var(--el-color-danger);
    width: 8px;
    height: 8px;

    &--online {
      background: var(--el-color-success);
    }
  }
}
</style>
