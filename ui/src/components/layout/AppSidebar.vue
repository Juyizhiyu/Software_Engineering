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
  SwitchButton,
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
    :width="isCollapsed ? '90px' : '220px'"
    class="app-sidebar"
  >
    <el-card class="app-sidebar__card" :body-style="{ padding: 0 }">
      <!-- 品牌 -->
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

      <!-- 导航菜单 -->
      <el-menu
        :default-active="route.path"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
        class="app-sidebar__menu"
        background-color="transparent"
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

      <!-- 底部操作区 -->
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
    </el-card>
  </el-aside>
</template>

<style scoped lang="scss">
.app-sidebar {
  padding: 12px;
  height: 100%;
}

.app-sidebar__card {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: var(--app-bg-sidebar);
  border: none;
  overflow: hidden;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    margin: 0;
  }
}

.app-sidebar__brand {
  height: var(--app-header-height);
  @include flex-center;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.app-sidebar__title {
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: $font-size-xl;
  white-space: nowrap;
}

.app-sidebar__logo {
  color: var(--el-color-primary);
  font-weight: 800;
  font-size: $font-size-xxl;
}

.app-sidebar__menu {
  flex: 1;
  border-right: none !important;
  overflow-y: auto;
  @include custom-scrollbar(var(--el-text-color-placeholder));

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
}

.app-sidebar__menu__icon {
  position: relative;
  right: 8px;
}

.app-sidebar__footer {
  flex-shrink: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px;
}

.app-sidebar__action {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all $transition-fast;
  cursor: pointer;
  border-radius: 8px;
  padding: 10px 16px;
  color: var(--el-text-color-primary);
  font-size: $font-size-sm;
  white-space: nowrap;

  &:hover {
    background: var(--app-bg-sidebar-hover);
    color: var(--el-text-color-primary);
  }

  &--logout:hover {
    color: var(--el-color-danger);
  }
}
</style>
