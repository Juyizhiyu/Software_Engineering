<script setup lang="ts">
defineProps<{
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <el-empty :description="description || '暂无数据'" />
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  @include flex-center;
  padding: $spacing-xl * 2;
}
</style>
