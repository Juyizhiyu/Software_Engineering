<script setup lang="ts">
import { useAiAnomaly } from '@/composables/useAiAnomaly'

const { loading, dataType, dataTypeOptions, result, submit } = useAiAnomaly()

async function handleSubmit() {
  try {
    await submit()
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : '检测失败')
  }
}
</script>

<template>
  <div class="ai-panel">
    <el-card shadow="hover" class="ai-panel__input">
      <div class="ai-panel__input-row">
        <el-select v-model="dataType" style="width: 200px">
          <el-option
            v-for="opt in dataTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          检测异常
        </el-button>
      </div>
    </el-card>

    <el-card v-if="result" shadow="hover" class="ai-panel__result">
      <h4 class="ai-panel__title">{{ result.data_type }} 异常检测结果</h4>
      <el-alert
        :title="result.summary"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <el-table
        v-if="result.anomalies.length"
        :data="result.anomalies"
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
            <span class="mono" style="color: var(--el-color-danger)">{{ row.actual }}</span>
          </template>
        </el-table-column>
      </el-table>
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

  &__meta {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
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
