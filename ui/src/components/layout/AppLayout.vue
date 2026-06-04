<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'

const collapsed = ref(false)
</script>

<template>
  <div class="app-layout">
    <AppSidebar v-model:collapsed="collapsed" />
    <main class="app-layout__main" :class="{ 'app-layout__main--expanded': collapsed }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-layout__main {
  flex: 1;
  margin-left: var(--app-sidebar-width);
  transition: margin-left $transition-normal;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &--expanded {
    margin-left: var(--app-sidebar-collapsed-width);
  }
}
</style>
