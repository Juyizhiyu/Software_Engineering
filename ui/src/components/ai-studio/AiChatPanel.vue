<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAiChat } from '@/composables/useAiChat'

const { loading, question, result, submit } = useAiChat()

const presetQuestions = [
  '当前库存有哪些缺货风险？',
  '哪些供应商表现最差？',
  '物流延迟情况如何？',
  '成本控制有哪些问题？',
]

async function handleSubmit() {
  try {
    await submit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '分析失败')
  }
}
</script>

<template>
  <div class="ai-panel">
    <el-card
      shadow="hover"
      class="ai-panel__input"
    >
      <el-input
        v-model="question"
        type="textarea"
        :rows="3"
        placeholder="输入您的供应链问题..."
        @keydown.enter.ctrl="handleSubmit"
      />
      <div class="ai-panel__actions">
        <div class="ai-panel__presets">
          <span class="ai-panel__presets-label">快速提问：</span>
          <el-tag
            v-for="q in presetQuestions"
            :key="q"
            class="ai-panel__preset-tag"
            effect="plain"
            @click="question = q"
          >
            {{ q }}
          </el-tag>
        </div>
        <el-button
          type="primary"
          :loading="loading"
          style="min-width: 72px"
          @click="handleSubmit"
        >
          分析
        </el-button>
      </div>
    </el-card>

    <el-card
      v-if="result"
      shadow="hover"
      class="ai-panel__result"
    >
      <h4 class="ai-panel__title">分析结论</h4>
      <p class="ai-panel__answer">{{ result.answer }}</p>

      <div
        v-if="result.summary.length"
        class="ai-panel__section"
      >
        <h5>要点摘要</h5>
        <ul>
          <li
            v-for="(s, i) in result.summary"
            :key="i"
          >
            {{ s }}
          </li>
        </ul>
      </div>

      <div
        v-if="result.suggestions.length"
        class="ai-panel__section"
      >
        <h5>建议</h5>
        <ul>
          <li
            v-for="(s, i) in result.suggestions"
            :key="i"
          >
            {{ s }}
          </li>
        </ul>
      </div>

      <div
        v-if="result.evidence.length"
        class="ai-panel__section"
      >
        <h5>数据证据</h5>
        <div class="ai-panel__evidence">
          <el-tag
            v-for="(e, i) in result.evidence"
            :key="i"
            size="small"
            type="info"
            class="ai-panel__evidence-tag"
          >
            {{ e.type }}: {{ e.object }} = {{ e.value }}
          </el-tag>
        </div>
      </div>

      <div class="ai-panel__meta">
        <el-tag
          size="small"
          effect="plain"
        >
          {{ result.metadata.mode }}
        </el-tag>
        <el-tag
          v-if="result.metadata.model"
          size="small"
          effect="plain"
          type="success"
        >
          {{ result.metadata.model }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.ai-panel {
  max-width: 900px;

  &__input {
    margin-bottom: $spacing-lg;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }
  }

  &__actions {
    @include flex-between;
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__presets-label {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__preset-tag {
    transition: all $transition-fast;
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
  }

  &__result {
    animation: fadeIn 0.3s ease;
  }

  &__title {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-primary);
    font-weight: 600;
    font-size: $font-size-lg;
  }

  &__answer {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }

  &__section {
    margin-bottom: $spacing-md;

    h5 {
      margin-bottom: $spacing-sm;
      color: var(--el-text-color-primary);
      font-weight: 600;
      font-size: $font-size-md;
    }

    ul {
      padding-left: $spacing-lg;
      li {
        margin-bottom: $spacing-xs;
        color: var(--el-text-color-regular);
        line-height: 1.8;
      }
    }
  }

  &__evidence {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__evidence-tag {
    font-family: $font-family-mono;
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }
}

@keyframes fadeIn {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
