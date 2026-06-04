<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="page-header">
    <h2 class="page-header__title">{{ title }}</h2>
    <p v-if="description" class="page-header__desc">{{ description }}</p>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  margin-bottom: $spacing-lg;

  &__title {
    font-size: $font-size-xxl;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
    margin-top: $spacing-xs;
  }
}
</style>
