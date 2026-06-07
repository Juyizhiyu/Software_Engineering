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

onMounted(() => {
  fetchSchemas()
  fetchEntityData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader
      title="数据中心"
      description="录入和管理供应链六类实体数据"
    />

    <!-- 实体类型 Tab -->
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
      <!-- 左侧：录入表单 -->
      <div class="data-center__form-panel">
        <EntityForm
          :form="form"
          :form-fields="formFields"
          :submitting="submitting"
          @submit="submitData"
          @reset="handleReset"
        />
      </div>

      <!-- 右侧：数据列表 -->
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
  &__tabs {
    margin-bottom: $spacing-lg;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 380px 1fr;
    align-items: start;
    gap: $spacing-lg;
  }
}
</style>
