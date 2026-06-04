<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'

const collapsed = ref(false)
</script>

<template>
  <el-container class="app-layout">
    <AppSidebar v-model:collapsed="collapsed" />
    <el-container>
      <el-header class="app-header">
        <div class="app-header__left">
          <slot name="header" />
        </div>
        <div class="app-header__right">
          <slot name="header-extra" />
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
}

.app-header {
  @include flex-between;
  padding: 0 $spacing-lg;
  background: var(--app-bg-card);
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__left {
    display: flex;
    align-items: center;
  }

  &__right {
    display: flex;
    align-items: center;
  }
}

.app-main {
  overflow-y: auto;
  @include custom-scrollbar;
}
</style>
