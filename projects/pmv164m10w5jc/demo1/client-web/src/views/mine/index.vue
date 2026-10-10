<template>
  <div class="mine-page">
    <div class="profile-card">
      <el-avatar :src="profile?.avatar_url" :size="64" />
      <div class="info">
        <h4>{{ profile?.nickname || '未登录' }}</h4>
        <p>{{ profile?.bio || '暂无简介' }}</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">{{ stats.post_count || 0 }}</span><span class="label">发帖</span></div>
      <div class="stat"><span class="num">{{ stats.like_count || 0 }}</span><span class="label">获赞</span></div>
      <div class="stat"><span class="num">{{ stats.comment_count || 0 }}</span><span class="label">评论</span></div>
    </div>
    <div class="menu-list">
      <div class="menu-item" @click="$router.push('/mine/posts')"><span>📝 我的帖子</span><span>›</span></div>
      <div class="menu-item" @click="$router.push('/mine/products')"><span>🛒 我的商品</span><span>›</span></div>
      <div class="menu-item" @click="$router.push('/mine/orders')"><span>📦 我的订单</span><span>›</span></div>


      <div class="menu-item" @click="logout"><span>退出登录</span><span>›</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { communityApi, authApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const profile = ref<any>(null)
const stats = ref<any>({})

onMounted(async () => {
  try {
    const data = await communityApi.myPage()
    profile.value = data.profile
    stats.value = data
  } catch (e) {
    try { profile.value = await authApi.getMe() } catch (_) {}
  }
})

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.mine-page { padding: 12px; }
.profile-card { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; .info { h4 { margin: 0 0 4px; } p { color: #999; font-size: 14px; margin: 0; } } }
.stats { display: flex; justify-content: space-around; margin-bottom: 16px; .stat { text-align: center; .num { display: block; font-size: 20px; font-weight: 600; } .label { color: #999; font-size: 12px; } } }
.menu-list { background: #fff; border-radius: 8px; overflow: hidden; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer; &:last-child { border-bottom: none; } &:hover { background: #f9f9f9; } span:first-child { font-size: 15px; } span:last-child { color: #ccc; } }
</style>
