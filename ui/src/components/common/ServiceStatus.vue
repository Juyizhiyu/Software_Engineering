<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAiHealth } from '@/api/ai'
import type { AiHealthData } from '@/types'

const nodeOnline = ref(true)
const aiHealth = ref<AiHealthData | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/health')
    nodeOnline.value = res.ok
  } catch {
    nodeOnline.value = false
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
      <span class="service-status__dot" :class="{ 'service-status__dot--online': nodeOnline }" />
      <span>Node API</span>
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
  gap: $spacing-md;
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-danger;

    &--online {
      background: $color-success;
    }
  }
}
</style>
