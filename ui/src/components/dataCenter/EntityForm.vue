<script setup lang="ts">
import type { SchemaField } from '@/types'

defineProps<{
  form: Record<string, string | number | null>
  formFields: SchemaField[]
  submitting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:field', key: string, value: string | number | null): void
  (e: 'submit'): void
  (e: 'reset'): void
}>()

function updateField(key: string, value: unknown) {
  emit('update:field', key, value == null ? null : (value as string | number))
}

function handleSubmit() {
  emit('submit')
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <el-card
    title="新增记录"
    class="entity-form"
  >
    <el-form
      :model="form"
      label-width="100px"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <el-form-item
        v-for="field in formFields"
        :key="field.key"
        :label="field.label"
        :required="field.required"
      >
        <el-input
          v-if="field.type === 'text'"
          :model-value="form[field.key] as string"
          :placeholder="field.placeholder || `请输入${field.label}`"
          @update:model-value="updateField(field.key, $event)"
        />

        <el-input-number
          v-else-if="field.type === 'number'"
          :model-value="form[field.key] as number"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :controls="false"
          style="width: 100%"
          @update:model-value="updateField(field.key, $event)"
        />

        <el-select
          v-else-if="field.type === 'select'"
          :model-value="form[field.key]"
          :placeholder="`请选择${field.label}`"
          style="width: 100%"
          @update:model-value="updateField(field.key, $event)"
        >
          <el-option
            v-for="opt in field.options"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>

        <el-date-picker
          v-else-if="field.type === 'date'"
          :model-value="form[field.key] as string"
          type="date"
          :placeholder="`请选择${field.label}`"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          @update:model-value="updateField(field.key, $event)"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交数据
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.entity-form {
  :deep(.el-form-item) {
    margin-bottom: $spacing-md;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background: var(--el-bg-color);
  }
}
</style>
