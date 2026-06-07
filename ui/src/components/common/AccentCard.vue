<script setup lang="ts">
defineProps<{
  /** 左侧色条颜色，支持 CSS 变量或色值 */
  accentColor?: string
}>()
</script>

<template>
  <div
    class="status-card"
    :style="accentColor ? { '--status-card-accent': accentColor } : undefined"
  >
    <div v-if="$slots.header" class="status-card__header">
      <slot name="header" />
    </div>
    <div class="status-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="status-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.status-card {
  @include card;
  @include card-hover;
  border-left: 4px solid var(--status-card-accent, var(--el-color-primary));

  &__header {
    @include flex-between;
    margin-bottom: $spacing-md;
  }

  &__body {
    margin-bottom: $spacing-md;

    &:only-child {
      margin-bottom: 0;
    }
  }

  &__footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: $spacing-md;
  }
}
</style>
