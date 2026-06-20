<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRisks } from '@/composables/useRisks'
import { useAiAnomaly } from '@/composables/useAiAnomaly'
import { useAiRiskScore } from '@/composables/useAiRiskScore'
import { riskLevelColor, formatDate } from '@/utils/format'
import { riskLevelLabels } from '@/utils/theme'
import PageHeader from '@/components/common/PageHeader.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import AccentCard from '@/components/common/AccentCard.vue'

const {
  loading,
  openRisks,
  riskStats,
  anomaly,
  supplierRiskScores,
  analysisSummary,
  analysisMetadata,
  fetchRisks,
  refreshRiskAnalysis,
} = useRisks()

const {
  loading: anomalyLoading,
  dataType,
  dataTypeOptions,
  result: anomalyResult,
  submit: submitAnomaly,
} = useAiAnomaly()

const {
  loading: scoreLoading,
  suppliersLoading,
  supplierId,
  suppliers,
  selectedSupplier,
  result: scoreResult,
  error: scoreError,
  fetchSuppliers,
  submit: submitRiskScore,
} = useAiRiskScore()

const breakdownItems = [
  { key: 'on_time_rate', label: '准时率', color: 'var(--el-color-primary)' },
  { key: 'quality_rate', label: '质量率', color: 'var(--el-color-success)' },
  { key: 'price_stability', label: '价格稳定', color: 'var(--el-color-warning)' },
  { key: 'response_score', label: '响应速度', color: 'var(--el-color-info)' },
] as const

function riskScoreColor(level?: string) {
  const map: Record<string, string> = {
    Critical: '#f56c6c',
    High: '#e6a23c',
    Medium: '#409eff',
    Low: '#67c23a',
  }
  return map[level || ''] || '#909399'
}

async function handleAnomalySubmit() {
  try {
    await submitAnomaly()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '异常检测失败')
  }
}

async function handleRiskScoreSubmit() {
  try {
    await submitRiskScore()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '风险评分失败')
  }
}

onMounted(() => {
  fetchRisks()
  fetchSuppliers()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="风险中心"
      description="供应链风险监控、异常检测与供应商风险评分"
    >
      <template #actions>
        <el-tag
          v-if="analysisMetadata?.cache"
          :type="analysisMetadata.cache.hit ? 'success' : 'info'"
        >
          {{ analysisMetadata.cache.hit ? '缓存命中' : '重新分析' }}
        </el-tag>
        <el-button
          type="primary"
          :loading="loading"
          @click="refreshRiskAnalysis()"
        >
          刷新分析
        </el-button>
      </template>
    </PageHeader>

    <el-skeleton
      :loading="loading"
      animated
    >
      <template #default>
        <div class="card-grid card-grid--4 risk-center__stats">
          <MetricCard
            title="严重风险"
            :value="riskStats.Critical"
            icon="WarningFilled"
            color="#f56c6c"
          />
          <MetricCard
            title="高级风险"
            :value="riskStats.High"
            icon="Warning"
            color="#e6a23c"
          />
          <MetricCard
            title="中级风险"
            :value="riskStats.Medium"
            icon="InfoFilled"
            color="#409eff"
          />
          <MetricCard
            title="低级风险"
            :value="riskStats.Low"
            icon="CircleCheck"
            color="#67c23a"
          />
        </div>

        <div class="risk-center__tool-grid">
          <AccentCard accent-color="#409eff">
            <template #header>
              <span class="risk-center__section-title">异常检测</span>
              <el-tag size="small">{{ anomalyResult?.metadata?.mode || anomaly?.metadata?.mode || 'AI' }}</el-tag>
            </template>

            <div class="risk-center__tool-row">
              <el-select
                v-model="dataType"
                class="risk-center__select"
              >
                <el-option
                  v-for="opt in dataTypeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-button
                type="primary"
                :loading="anomalyLoading"
                @click="handleAnomalySubmit"
              >
                检测异常
              </el-button>
            </div>

            <el-alert
              v-if="anomalyResult || anomaly"
              class="risk-center__alert"
              :title="(anomalyResult || anomaly)?.summary"
              type="warning"
              :closable="false"
              show-icon
            />

            <el-table
              v-if="(anomalyResult || anomaly)?.anomalies?.length"
              :data="(anomalyResult || anomaly)?.anomalies"
              size="small"
              stripe
            >
              <el-table-column
                label="序号"
                width="64"
              >
                <template #default="{ row, $index }">
                  {{ row.index ?? $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column
                prop="field"
                label="字段"
                width="120"
              />
              <el-table-column
                label="严重度"
                width="96"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    v-if="row.severity"
                    :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                    size="small"
                  >
                    {{ row.severity }}
                  </el-tag>
                  <span v-else>{{ row.reason || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column
                label="描述"
                min-width="220"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.description || row.desc || row.reason }}
                </template>
              </el-table-column>
              <el-table-column
                label="期望值"
                width="100"
                align="right"
              >
                <template #default="{ row }">
                  {{ row.expected != null ? Number(row.expected).toFixed(2) : '-' }}
                </template>
              </el-table-column>
              <el-table-column
                label="实际值"
                width="100"
                align="right"
              >
                <template #default="{ row }">
                  {{ row.actual ?? '-' }}
                </template>
              </el-table-column>
            </el-table>
          </AccentCard>

          <AccentCard accent-color="#e6a23c">
            <template #header>
              <span class="risk-center__section-title">供应商风险评分</span>
              <el-tag size="small">{{ scoreResult?.metadata?.mode || 'AI' }}</el-tag>
            </template>

            <div class="risk-center__tool-row">
              <el-select
                v-model="supplierId"
                class="risk-center__supplier-select"
                filterable
                :loading="suppliersLoading"
                placeholder="选择供应商"
                no-data-text="暂无供应商数据"
              >
                <el-option
                  v-for="supplier in suppliers"
                  :key="supplier.supplierId"
                  :label="`${supplier.supplierName}（${supplier.supplierId}）`"
                  :value="supplier.supplierId"
                >
                  <div class="supplier-option">
                    <span>{{ supplier.supplierName }}</span>
                    <span class="supplier-option__meta">
                      {{ supplier.supplierId }} · {{ supplier.region }} · {{ supplier.compositeScore.toFixed(1) }}分
                    </span>
                  </div>
                </el-option>
              </el-select>
              <el-button
                type="primary"
                :loading="scoreLoading"
                :disabled="!supplierId"
                @click="handleRiskScoreSubmit"
              >
                评分
              </el-button>
            </div>

            <el-alert
              v-if="scoreError"
              class="risk-center__alert"
              type="warning"
              :title="scoreError"
              show-icon
              :closable="false"
            />

            <div
              v-if="selectedSupplier"
              class="supplier-summary"
            >
              <el-tag type="info">{{ selectedSupplier.region }}</el-tag>
              <span>准时率 {{ selectedSupplier.onTimeRate.toFixed(1) }}%</span>
              <span>质量率 {{ selectedSupplier.qualityRate.toFixed(1) }}%</span>
              <span>价格稳定 {{ selectedSupplier.priceStability.toFixed(1) }}%</span>
              <span>响应 {{ selectedSupplier.responseScore.toFixed(1) }}%</span>
            </div>

            <div
              v-if="scoreResult"
              class="risk-score-overview"
            >
              <div class="risk-score-overview__score">
                <span class="risk-score-overview__number">{{ scoreResult.score.toFixed(1) }}</span>
                <el-tag
                  :color="riskScoreColor(scoreResult.risk_level)"
                  effect="dark"
                  size="large"
                  style="border: none"
                >
                  {{ riskLevelLabels[scoreResult.risk_level] || scoreResult.risk_level }}
                </el-tag>
              </div>

              <div
                v-if="scoreResult.breakdown"
                class="risk-score-overview__breakdown"
              >
                <div
                  v-for="item in breakdownItems"
                  :key="item.key"
                  class="risk-score-bar"
                >
                  <span class="risk-score-bar__label">{{ item.label }}</span>
                  <el-progress
                    :percentage="Math.round(scoreResult.breakdown[item.key] * 100)"
                    :stroke-width="12"
                    :color="item.color"
                  />
                  <span class="risk-score-bar__value">{{ (scoreResult.breakdown[item.key] * 100).toFixed(1) }}</span>
                </div>
              </div>
            </div>

            <ul
              v-if="scoreResult?.recommendations?.length"
              class="risk-center__recommendations"
            >
              <li
                v-for="(item, index) in scoreResult.recommendations"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>
          </AccentCard>
        </div>

        <div class="risk-center__ai-grid">
          <AccentCard accent-color="#409eff">
            <template #header>
              <span class="risk-center__section-title">自动异常摘要</span>
              <el-tag size="small">
                {{ analysisMetadata?.ai?.anomalyMode || 'unknown' }}
              </el-tag>
            </template>
            <div class="risk-center__summary">
              {{ anomaly?.summary || '暂无异常检测结果' }}
            </div>
            <div class="risk-center__auto-anomalies">
              <div
                v-for="(item, index) in anomaly?.anomalies || []"
                :key="`${item.field}-${index}`"
                class="risk-center__auto-anomaly"
              >
                <el-tag
                  size="small"
                  :type="item.severity === 'high' ? 'danger' : item.severity === 'medium' ? 'warning' : 'info'"
                >
                  {{ item.severity || item.reason || '异常' }}
                </el-tag>
                <span>{{ item.description || item.desc || item.reason || item.field }}</span>
              </div>
              <el-empty
                v-if="!anomaly?.anomalies?.length"
                description="暂无异常内容"
              />
            </div>
          </AccentCard>

          <AccentCard accent-color="#e6a23c">
            <template #header>
              <span class="risk-center__section-title">批量供应商评分</span>
              <el-tag size="small">
                {{ analysisSummary?.scoredSuppliers || 0 }} 家
              </el-tag>
            </template>
            <div class="risk-center__score-list">
              <div
                v-for="score in supplierRiskScores"
                :key="score.supplier_id"
                class="risk-center__score-item"
              >
                <div class="risk-center__score-main">
                  <span>{{ score.supplier_name || score.supplier_id }}</span>
                  <el-tag
                    :color="riskScoreColor(score.risk_level)"
                    effect="dark"
                    size="small"
                    style="border: none"
                  >
                    {{ score.risk_level }} / {{ score.score }}
                  </el-tag>
                </div>
                <div class="risk-center__score-rec">
                  {{ score.recommendations?.[0] || '暂无建议' }}
                </div>
              </div>
              <el-empty
                v-if="!supplierRiskScores.length"
                description="暂无供应商评分"
              />
            </div>
          </AccentCard>
        </div>

        <div class="risk-center__meta">
          数据源：{{ analysisMetadata?.source || 'mixed' }}
          <span>更新时间：{{ analysisMetadata?.updatedAt ? formatDate(analysisMetadata.updatedAt) : '-' }}</span>
          <span>开放风险：{{ analysisSummary?.openRisks ?? openRisks.length }}</span>
          <span>异常项：{{ analysisSummary?.anomalyCount ?? 0 }}</span>
        </div>

        <div class="risk-center__list">
          <AccentCard
            v-for="risk in openRisks"
            :key="risk.riskId"
            :accent-color="riskLevelColor(risk.riskLevel)"
          >
            <template #header>
              <el-tag
                :color="riskLevelColor(risk.riskLevel)"
                effect="dark"
                size="small"
                style="border: none"
              >
                {{ risk.riskLevelLabel }}
              </el-tag>
              <span class="risk-center__type">{{ risk.riskType }}</span>
              <span class="risk-center__time">{{ formatDate(risk.createdAt) }}</span>
            </template>

            <div class="risk-center__object">关联对象：{{ risk.relatedObject }}</div>
            <div class="risk-center__desc">{{ risk.description }}</div>

            <template #footer>
              <div class="risk-center__suggestion">
                <el-icon><CircleCheck /></el-icon>
                <span>{{ risk.suggestion }}</span>
              </div>
            </template>
          </AccentCard>

          <el-empty
            v-if="!openRisks.length"
            description="暂无待处理风险"
          />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped lang="scss">
.risk-center {
  &__stats {
    margin-bottom: $spacing-lg;
  }

  &__tool-grid,
  &__ai-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__tool-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__select {
    width: 200px;
  }

  &__supplier-select {
    max-width: 520px;
    width: 100%;
  }

  &__alert {
    margin-bottom: $spacing-md;
  }

  &__section-title {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  &__summary {
    margin-bottom: $spacing-md;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
    line-height: 1.6;
  }

  &__auto-anomalies {
    display: grid;
    gap: $spacing-sm;
  }

  &__auto-anomaly {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    color: var(--el-text-color-primary);
    font-size: $font-size-sm;
    line-height: 1.5;

    .el-tag {
      flex-shrink: 0;
      margin-top: 1px;
    }
  }

  &__score-list {
    display: grid;
    gap: $spacing-sm;
  }

  &__score-item {
    padding: $spacing-sm;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  &__score-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    margin-bottom: 6px;
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  &__score-rec {
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
    line-height: 1.5;
  }

  &__recommendations {
    margin-top: $spacing-md;
    padding-left: $spacing-lg;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-md;
  }

  &__type {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__time {
    color: var(--el-text-color-placeholder);
    font-size: $font-size-xs;
  }

  &__object {
    margin-bottom: $spacing-sm;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__desc {
    color: var(--el-text-color-primary);
    font-size: $font-size-md;
    line-height: 1.6;
  }

  &__suggestion {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    color: var(--el-color-success);
    font-size: $font-size-sm;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

.supplier-option {
  display: flex;
  justify-content: space-between;
  gap: $spacing-md;

  &__meta {
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
  }
}

.supplier-summary {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  color: var(--el-text-color-secondary);
  font-size: $font-size-sm;
}

.risk-score-overview {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-md;

  &__score {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: $spacing-md;
    background: var(--el-fill-color-lighter);
  }

  &__number {
    color: var(--el-text-color-primary);
    font-weight: 800;
    font-size: 44px;
  }

  &__breakdown {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.risk-score-bar {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 56px;
  align-items: center;
  gap: $spacing-sm;

  &__label {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  &__value {
    font-size: $font-size-sm;
    text-align: right;
  }
}

@media (max-width: 960px) {
  .risk-center__tool-grid,
  .risk-center__ai-grid,
  .risk-center__list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .risk-center__tool-row,
  .supplier-option {
    align-items: stretch;
    flex-direction: column;
  }

  .risk-center__select,
  .risk-center__supplier-select {
    max-width: none;
    width: 100%;
  }

  .risk-score-overview,
  .risk-score-bar {
    grid-template-columns: 1fr;
  }
}
</style>
