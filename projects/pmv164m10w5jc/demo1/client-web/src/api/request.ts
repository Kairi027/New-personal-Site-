import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX,
  timeout: 15000,
})

service.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data
    if (body?.code === 0) return body.data
    ElMessage.error(body?.message || '请求失败')
    return Promise.reject(body)
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    } else {
      const msg = error.response?.data?.message
        || (error.response?.data?.detail?.[0]?.msg && `参数错误：${error.response.data.detail[0].msg}`)
        || error.message
        || '网络异常'
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

export const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  service(config) as unknown as Promise<T>