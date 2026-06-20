<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import AiChatPanel from '@/components/ai-studio/AiChatPanel.vue'

const visible = ref(false)
</script>

<template>
  <el-button
    class="floating-chat__button"
    type="primary"
    circle
    size="large"
    :icon="ChatDotRound"
    aria-label="打开智能问答"
    @click="visible = true"
  />

  <el-drawer
    v-model="visible"
    direction="rtl"
    :size="'min(92vw, 1180px)'"
    class="floating-chat__drawer"
  >
    <template #header>
      <div class="floating-chat__header">
        <h3>智能问答</h3>
        <span>供应链数据分析助手</span>
      </div>
    </template>

    <div class="floating-chat__body">
      <AiChatPanel />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.floating-chat {
  &__button {
    position: fixed;
    right: 28px;
    bottom: 28px;
    z-index: 2100;
    width: 56px;
    height: 56px;
    box-shadow: 0 12px 30px rgba(64, 158, 255, 0.35);
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h3 {
      margin: 0;
      color: var(--el-text-color-primary);
      font-weight: 700;
      font-size: $font-size-xl;
    }

    span {
      color: var(--el-text-color-secondary);
      font-size: $font-size-sm;
    }
  }

  &__body {
    min-height: 100%;

    :deep(.ai-panel) {
      max-width: none;
    }
  }
}

:deep(.floating-chat__drawer) {
  max-width: 1180px;
}

:deep(.floating-chat__drawer .el-drawer__body) {
  padding: $spacing-lg;
  overflow-y: auto;
}

@media (min-width: 1400px) {
  :deep(.floating-chat__drawer) {
    width: 82vw !important;
  }
}

@media (max-width: 768px) {
  .floating-chat__button {
    right: 18px;
    bottom: 18px;
  }

  :deep(.floating-chat__drawer) {
    width: 100vw !important;
  }

  :deep(.floating-chat__drawer .el-drawer__body) {
    padding: $spacing-md;
  }
}
</style>
