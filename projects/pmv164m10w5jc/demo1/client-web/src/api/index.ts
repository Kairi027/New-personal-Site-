/** 社区文化接口 */
import { request } from './request'

export const communityApi = {
  listPosts: (sectionId: string, page = 1, pageSize = 20) =>
    request({ url: '/posts', method: 'get', params: { section_id: sectionId, page, page_size: pageSize } }),
  listSections: () => request({ url: '/sections', method: 'get' }),
  getPost: (postId: string) => request({ url: `/posts/${postId}`, method: 'get' }),
  createPost: (data: { section_id: string; title: string; content: string; image_urls: string[] }) =>
    request({ url: '/posts', method: 'post', data }),
  createComment: (postId: string, content: string) =>
    request({ url: `/posts/${postId}/comments`, method: 'post', data: { content } }),
  toggleLike: (postId: string) => request({ url: `/posts/${postId}/like`, method: 'post' }),
  unlike: (postId: string) => request({ url: `/posts/${postId}/like`, method: 'delete' }),
  getComments: (postId: string) => request({ url: `/posts/${postId}/comments`, method: 'get' }),
  deleteComment: (postId: string, commentId: string) => request({ url: `/posts/${postId}/comments/${commentId}`, method: 'delete' }),
  myPage: () => request({ url: '/my/page', method: 'get' }),
  deletePost: (postId: string) => request({ url: `/posts/${postId}`, method: 'delete' }),
  republishPost: (postId: string, data: { section_id: string; title: string; content: string; image_urls: string[] }) =>
    request({ url: `/posts/${postId}/republish`, method: 'put', data }),

}

/** 闲置交易接口 */
export const tradeApi = {
  search: (params: { keyword?: string; category_id?: string; page?: number; page_size?: number }) =>
    request({ url: '/products', method: 'get', params }),
  getDetail: (productId: string) => request({ url: `/products/${productId}`, method: 'get' }),
  mine: (params: { page?: number; page_size?: number; include_deleted?: boolean }) =>
    request({ url: '/products/mine', method: 'get', params }),
  createProduct: (data: { title: string; description?: string; price: number; image_urls: string[]; category_id?: string; contact: string }) =>
    request({ url: '/products', method: 'post', data }),
  deleteProduct: (productId: string) => request({ url: `/products/${productId}`, method: 'delete' }),
  listTrash: (params: { page?: number; page_size?: number }) =>
    request({ url: '/products/trash', method: 'get', params }),
  purgeProduct: (productId: string) => request({ url: `/products/${productId}/purge`, method: 'delete' }),
  republishProduct: (productId: string, data: { title: string; description?: string; price: number; image_urls: string[]; category_id?: string; contact: string }) =>
    request({ url: `/products/${productId}/republish`, method: 'put', data }),
  createOrder: (productId: string) => request({ url: '/orders', method: 'post', data: { product_id: productId } }),
  payOrder: (orderId: string, channel = 'wechat') => request({ url: `/orders/${orderId}/pay`, method: 'post', data: { channel } }),
  shipOrder: (orderId: string) => request({ url: `/orders/${orderId}/ship`, method: 'post' }),
  receiveOrder: (orderId: string) => request({ url: `/orders/${orderId}/receive`, method: 'post' }),
  refundOrder: (orderId: string) => request({ url: `/orders/${orderId}/refund`, method: 'post' }),
  refundApply: (orderId: string, reason?: string) => request({ url: `/orders/${orderId}/refund-apply`, method: 'post', data: { reason } }),
  refundAgree: (orderId: string) => request({ url: `/orders/${orderId}/refund-agree`, method: 'post' }),
  refundReject: (orderId: string, reason?: string) => request({ url: `/orders/${orderId}/refund-reject`, method: 'post', data: { reason } }),
  listOrders: (params: { page?: number; page_size?: number; keyword?: string; status?: string; order_no?: string; role?: string }) =>
    request({ url: '/orders', method: 'get', params }),
  getOrderDetail: (orderId: string) => request({ url: `/orders/${orderId}`, method: 'get' }),
  confirmOrder: (orderId: string) => request({ url: `/orders/${orderId}/confirm`, method: 'post' }),
  cancelOrder: (orderId: string) => request({ url: `/orders/${orderId}/cancel`, method: 'post' }),
  notifyPay: (orderId: string) => request({ url: `/orders/${orderId}/notify`, method: 'post' }),
}

/** 出行规划接口 */
export const travelApi = {
  planRoute: (data: { origin: { lng: number; lat: number }; destination: { lng: number; lat: number }; mode?: string }) =>
    request({ url: '/travel/routes', method: 'post', data }),
  searchPlaces: (keyword: string, location?: string) =>
    request({ url: '/travel/search', method: 'get', params: { keyword, location } }),
  startNavi: (routeId: string) => request({ url: '/travel/navi/start', method: 'post', data: { route_id: routeId } }),
  stopNavi: (sessionId: string) => request({ url: '/travel/navi/stop', method: 'post', params: { session_id: sessionId } }),
}

/** 天气接口 */
export const weatherApi = {
  now: (city: string) => request({ url: '/weather/now', method: 'get', params: { city } }),
  forecast: (city: string, days = 7) => request({ url: '/weather/forecast', method: 'get', params: { city, days } }),
  alerts: (city: string) => request({ url: '/weather/alerts', method: 'get', params: { city } }),
  searchCities: (keyword?: string) => request({ url: '/weather/cities', method: 'get', params: { keyword } }),
  hotCities: () => request({ url: '/weather/hot-cities', method: 'get' }),
  allCities: (province?: string) => request({ url: '/weather/all-cities', method: 'get', params: { province } }),
}

/** AI 智能体接口 */
export const aiApi = {
  createSession: (title = '新对话') => request({ url: '/ai/sessions', method: 'post', data: { title } }),
  listSessions: () => request({ url: '/ai/sessions', method: 'get' }),
  getHistory: (sessionId: string) => request({ url: `/ai/sessions/${sessionId}/messages`, method: 'get' }),
  chat: (sessionId: string, content: string) => request({ url: '/ai/chat', method: 'post', data: { session_id: sessionId, content } }),
  deleteSession: (sessionId: string) => request({ url: `/ai/sessions/${sessionId}`, method: 'delete' }),
}

/** 认证接口 */
export const authApi = {
  sendCode: (account: string) => request({ url: '/auth/send-code', method: 'post', data: { account } }),
  register: (data: { account: string; password: string; nickname: string }) =>
    request({ url: '/auth/register', method: 'post', data }),
  login: (account: string, password: string) => request({ url: '/auth/login', method: 'post', data: { account, password } }),
  getMe: () => request({ url: '/users/me', method: 'get' }),
  updateMe: (data: { nickname?: string; avatar_url?: string; bio?: string }) => request({ url: '/users/me', method: 'put', data }),
}

/** 私信接口 */
export const messageApi = {
  createSession: (targetUserId: string) => request({ url: '/messages/sessions', method: 'post', data: { target_user_id: targetUserId } }),
  listSessions: () => request({ url: '/messages/sessions', method: 'get' }),
  getMessages: (sessionId: string, page = 1) => request({ url: `/messages/sessions/${sessionId}`, method: 'get', params: { page } }),
  send: (sessionId: string, content: string) => request({ url: '/messages/send', method: 'post', data: { session_id: sessionId, content } }),
  clearSession: (sessionId: string) => request({ url: `/messages/sessions/${sessionId}/clear`, method: 'post' }),
}

/** 文件上传 */
export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request({ url: '/files/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
  },
}