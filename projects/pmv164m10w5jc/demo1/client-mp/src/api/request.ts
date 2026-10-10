const BASE_URL = 'http://127.0.0.1:8000/api/v1'

export function request<T = unknown>(options: UniApp.RequestOptions): Promise<T> {
  const token = uni.getStorageSync('user_token') as string
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      success: (res) => {
        const body = res.data as { code: number; message: string; data: T }
        if (body.code === 0) {
          resolve(body.data)
        } else {
          uni.showToast({ title: body.message, icon: 'none' })
          reject(body)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}