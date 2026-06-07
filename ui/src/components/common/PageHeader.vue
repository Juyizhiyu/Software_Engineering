<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="page-header">
    <h2 class="page-header__title">{{ title }}</h2>
    <p
      v-if="description"
      class="page-header__desc"
    >
      {{ description }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: $spacing-lg;

  &__title {
    color: var(--el-text-color-primary);
    font-weight: 600;
    font-size: $font-size-xxl;
  }

  &__desc {
    margin-top: $spacing-xs;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }
}
</style>
