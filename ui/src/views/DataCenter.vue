<script setup lang="ts">
import { onMounted } from 'vue'
import type { TabPaneName } from 'element-plus'
import { useDataCenter } from '@/composables/useDataCenter'
import type { EntityType } from '@/types'
import PageHeader from '@/components/common/PageHeader.vue'
import EntityForm from '@/components/dataCenter/EntityForm.vue'
import EntityList from '@/components/dataCenter/EntityList.vue'

const {
  loading,
  submitting,
  activeEntity,
  records,
  form,
  formFields,
  metadata,
  error,
  entityOptions,
  fetchSchemas,
  fetchEntityData,
  submitData,
  switchEntity,
} = useDataCenter()

function handleTabChange(name: TabPaneName) {
  switchEntity(name as EntityType)
}

function handleReset() {
  form.value = {}
}

function handleFieldUpdate(key: string, value: string | number | null) {
  form.value = {
    ...form.value,
    [key]: value,
  }
}

onMounted(() => {
  fetchSchemas()
  fetchEntityData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="数据中心"
      description="录入和管理订单、库存、供应商、物流、成本、风险六类实体数据"
    />

    <el-alert
      v-if="error"
      class="data-center__alert"
      type="error"
      :title="error"
      show-icon
      :closable="false"
    />

    <div class="data-center__summary">
      <el-tag type="info">当前实体：{{ activeEntity }}</el-tag>
      <el-tag type="success">记录数：{{ records.length }}</el-tag>
      <el-tag v-if="metadata">数据源：{{ metadata.source }}</el-tag>
      <el-tag
        v-if="metadata?.quality"
        :type="metadata.quality.status === 'complete' ? 'success' : 'warning'"
      >
        数据质量：{{ metadata.quality.status }}
      </el-tag>
    </div>

    <el-tabs
      :model-value="activeEntity"
      class="data-center__tabs"
      @tab-change="handleTabChange"
    >
      <el-tab-pane
        v-for="opt in entityOptions"
        :key="opt.value"
        :label="opt.label"
        :name="opt.value"
      />
    </el-tabs>

    <div class="data-center__content">
      <div class="data-center__form-panel">
        <EntityForm
          :form="form"
          :form-fields="formFields"
          :submitting="submitting"
          @update:field="handleFieldUpdate"
          @submit="submitData"
          @reset="handleReset"
        />
      </div>

      <div class="data-center__list-panel">
        <EntityList
          :loading="loading"
          :records="records"
          :form-fields="formFields"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-center {
  &__alert,
  &__summary,
  &__tabs {
    margin-bottom: $spacing-md;
  }

  &__summary {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
    align-items: start;
    gap: $spacing-lg;
  }
}

@media (max-width: 960px) {
  .data-center__content {
    grid-template-columns: 1fr;
  }
}
</style>
