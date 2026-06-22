<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="page-header">
    <div class="page-header__main">
      <h2 class="page-header__title">{{ title }}</h2>
      <p
        v-if="description"
        class="page-header__desc"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="page-header__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  &__main {
    min-width: 0;
  }

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

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: $spacing-sm;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;

    &__actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
