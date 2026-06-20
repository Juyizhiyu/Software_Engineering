<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import {
  DataAnalysis,
  DataBoard,
  Expand,
  Fold,
  Moon,
  Odometer,
  Sunny,
  SwitchButton,
  TrendCharts,
  Warning,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)

const props = defineProps<{
  collapsed: boolean
  mobile?: boolean
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
  { path: '/decision-analysis', title: '决策分析', icon: TrendCharts },
  { path: '/risk-center', title: '风险中心', icon: Warning },
]

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout()
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<template>
  <el-aside
    :width="isCollapsed ? '64px' : '220px'"
    class="app-sidebar"
    :class="{ 'app-sidebar--mobile': props.mobile }"
  >
    <div class="app-sidebar__brand">
      <h1
        v-show="!isCollapsed"
        class="app-sidebar__title"
      >
        供应链 BI
      </h1>
      <span
        v-show="isCollapsed"
        class="app-sidebar__logo"
      >
        BI
      </span>
    </div>

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
      <el-menu-item
        v-for="item in menuItems"
        :key="item.path"
        :index="item.path"
      >
        <el-icon class="app-sidebar__menu__icon">
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>

    <div class="app-sidebar__footer">
      <div
        class="app-sidebar__action"
        @click="toggleDark()"
      >
        <el-icon :size="18">
          <Sunny v-if="isDark" />
          <Moon v-else />
        </el-icon>
        <span v-show="!isCollapsed">{{ isDark ? '亮色模式' : '深色模式' }}</span>
      </div>
      <div
        class="app-sidebar__action"
        @click="isCollapsed = !isCollapsed"
      >
        <el-icon :size="18">
          <Expand v-if="isCollapsed" />
          <Fold v-else />
        </el-icon>
        <span v-show="!isCollapsed">收起菜单</span>
      </div>
      <div
        class="app-sidebar__action app-sidebar__action--logout"
        @click="handleLogout"
      >
        <el-icon :size="18"><SwitchButton /></el-icon>
        <span v-show="!isCollapsed">退出登录</span>
      </div>
    </div>
  </el-aside>
</template>

<style scoped lang="scss">
.app-sidebar {
  display: flex;
  flex-direction: column;
  transition: width $transition-normal;
  background: var(--app-bg-sidebar);
  overflow: hidden;

  &--mobile {
    width: 100% !important;
    height: 100%;
  }

  &__brand {
    height: var(--app-header-height);
    @include flex-center;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__title {
    color: #fff;
    font-weight: 700;
    font-size: $font-size-xl;
    white-space: nowrap;
  }

  &__logo {
    color: #fff;
    font-weight: 800;
    font-size: $font-size-xxl;
  }

  &__menu {
    flex: 1;
    border-right: none !important;
    overflow-y: auto;
    @include custom-scrollbar(rgba(255, 255, 255, 0.2));

    :deep(.el-menu-item) {
      margin: 2px 8px;
      border-radius: 8px;
      height: 48px;
      line-height: 48px;

      &:hover {
        background: var(--app-bg-sidebar-hover) !important;
      }

      &.is-active {
        background: var(--el-color-primary) !important;
        color: #fff !important;
      }
    }

    &.el-menu--collapse {
      :deep(.el-menu-item) {
        justify-content: center;
        padding: 0 !important;
      }
    }
  }

  &__menu__icon {
    position: relative;
    right: 8px;
  }

  &__footer {
    flex-shrink: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 8px;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all $transition-fast;
    cursor: pointer;
    border-radius: 8px;
    padding: 10px 16px;
    color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-sm;
    white-space: nowrap;

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
