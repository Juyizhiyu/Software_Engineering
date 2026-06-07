<script setup lang="ts">
import { useAiRiskScore } from '@/composables/useAiRiskScore'
import { riskLevelColor } from '@/utils/format'

const { loading, supplierId, result, submit } = useAiRiskScore()

async function handleSubmit() {
  try {
    await submit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '评分失败')
  }
}

const breakdownItems = [
  { key: 'on_time_rate', label: '准时率 (40%)', weight: 0.4, color: 'var(--el-color-primary)' },
  { key: 'quality_rate', label: '质量率 (30%)', weight: 0.3, color: 'var(--el-color-success)' },
  { key: 'price_stability', label: '价格稳定 (20%)', weight: 0.2, color: 'var(--el-color-warning)' },
  { key: 'response_score', label: '响应速度 (10%)', weight: 0.1, color: 'var(--el-color-info)' },
] as const
</script>

<template>
  <div class="ai-panel">
    <el-card shadow="hover" class="ai-panel__input">
      <div class="ai-panel__input-row">
        <el-input
          v-model="supplierId"
          placeholder="输入供应商 ID（如 S001）"
          style="max-width: 300px"
          @keyup.enter="handleSubmit"
        >
          <template #prepend>供应商ID</template>
        </el-input>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          评分
        </el-button>
      </div>
    </el-card>

    <el-card v-if="result" shadow="hover" class="ai-panel__result">
      <h4 class="ai-panel__title">
        {{ result.supplier_name || result.supplier_id }} 风险评分
      </h4>
      <div class="risk-score-overview">
        <el-card shadow="never" class="risk-score-overview__score">
          <span class="risk-score-overview__number mono">{{ result.score.toFixed(1) }}</span>
          <el-tag
            :color="riskLevelColor(result.risk_level)"
            effect="dark"
            size="large"
            style="border: none"
          >
            {{ result.risk_level }}
          </el-tag>
        </el-card>
        <div class="risk-score-overview__breakdown">
          <div v-for="item in breakdownItems" :key="item.key" class="risk-score-bar">
            <span class="risk-score-bar__label">{{ item.label }}</span>
            <el-progress
              :percentage="Math.round(result.breakdown[item.key] / item.weight * 100)"
              :stroke-width="12"
              :color="item.color"
            />
            <span class="risk-score-bar__value mono">
              {{ (result.breakdown[item.key] * 100).toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="result.recommendations.length" class="ai-panel__section">
        <h5>AI 建议</h5>
        <ul>
          <li v-for="(r, i) in result.recommendations" :key="i">{{ r }}</li>
        </ul>
      </div>

      <div class="ai-panel__meta">
        <el-tag size="small" effect="plain">{{ result.metadata.mode }}</el-tag>
        <el-tag size="small" effect="plain" type="info">{{ result.metadata.method }}</el-tag>
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
    font-size: $font-size-lg;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
  }

  &__section {
    margin-bottom: $spacing-md;

    h5 {
      font-size: $font-size-md;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: $spacing-sm;
    }

    ul {
      padding-left: $spacing-lg;
      li {
        color: var(--el-text-color-regular);
        line-height: 1.8;
        margin-bottom: $spacing-xs;
      }
    }
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.risk-score-overview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;

  &__score {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-sm;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-md;
    }
  }

  &__number {
    font-size: 48px;
    font-weight: 800;
    color: var(--el-text-color-primary);
  }

  &__breakdown {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }
}

.risk-score-bar {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  align-items: center;
  gap: $spacing-sm;

  &__label {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }

  &__value {
    font-size: $font-size-sm;
    text-align: right;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
