/** 社区文化接口 */
import { request } from './request';
export const communityApi = {
    listPosts: (sectionId, page = 1, pageSize = 20) => request({ url: '/posts', method: 'get', params: { section_id: sectionId, page, page_size: pageSize } }),
    listSections: () => request({ url: '/sections', method: 'get' }),
    getPost: (postId) => request({ url: `/posts/${postId}`, method: 'get' }),
    createPost: (data) => request({ url: '/posts', method: 'post', data }),
    createComment: (postId, content) => request({ url: `/posts/${postId}/comments`, method: 'post', data: { content } }),
    toggleLike: (postId) => request({ url: `/posts/${postId}/like`, method: 'post' }),
    unlike: (postId) => request({ url: `/posts/${postId}/like`, method: 'delete' }),
    getComments: (postId) => request({ url: `/posts/${postId}/comments`, method: 'get' }),
    myPage: () => request({ url: '/my/page', method: 'get' }),
    deletePost: (postId) => request({ url: `/posts/${postId}`, method: 'delete' }),
    republishPost: (postId, data) => request({ url: `/posts/${postId}/republish`, method: 'put', data }),
};
/** 闲置交易接口 */
export const tradeApi = {
    search: (params) => request({ url: '/products', method: 'get', params }),
    getDetail: (productId) => request({ url: `/products/${productId}`, method: 'get' }),
    mine: (params) => request({ url: '/products/mine', method: 'get', params }),
    createProduct: (data) => request({ url: '/products', method: 'post', data }),
    deleteProduct: (productId) => request({ url: `/products/${productId}`, method: 'delete' }),
    listTrash: (params) => request({ url: '/products/trash', method: 'get', params }),
    purgeProduct: (productId) => request({ url: `/products/${productId}/purge`, method: 'delete' }),
    republishProduct: (productId, data) => request({ url: `/products/${productId}/republish`, method: 'put', data }),
    createOrder: (productId) => request({ url: '/orders', method: 'post', data: { product_id: productId } }),
    payOrder: (orderId, channel = 'wechat') => request({ url: `/orders/${orderId}/pay`, method: 'post', data: { channel } }),
    shipOrder: (orderId) => request({ url: `/orders/${orderId}/ship`, method: 'post' }),
    receiveOrder: (orderId) => request({ url: `/orders/${orderId}/receive`, method: 'post' }),
    refundOrder: (orderId) => request({ url: `/orders/${orderId}/refund`, method: 'post' }),
    refundApply: (orderId, reason) => request({ url: `/orders/${orderId}/refund-apply`, method: 'post', data: { reason } }),
    refundAgree: (orderId) => request({ url: `/orders/${orderId}/refund-agree`, method: 'post' }),
    refundReject: (orderId, reason) => request({ url: `/orders/${orderId}/refund-reject`, method: 'post', data: { reason } }),
    listOrders: (params) => request({ url: '/orders', method: 'get', params }),
    getOrderDetail: (orderId) => request({ url: `/orders/${orderId}`, method: 'get' }),
    confirmOrder: (orderId) => request({ url: `/orders/${orderId}/confirm`, method: 'post' }),
    cancelOrder: (orderId) => request({ url: `/orders/${orderId}/cancel`, method: 'post' }),
    notifyPay: (orderId) => request({ url: `/orders/${orderId}/notify`, method: 'post' }),
};
/** 出行规划接口 */
export const travelApi = {
    planRoute: (data) => request({ url: '/travel/routes', method: 'post', data }),
    searchPlaces: (keyword, location) => request({ url: '/travel/search', method: 'get', params: { keyword, location } }),
    startNavi: (routeId) => request({ url: '/travel/navi/start', method: 'post', data: { route_id: routeId } }),
    stopNavi: (sessionId) => request({ url: '/travel/navi/stop', method: 'post', params: { session_id: sessionId } }),
};
/** 天气接口 */
export const weatherApi = {
    now: (city) => request({ url: '/weather/now', method: 'get', params: { city } }),
    forecast: (city, days = 7) => request({ url: '/weather/forecast', method: 'get', params: { city, days } }),
    alerts: (city) => request({ url: '/weather/alerts', method: 'get', params: { city } }),
    searchCities: (keyword) => request({ url: '/weather/cities', method: 'get', params: { keyword } }),
    hotCities: () => request({ url: '/weather/hot-cities', method: 'get' }),
    allCities: (province) => request({ url: '/weather/all-cities', method: 'get', params: { province } }),
};
/** AI 智能体接口 */
export const aiApi = {
    createSession: (title = '新对话') => request({ url: '/ai/sessions', method: 'post', data: { title } }),
    listSessions: () => request({ url: '/ai/sessions', method: 'get' }),
    getHistory: (sessionId) => request({ url: `/ai/sessions/${sessionId}/messages`, method: 'get' }),
    chat: (sessionId, content) => request({ url: '/ai/chat', method: 'post', data: { session_id: sessionId, content } }),
    deleteSession: (sessionId) => request({ url: `/ai/sessions/${sessionId}`, method: 'delete' }),
};
/** 认证接口 */
export const authApi = {
    sendCode: (account) => request({ url: '/auth/send-code', method: 'post', data: { account } }),
    register: (data) => request({ url: '/auth/register', method: 'post', data }),
    login: (account, password) => request({ url: '/auth/login', method: 'post', data: { account, password } }),
    getMe: () => request({ url: '/users/me', method: 'get' }),
    updateMe: (data) => request({ url: '/users/me', method: 'put', data }),
};
/** 私信接口 */
export const messageApi = {
    createSession: (targetUserId) => request({ url: '/messages/sessions', method: 'post', data: { target_user_id: targetUserId } }),
    listSessions: () => request({ url: '/messages/sessions', method: 'get' }),
    getMessages: (sessionId, page = 1) => request({ url: `/messages/sessions/${sessionId}`, method: 'get', params: { page } }),
    send: (sessionId, content) => request({ url: '/messages/send', method: 'post', data: { session_id: sessionId, content } }),
    clearSession: (sessionId) => request({ url: `/messages/sessions/${sessionId}/clear`, method: 'post' }),
};
/** 文件上传 */
export const fileApi = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request({ url: '/files/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
    },
};
//# sourceMappingURL=index.js.map