import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('user_token') || '')
  const userInfo = ref<Record<string, unknown> | null>(
    JSON.parse(localStorage.getItem('user_info') || 'null')
  )

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('user_token', t)
  }
  function setUserInfo(info: Record<string, unknown>) {
    userInfo.value = info
    localStorage.setItem('user_info', JSON.stringify(info))
  }
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_info')
  }
  return { token, userInfo, setToken, setUserInfo, logout }
})
