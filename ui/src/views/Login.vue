<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'
import { useDark } from '@vueuse/core'

const router = useRouter()
const userStore = useUserStore()
const isDark = useDark()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const { data } = await login({ username: form.username, password: form.password })
    userStore.setUser(data)
    ElMessage.success('登录成功')
    router.push('/overview')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <h1 class="login-card__title">供应链 BI</h1>
        <p class="login-card__subtitle">AI 赋能供应链可视化分析系统</p>
      </div>

      <el-form
        class="login-card__form"
        @submit.prevent="handleLogin"
      >
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-card__btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-card__footer">
        <span class="login-card__hint">默认账号：admin / 123456</span>
        <el-button
          text
          size="small"
          @click="isDark = !isDark"
        >
          {{ isDark ? '亮色模式' : '深色模式' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  width: 100%;
  height: 100vh;
  @include flex-center;
  position: relative;
  background: linear-gradient(135deg, #1d1e2c 0%, #2a3a5c 50%, #1d1e2c 100%);
  overflow: hidden;

  // 装饰背景
  &::before {
    position: absolute;
    top: -200px;
    right: -100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.15) 0%, transparent 70%);
    width: 600px;
    height: 600px;
    content: '';
  }

  &::after {
    position: absolute;
    bottom: -100px;
    left: -50px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(103, 194, 58, 0.1) 0%, transparent 70%);
    width: 400px;
    height: 400px;
    content: '';
  }
}

.login-card {
  z-index: 1;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  padding: $spacing-xl;
  width: 400px;

  @include dark-mode {
    background: rgba(255, 255, 255, 0.04);
  }

  // 亮色模式覆盖
  :root:not(.dark) & {
    border-color: rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.9);
  }

  &__header {
    margin-bottom: $spacing-xl;
    text-align: center;
  }

  &__title {
    color: #fff;
    font-weight: 800;
    font-size: 32px;
    letter-spacing: 2px;

    :root:not(.dark) & {
      color: var(--el-text-color-primary);
    }
  }

  &__subtitle {
    margin-top: $spacing-sm;
    color: rgba(255, 255, 255, 0.6);
    font-size: $font-size-sm;

    :root:not(.dark) & {
      color: var(--el-text-color-secondary);
    }
  }

  &__form {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.08);

      :root:not(.dark) & {
        border-color: var(--el-border-color);
        background: #fff;
      }
    }

    :deep(.el-input__inner) {
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      :root:not(.dark) & {
        color: var(--el-text-color-primary);

        &::placeholder {
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }

  &__btn {
    border-radius: 10px;
    width: 100%;
    height: 44px;
    font-size: $font-size-lg;
  }

  &__footer {
    @include flex-between;
    margin-top: $spacing-lg;
  }

  &__hint {
    color: rgba(255, 255, 255, 0.4);
    font-size: $font-size-xs;

    :root:not(.dark) & {
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
