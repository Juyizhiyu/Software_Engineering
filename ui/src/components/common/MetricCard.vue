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
  <el-card shadow="hover" class="stat-card" :style="{ '--stat-color': color || '#409eff' }">
    <div class="stat-card__icon">
      <el-icon :size="28"><component :is="icon" v-if="icon" /></el-icon>
    </div>
    <div class="stat-card__content">
      <div class="stat-card__value">
        {{ value }}
        <span v-if="suffix" class="stat-card__suffix">{{ suffix }}</span>
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    @include flex-center;
    background: var(--stat-color, var(--el-color-primary));
    color: #fff;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__value {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-family: $font-family-mono;
    line-height: 1.2;
  }

  &__suffix {
    font-size: $font-size-sm;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    margin-left: 2px;
  }

  &__title {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}
</style>
