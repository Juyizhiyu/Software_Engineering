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

      <el-form class="login-card__form" @submit.prevent="handleLogin">
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
        <el-button text size="small" @click="isDark = !isDark">
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
  background: linear-gradient(135deg, #1d1e2c 0%, #2a3a5c 50%, #1d1e2c 100%);
  position: relative;
  overflow: hidden;

  // 装饰背景
  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.15) 0%, transparent 70%);
    top: -200px;
    right: -100px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(103, 194, 58, 0.1) 0%, transparent 70%);
    bottom: -100px;
    left: -50px;
  }
}

.login-card {
  width: 400px;
  padding: $spacing-xl;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1;

  @include dark-mode {
    background: rgba(255, 255, 255, 0.04);
  }

  // 亮色模式覆盖
  :root:not(.dark) & {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.06);
  }

  &__header {
    text-align: center;
    margin-bottom: $spacing-xl;
  }

  &__title {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 2px;

    :root:not(.dark) & {
      color: $color-text-primary;
    }
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: rgba(255, 255, 255, 0.6);
    margin-top: $spacing-sm;

    :root:not(.dark) & {
      color: $color-text-secondary;
    }
  }

  &__form {
    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: none;

      :root:not(.dark) & {
        background: #fff;
        border-color: $color-border;
      }
    }

    :deep(.el-input__inner) {
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      :root:not(.dark) & {
        color: $color-text-primary;

        &::placeholder {
          color: $color-text-placeholder;
        }
      }
    }
  }

  &__btn {
    width: 100%;
    height: 44px;
    font-size: $font-size-lg;
    border-radius: 10px;
  }

  &__footer {
    @include flex-between;
    margin-top: $spacing-lg;
  }

  &__hint {
    font-size: $font-size-xs;
    color: rgba(255, 255, 255, 0.4);

    :root:not(.dark) & {
      color: $color-text-placeholder;
    }
  }
}
</style>
