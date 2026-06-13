<script setup lang="ts">
import { useAiForecast } from '@/composables/useAiForecast'

const { loading, productId, result, submit } = useAiForecast()

const confidenceLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const trendLabels: Record<string, string> = {
  up: '上升',
  down: '下降',
  stable: '平稳',
  unknown: '未知',
}

async function handleSubmit() {
  try {
    await submit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '预测失败')
  }
}
</script>

<template>
  <div class="ai-panel">
    <el-card
      shadow="hover"
      class="ai-panel__input"
    >
      <div class="ai-panel__input-row">
        <el-input
          v-model="productId"
          placeholder="输入产品 ID（如 P001）"
          style="max-width: 300px"
          @keyup.enter="handleSubmit"
        >
          <template #prepend>产品ID</template>
        </el-input>
        <el-button
          type="primary"
          :loading="loading"
          style="min-width: 80px"
          @click="handleSubmit"
        >
          预测
        </el-button>
      </div>
    </el-card>

    <el-card
      v-if="result"
      shadow="hover"
      class="ai-panel__result"
    >
      <h4 class="ai-panel__title">{{ result.product_name || result.product_id }} 需求预测</h4>
      <div class="forecast-stats">
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">7天预测</span>
          <span class="forecast-stats__value mono">{{ result.forecast_demand_7d.toFixed(0) }}</span>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">30天预测</span>
          <span class="forecast-stats__value mono">
            {{ result.forecast_demand_30d.toFixed(0) }}
          </span>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">置信度</span>
          <el-tag
            :type="result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'warning' : 'danger'"
            effect="dark"
          >
            {{ confidenceLabels[result.confidence] || result.confidence }}
          </el-tag>
        </el-card>
        <el-card
          shadow="never"
          class="forecast-stats__item"
        >
          <span class="forecast-stats__label">趋势</span>
          <el-tag
            :type="result.trend === 'up' ? 'success' : result.trend === 'down' ? 'danger' : 'info'"
            effect="dark"
          >
            {{ trendLabels[result.trend] || result.trend }}
          </el-tag>
        </el-card>
      </div>
      <p class="ai-panel__answer">{{ result.analysis }}</p>
      <div class="ai-panel__meta">
        <el-tag
          size="small"
          effect="plain"
        >
          {{ result.metadata.mode }}
        </el-tag>
        <el-tag
          size="small"
          effect="plain"
          type="info"
        >
          {{ result.metadata.method }}
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
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
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

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }
}

.forecast-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  &__item {
    text-align: center;

    :deep(.el-card__body) {
      padding: $spacing-md;
    }
  }

  &__label {
    display: block;
    margin-bottom: $spacing-xs;
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
  }

  &__value {
    display: block;
    color: var(--el-text-color-primary);
    font-weight: 700;
    font-size: $font-size-xxl;
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
