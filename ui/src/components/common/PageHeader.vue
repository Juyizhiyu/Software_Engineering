<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <el-page-header :title="title" class="page-header">
    <template #content>
      <span class="page-header__title">{{ title }}</span>
    </template>
    <template v-if="description" #extra>
      <span class="page-header__desc">{{ description }}</span>
    </template>
  </el-page-header>
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
  }
}
</style>
