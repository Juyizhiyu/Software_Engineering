<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import { useBreakpoints } from '@vueuse/core'
import AppSidebar from './AppSidebar.vue'
import FloatingAiChat from '@/components/common/FloatingAiChat.vue'

const collapsed = ref(false)
const mobileDrawerVisible = ref(false)
const breakpoints = useBreakpoints({ mobile: 960 })
const isMobile = breakpoints.smaller('mobile')
const mainClass = computed(() => ({
  'app-main': true,
  'app-main--mobile': isMobile.value,
}))
</script>

<template>
  <el-container class="app-layout">
    <AppSidebar
      v-if="!isMobile"
      v-model:collapsed="collapsed"
    />
    <el-container>
      <el-header
        v-if="isMobile"
        class="app-mobile-header"
      >
        <el-button
          text
          :icon="Menu"
          aria-label="打开导航"
          @click="mobileDrawerVisible = true"
        />
        <span class="app-mobile-header__title">供应链 BI</span>
      </el-header>
      <el-main :class="mainClass">
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
    <FloatingAiChat />

    <el-drawer
      v-model="mobileDrawerVisible"
      direction="ltr"
      size="240px"
      :with-header="false"
      class="app-layout__drawer"
    >
      <AppSidebar
        v-model:collapsed="collapsed"
        mobile
      />
    </el-drawer>
  </el-container>
</template>

<style scoped lang="scss">
.app-layout {
  height: 100vh;

  :deep(.app-layout__drawer .el-drawer__body) {
    padding: 0;
  }
}

.app-main {
  overflow-y: auto;
  @include custom-scrollbar;

  &--mobile {
    padding: $spacing-md;
  }
}

.app-mobile-header {
  @include flex-between;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  height: 56px;
  background: var(--el-bg-color);

  &__title {
    font-weight: 700;
    font-size: $font-size-lg;
  }
}
</style>
