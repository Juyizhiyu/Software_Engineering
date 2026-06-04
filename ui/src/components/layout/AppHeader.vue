<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <h2 class="app-header__title">
        <slot name="title" />
      </h2>
    </div>
    <div class="app-header__right">
      <span class="app-header__user">{{ userStore.name }}</span>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  height: var(--app-header-height);
  @include flex-between;
  padding: 0 $spacing-lg;
  background: var(--app-bg-card);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  &__title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__user {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }
}
</style>
