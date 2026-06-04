<script setup lang="ts">
import { onMounted } from 'vue'
import { useRisks } from '@/composables/useRisks'
import { riskLevelColor, formatDate } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'

const { loading, openRisks, riskStats, fetchRisks } = useRisks()

onMounted(() => {
  fetchRisks()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="风险中心" description="供应链风险监控与闭环管理" />

    <el-skeleton :loading="loading" animated>
      <template #default>
        <!-- 风险统计 -->
        <div class="card-grid card-grid--4 risk-center__stats">
          <StatCard title="严重风险" :value="riskStats.Critical" icon="WarningFilled" color="#f56c6c" />
          <StatCard title="高级风险" :value="riskStats.High" icon="Warning" color="#e6a23c" />
          <StatCard title="中级风险" :value="riskStats.Medium" icon="InfoFilled" color="#409eff" />
          <StatCard title="低级风险" :value="riskStats.Low" icon="CircleCheck" color="#67c23a" />
        </div>

        <!-- 风险卡片列表 -->
        <div class="risk-center__list">
          <div
            v-for="risk in openRisks"
            :key="risk.riskId"
            class="risk-card"
            :style="{ '--risk-color': riskLevelColor(risk.riskLevel) }"
          >
            <div class="risk-card__header">
              <el-tag
                :color="riskLevelColor(risk.riskLevel)"
                effect="dark"
                size="small"
                style="border: none"
              >
                {{ risk.riskLevelLabel }}
              </el-tag>
              <span class="risk-card__type">{{ risk.riskType }}</span>
              <span class="risk-card__time">{{ formatDate(risk.createdAt) }}</span>
            </div>
            <div class="risk-card__body">
              <div class="risk-card__object">关联对象：{{ risk.relatedObject }}</div>
              <div class="risk-card__desc">{{ risk.description }}</div>
            </div>
            <div class="risk-card__footer">
              <div class="risk-card__suggestion">
                <el-icon><CircleCheck /></el-icon>
                <span>{{ risk.suggestion }}</span>
              </div>
            </div>
          </div>

          <el-empty v-if="!openRisks.length" description="暂无待处理风险" />
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

  &__list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }
}

.risk-card {
  @include card;
  @include card-hover;
  border-left: 4px solid var(--risk-color);

  &__header {
    @include flex-between;
    margin-bottom: $spacing-md;
  }

  &__type {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }

  &__time {
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
  }

  &__body {
    margin-bottom: $spacing-md;
  }

  &__object {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
    margin-bottom: $spacing-sm;
  }

  &__desc {
    font-size: $font-size-md;
    color: var(--el-text-color-primary);
    line-height: 1.6;
  }

  &__footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }

  &__suggestion {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-success;

    .el-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }
}
</style>
