<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import {
  Odometer,
  DataBoard,
  DataAnalysis,
  Warning,
  MagicStick,
  Sunny,
  Moon,
  Expand,
  Fold,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const isCollapsed = computed({
  get: () => props.collapsed,
  set: (val) => emit('update:collapsed', val),
})

const menuItems = [
  { path: '/overview', title: '全局总览', icon: Odometer },
  { path: '/data-center', title: '数据中心', icon: DataBoard },
  { path: '/operations', title: '业务分析', icon: DataAnalysis },
  { path: '/risk-center', title: '风险中心', icon: Warning },
  { path: '/ai-studio', title: 'AI 工作台', icon: MagicStick },
]

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-aside :width="isCollapsed ? '64px' : '220px'" class="app-sidebar">
    <!-- 品牌 -->
    <div class="app-sidebar__brand">
      <h1 v-show="!isCollapsed" class="app-sidebar__title">供应链 BI</h1>
      <span v-show="isCollapsed" class="app-sidebar__logo">BI</span>
    </div>

    <!-- 导航菜单 -->
    <el-menu
      :default-active="route.path"
      :collapse="isCollapsed"
      :collapse-transition="false"
      router
      class="app-sidebar__menu"
      background-color="transparent"
      text-color="rgba(255, 255, 255, 0.7)"
      active-text-color="#ffffff"
    >
      <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>

    <!-- 底部操作区 -->
    <div class="app-sidebar__footer">
      <div class="app-sidebar__action" @click="toggleDark()">
        <el-icon :size="18"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        <span v-show="!isCollapsed">{{ isDark ? '亮色模式' : '深色模式' }}</span>
      </div>
      <div class="app-sidebar__action" @click="isCollapsed = !isCollapsed">
        <el-icon :size="18"><Expand v-if="isCollapsed" /><Fold v-else /></el-icon>
        <span v-show="!isCollapsed">收起菜单</span>
      </div>
      <div class="app-sidebar__action app-sidebar__action--logout" @click="handleLogout">
        <el-icon :size="18"><SwitchButton /></el-icon>
        <span v-show="!isCollapsed">退出登录</span>
      </div>
    </div>
  </el-aside>
</template>

<style scoped lang="scss">
.app-sidebar {
  background: var(--app-bg-sidebar);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width $transition-normal;

  &__brand {
    height: var(--app-header-height);
    @include flex-center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  &__title {
    color: #fff;
    font-size: $font-size-xl;
    font-weight: 700;
    white-space: nowrap;
  }

  &__logo {
    color: #fff;
    font-size: $font-size-xxl;
    font-weight: 800;
  }

  &__menu {
    flex: 1;
    border-right: none !important;
    overflow-y: auto;
    @include custom-scrollbar(rgba(255, 255, 255, 0.2));

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      margin: 2px 8px;
      border-radius: 8px;

      &:hover {
        background: var(--app-bg-sidebar-hover) !important;
      }

      &.is-active {
        background: var(--el-color-primary) !important;
        color: #fff !important;
      }
    }
  }

  &__footer {
    padding: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all $transition-fast;
    white-space: nowrap;
    font-size: $font-size-sm;

    &:hover {
      background: var(--app-bg-sidebar-hover);
      color: #fff;
    }

    &--logout:hover {
      color: var(--el-color-danger);
    }
  }
}
</style>
