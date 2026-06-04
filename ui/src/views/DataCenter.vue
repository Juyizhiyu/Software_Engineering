<script setup lang="ts">
import { onMounted } from 'vue'
import type { TabPaneName } from 'element-plus'
import { useDataCenter } from '@/composables/useDataCenter'
import type { EntityType } from '@/types'
import PageHeader from '@/components/common/PageHeader.vue'

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

onMounted(() => {
  fetchSchemas()
  fetchEntityData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="数据中心" description="录入和管理供应链六类实体数据" />

    <!-- 实体类型 Tab -->
    <el-tabs :model-value="activeEntity" class="data-center__tabs" @tab-change="handleTabChange">
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
        <h3 class="data-center__panel-title">新增记录</h3>
        <el-form
          :model="form"
          label-width="100px"
          label-position="top"
          class="data-center__form"
          @submit.prevent="submitData"
        >
          <el-form-item
            v-for="field in formFields"
            :key="field.key"
            :label="field.label"
            :required="field.required"
          >
            <!-- 文本输入 -->
            <el-input
              v-if="field.type === 'text'"
              v-model="form[field.key]"
              :placeholder="field.placeholder || `请输入${field.label}`"
            />
            <!-- 数字输入 -->
            <el-input-number
              v-else-if="field.type === 'number'"
              :model-value="(form[field.key] as number | null | undefined)"
              @update:model-value="(val: number | null | undefined) => { form[field.key] = val ?? null }"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :controls="false"
              style="width: 100%"
            />
            <!-- 下拉选择 -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="form[field.key]"
              :placeholder="`请选择${field.label}`"
              style="width: 100%"
            >
              <el-option
                v-for="opt in field.options"
                :key="opt"
                :label="opt"
                :value="opt"
              />
            </el-select>
            <!-- 日期选择 -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="form[field.key]"
              type="date"
              :placeholder="`请选择${field.label}`"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submitData">
              提交数据
            </el-button>
            <el-button @click="form = {}">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：数据列表 -->
      <div class="data-center__list-panel">
        <h3 class="data-center__panel-title">
          已有记录
          <el-tag size="small" type="info" class="data-center__count">
            {{ records.length }}
          </el-tag>
        </h3>
        <el-skeleton :loading="loading" animated>
          <template #default>
            <el-table
              :data="records.slice(0, 20)"
              size="small"
              stripe
              :max-height="500"
              class="data-center__table"
            >
              <el-table-column
                v-for="field in formFields.slice(0, 5)"
                :key="field.key"
                :prop="field.key"
                :label="field.label"
                min-width="100"
                show-overflow-tooltip
              />
            </el-table>
            <div v-if="records.length > 20" class="data-center__more">
              仅展示前 20 条，共 {{ records.length }} 条记录
            </div>
          </template>
        </el-skeleton>
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
    gap: $spacing-lg;
    align-items: start;
  }

  &__form-panel,
  &__list-panel {
    @include card;
  }

  &__panel-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }
  }

  &__count {
    margin-left: auto;
  }

  &__table {
    width: 100%;
  }

  &__more {
    text-align: center;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    padding: $spacing-sm 0;
  }
}
</style>
