<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon?: string
  color?: string
  suffix?: string
}>()
</script>

<template>
  <el-card
    shadow="hover"
    class="stat-card"
    :style="{ '--stat-color': color || '#409eff' }"
  >
    <div class="stat-card__icon">
      <el-icon :size="28">
        <component
          :is="icon"
          v-if="icon"
        />
      </el-icon>
    </div>
    <div class="stat-card__content">
      <div class="stat-card__value">
        {{ value }}
        <span
          v-if="suffix"
          class="stat-card__suffix"
        >
          {{ suffix }}
        </span>
      </div>
      <div class="stat-card__title">{{ title }}</div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.stat-card {
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__icon {
    display: inline-block;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    @include flex-center;
    flex-shrink: 0;
    background: var(--stat-color, var(--el-color-primary));
    color: #fff;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__value {
    color: var(--el-text-color-primary);
    font-weight: 700;
    font-size: $font-size-xxl;
    line-height: 1.2;
    font-family: $font-family-mono;
  }

  &__suffix {
    margin-left: 2px;
    color: var(--el-text-color-secondary);
    font-weight: 400;
    font-size: $font-size-sm;
  }

  &__title {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }
}
</style>
