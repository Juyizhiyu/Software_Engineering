<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiChat } from '@/composables/useAiChat'
import { useAiForecast } from '@/composables/useAiForecast'
import { useAiAnomaly } from '@/composables/useAiAnomaly'
import { useAiRiskScore } from '@/composables/useAiRiskScore'
import { riskLevelColor, formatPercent } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'

const activeTab = ref('chat')

// 解构 composable 返回值，确保 Ref 在模板中自动解包
const { loading: chatLoading, question, result: chatResult, submit: chatSubmit } = useAiChat()
const { loading: forecastLoading, productId, result: forecastResult, submit: forecastSubmit } = useAiForecast()
const { loading: anomalyLoading, dataType, dataTypeOptions, result: anomalyResult, submit: anomalySubmit } = useAiAnomaly()
const { loading: riskScoreLoading, supplierId, result: riskScoreResult, submit: riskScoreSubmit } = useAiRiskScore()

async function handleChat() {
  try {
    await chatSubmit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '分析失败')
  }
}

async function handleForecast() {
  try {
    await forecastSubmit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '预测失败')
  }
}

async function handleAnomaly() {
  try {
    await anomalySubmit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '检测失败')
  }
}

async function handleRiskScore() {
  try {
    await riskScoreSubmit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '评分失败')
  }
}

// 预设问题
const presetQuestions = [
  '当前库存有哪些缺货风险？',
  '哪些供应商表现最差？',
  '物流延迟情况如何？',
  '成本控制有哪些问题？',
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="AI 工作台" description="智能问答、需求预测、异常检测、风险评分" />

    <el-tabs v-model="activeTab" class="ai-studio__tabs">
      <!-- 智能问答 -->
      <el-tab-pane label="智能问答" name="chat">
        <div class="ai-studio__panel">
          <div class="ai-studio__input-area">
            <el-input
              v-model="question"
              type="textarea"
              :rows="3"
              placeholder="输入您的供应链问题..."
              @keydown.enter.ctrl="handleChat"
            />
            <div class="ai-studio__input-actions">
              <div class="ai-studio__presets">
                <span class="ai-studio__presets-label">快速提问：</span>
                <el-tag
                  v-for="q in presetQuestions"
                  :key="q"
                  class="ai-studio__preset-tag"
                  effect="plain"
                  @click="question = q"
                >
                  {{ q }}
                </el-tag>
              </div>
              <el-button type="primary" :loading="chatLoading" @click="handleChat">
                分析
              </el-button>
            </div>
          </div>

          <div v-if="chatResult" class="ai-studio__result">
            <div class="ai-result">
              <h4 class="ai-result__title">分析结论</h4>
              <p class="ai-result__answer">{{ chatResult.answer }}</p>

              <div v-if="chatResult.summary.length" class="ai-result__section">
                <h5>要点摘要</h5>
                <ul>
                  <li v-for="(s, i) in chatResult.summary" :key="i">{{ s }}</li>
                </ul>
              </div>

              <div v-if="chatResult.suggestions.length" class="ai-result__section">
                <h5>建议</h5>
                <ul>
                  <li v-for="(s, i) in chatResult.suggestions" :key="i">{{ s }}</li>
                </ul>
              </div>

              <div v-if="chatResult.evidence.length" class="ai-result__section">
                <h5>数据证据</h5>
                <div class="ai-result__evidence">
                  <el-tag
                    v-for="(e, i) in chatResult.evidence"
                    :key="i"
                    size="small"
                    type="info"
                    class="ai-result__evidence-tag"
                  >
                    {{ e.type }}: {{ e.object }} = {{ e.value }}
                  </el-tag>
                </div>
              </div>

              <div class="ai-result__meta">
                <el-tag size="small" effect="plain">
                  {{ chatResult.metadata.mode }}
                </el-tag>
                <el-tag v-if="chatResult.metadata.model" size="small" effect="plain" type="success">
                  {{ chatResult.metadata.model }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 需求预测 -->
      <el-tab-pane label="需求预测" name="forecast">
        <div class="ai-studio__panel">
          <div class="ai-studio__input-area">
            <el-input
              v-model="productId"
              placeholder="输入产品 ID（如 P001）"
              style="max-width: 300px"
            >
              <template #prepend>产品ID</template>
            </el-input>
            <el-button type="primary" :loading="forecastLoading" @click="handleForecast">
              预测
            </el-button>
          </div>

          <div v-if="forecastResult" class="ai-studio__result">
            <div class="ai-result">
              <h4 class="ai-result__title">
                {{ forecastResult.product_name || forecastResult.product_id }} 需求预测
              </h4>
              <div class="forecast-stats">
                <div class="forecast-stats__item">
                  <span class="forecast-stats__label">7天预测</span>
                  <span class="forecast-stats__value mono">
                    {{ forecastResult.forecast_demand_7d.toFixed(0) }}
                  </span>
                </div>
                <div class="forecast-stats__item">
                  <span class="forecast-stats__label">30天预测</span>
                  <span class="forecast-stats__value mono">
                    {{ forecastResult.forecast_demand_30d.toFixed(0) }}
                  </span>
                </div>
                <div class="forecast-stats__item">
                  <span class="forecast-stats__label">置信度</span>
                  <el-tag
                    :type="
                      forecastResult.confidence === 'high'
                        ? 'success'
                        : forecastResult.confidence === 'medium'
                          ? 'warning'
                          : 'danger'
                    "
                  >
                    {{ forecastResult.confidence }}
                  </el-tag>
                </div>
                <div class="forecast-stats__item">
                  <span class="forecast-stats__label">趋势</span>
                  <el-tag
                    :type="
                      forecastResult.trend === 'up'
                        ? 'success'
                        : forecastResult.trend === 'down'
                          ? 'danger'
                          : 'info'
                    "
                  >
                    {{ forecastResult.trend }}
                  </el-tag>
                </div>
              </div>
              <p class="ai-result__answer">{{ forecastResult.analysis }}</p>
              <div class="ai-result__meta">
                <el-tag size="small" effect="plain">{{ forecastResult.metadata.mode }}</el-tag>
                <el-tag size="small" effect="plain" type="info">
                  {{ forecastResult.metadata.method }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 异常检测 -->
      <el-tab-pane label="异常检测" name="anomaly">
        <div class="ai-studio__panel">
          <div class="ai-studio__input-area">
            <el-select v-model="dataType" style="width: 200px">
              <el-option
                v-for="opt in dataTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button type="primary" :loading="anomalyLoading" @click="handleAnomaly">
              检测异常
            </el-button>
          </div>

          <div v-if="anomalyResult" class="ai-studio__result">
            <div class="ai-result">
              <h4 class="ai-result__title">
                {{ anomalyResult.data_type }} 异常检测结果
              </h4>
              <el-alert
                :title="anomalyResult.summary"
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 16px"
              />
              <el-table
                v-if="anomalyResult.anomalies.length"
                :data="anomalyResult.anomalies"
                size="small"
                stripe
              >
                <el-table-column prop="index" label="序号" width="60" />
                <el-table-column prop="field" label="字段" width="120" />
                <el-table-column prop="severity" label="严重度" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.severity }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="expected" label="期望值" width="100" align="right">
                  <template #default="{ row }">
                    <span class="mono">{{ row.expected?.toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="actual" label="实际值" width="100" align="right">
                  <template #default="{ row }">
                    <span class="mono" style="color: #f56c6c">{{ row.actual }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="ai-result__meta">
                <el-tag size="small" effect="plain">{{ anomalyResult.metadata.mode }}</el-tag>
                <el-tag size="small" effect="plain" type="info">
                  {{ anomalyResult.metadata.method }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 供应商风险评分 -->
      <el-tab-pane label="风险评分" name="risk-score">
        <div class="ai-studio__panel">
          <div class="ai-studio__input-area">
            <el-input
              v-model="supplierId"
              placeholder="输入供应商 ID（如 S001）"
              style="max-width: 300px"
            >
              <template #prepend>供应商ID</template>
            </el-input>
            <el-button type="primary" :loading="riskScoreLoading" @click="handleRiskScore">
              评分
            </el-button>
          </div>

          <div v-if="riskScoreResult" class="ai-studio__result">
            <div class="ai-result">
              <h4 class="ai-result__title">
                {{ riskScoreResult.supplier_name || riskScoreResult.supplier_id }} 风险评分
              </h4>
              <div class="risk-score-overview">
                <div class="risk-score-overview__score">
                  <span class="risk-score-overview__number mono">
                    {{ riskScoreResult.score.toFixed(1) }}
                  </span>
                  <el-tag
                    :color="riskLevelColor(riskScoreResult.risk_level)"
                    effect="dark"
                    size="large"
                    style="border: none"
                  >
                    {{ riskScoreResult.risk_level }}
                  </el-tag>
                </div>
                <div class="risk-score-overview__breakdown">
                  <div class="risk-score-bar">
                    <span class="risk-score-bar__label">准时率 (40%)</span>
                    <el-progress
                      :percentage="riskScoreResult.breakdown.on_time_rate * 100 / 0.4"
                      :stroke-width="12"
                      :color="'#409eff'"
                    />
                    <span class="risk-score-bar__value mono">
                      {{ formatPercent(riskScoreResult.breakdown.on_time_rate * 100) }}
                    </span>
                  </div>
                  <div class="risk-score-bar">
                    <span class="risk-score-bar__label">质量率 (30%)</span>
                    <el-progress
                      :percentage="riskScoreResult.breakdown.quality_rate * 100 / 0.3"
                      :stroke-width="12"
                      :color="'#67c23a'"
                    />
                    <span class="risk-score-bar__value mono">
                      {{ formatPercent(riskScoreResult.breakdown.quality_rate * 100) }}
                    </span>
                  </div>
                  <div class="risk-score-bar">
                    <span class="risk-score-bar__label">价格稳定 (20%)</span>
                    <el-progress
                      :percentage="riskScoreResult.breakdown.price_stability * 100 / 0.2"
                      :stroke-width="12"
                      :color="'#e6a23c'"
                    />
                    <span class="risk-score-bar__value mono">
                      {{ formatPercent(riskScoreResult.breakdown.price_stability * 100) }}
                    </span>
                  </div>
                  <div class="risk-score-bar">
                    <span class="risk-score-bar__label">响应速度 (10%)</span>
                    <el-progress
                      :percentage="riskScoreResult.breakdown.response_score * 100 / 0.1"
                      :stroke-width="12"
                      :color="'#909399'"
                    />
                    <span class="risk-score-bar__value mono">
                      {{ formatPercent(riskScoreResult.breakdown.response_score * 100) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="riskScoreResult.recommendations.length" class="ai-result__section">
                <h5>AI 建议</h5>
                <ul>
                  <li v-for="(r, i) in riskScoreResult.recommendations" :key="i">{{ r }}</li>
                </ul>
              </div>

              <div class="ai-result__meta">
                <el-tag size="small" effect="plain">{{ riskScoreResult.metadata.mode }}</el-tag>
                <el-tag size="small" effect="plain" type="info">
                  {{ riskScoreResult.metadata.method }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.ai-studio {
  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $spacing-lg;
    }
  }

  &__panel {
    max-width: 900px;
  }

  &__input-area {
    @include card;
    margin-bottom: $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__input-actions {
    @include flex-between;
  }

  &__presets {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__presets-label {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }

  &__preset-tag {
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: $color-primary;
      border-color: $color-primary;
    }
  }

  &__result {
    animation: fadeIn 0.3s ease;
  }
}

.ai-result {
  @include card;

  &__title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
  }

  &__answer {
    color: var(--el-text-color-regular);
    line-height: 1.8;
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
    padding-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.forecast-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  &__item {
    @include card($spacing-md);
    text-align: center;
  }

  &__label {
    display: block;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    margin-bottom: $spacing-xs;
  }

  &__value {
    display: block;
    font-size: $font-size-xxl;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.risk-score-overview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;

  &__score {
    @include card($spacing-md);
    @include flex-center;
    flex-direction: column;
    gap: $spacing-sm;
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
