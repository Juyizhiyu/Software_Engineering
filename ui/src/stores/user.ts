import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const name = ref<string>(localStorage.getItem('userName') || '')
  const role = ref<string>(localStorage.getItem('userRole') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setUser(userInfo: UserInfo) {
    token.value = userInfo.token
    name.value = userInfo.name
    role.value = userInfo.role
    localStorage.setItem('token', userInfo.token)
    localStorage.setItem('userName', userInfo.name)
    localStorage.setItem('userRole', userInfo.role)
  }

  function logout() {
    token.value = ''
    name.value = ''
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
  }

  return { token, name, role, isLoggedIn, setUser, logout }
})
