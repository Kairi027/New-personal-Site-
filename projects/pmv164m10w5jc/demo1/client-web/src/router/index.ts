import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'


const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    redirect: '/community',
    children: [
      { path: 'community', name: 'Community', component: () => import('@/views/community/index.vue'), meta: { tab: '社区', public: true } },
      { path: 'trade', name: 'Trade', component: () => import('@/views/trade/index.vue'), meta: { tab: '闲置', public: true } },
      { path: 'travel', name: 'Travel', component: () => import('@/views/travel/index.vue'), meta: { tab: '出行', public: true } },
      { path: 'weather', name: 'Weather', component: () => import('@/views/weather/index.vue'), meta: { tab: '天气', public: true } },
      { path: 'mine', name: 'Mine', component: () => import('@/views/mine/index.vue'), meta: { tab: '我的' } },
      { path: 'ai-chat', name: 'AIChat', component: () => import('@/views/ai-chat/index.vue'), meta: { public: true } },
      { path: 'post/:id', name: 'PostDetail', component: () => import('@/views/community/detail.vue'), meta: { public: true } },
      { path: 'post/create', name: 'PostCreate', component: () => import('@/views/community/create.vue') },
      { path: 'community/my', name: 'MyPosts', redirect: '/mine/posts' },
      { path: 'community/republish/:id', name: 'PostRepublish', component: () => import('@/views/community/republish.vue') },
      { path: 'trade/create', name: 'TradeCreate', component: () => import('@/views/trade/create.vue') },
      { path: 'trade/republish/:id', name: 'TradeRepublish', component: () => import('@/views/trade/republish.vue') },
      { path: 'goods/:id', name: 'GoodsDetail', component: () => import('@/views/trade/detail.vue'), meta: { public: true } },
      { path: 'chat', name: 'Chat', component: () => import('@/views/chat/index.vue') },
      { path: 'mine/posts', name: 'MinePosts', component: () => import('@/views/community/my.vue') },
      { path: 'mine/products', name: 'MineProducts', component: () => import('@/views/mine/products.vue') },
      { path: 'mine/products/trash', name: 'MineTrash', component: () => import('@/views/mine/trash.vue') },
      { path: 'mine/orders', name: 'MineOrders', component: () => import('@/views/mine/orders.vue') },
      { path: 'mine/orders/:order_id', name: 'OrderDetail', component: () => import('@/views/mine/order-detail.vue') },
      { path: 'mine/orders/:orderId/pay', name: 'OrderPay', component: () => import('@/views/mine/order-pay.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router