<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'

const collapsed = ref(false)
</script>

<template>
  <el-container class="app-layout">
    <AppSidebar v-model:collapsed="collapsed" />
    <el-container>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
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

.app-main {
  overflow-y: auto;
  @include custom-scrollbar;
}
</style>
