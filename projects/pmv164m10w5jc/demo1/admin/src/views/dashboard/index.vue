<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.title">
        <el-card><p class="title">{{ card.title }}</p><p class="value">{{ card.value }}</p></el-card>
      </el-col>
    </el-row>
    <el-card style="margin-top:16px">
      <h3>欢迎使用本地生活管理后台</h3>
      <p>请通过左侧菜单进入各管理模块。</p>
      <p style="margin-top:12px;color:#999;">管理员：{{ auth.adminInfo?.username || '—' }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/api/request'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const cards = ref([
  { title: '注册用户', value: '—' },
  { title: '待审帖子', value: '—' },
  { title: '待审商品', value: '—' },
  { title: '今日订单', value: '—' },
])

onMounted(async () => {
  try {
    const data = await request<any>({ url: '/stats/dashboard', method: 'get' })
    cards.value[0].value = data.user_count ?? 0
    cards.value[1].value = data.pending_post_count ?? 0
    cards.value[2].value = data.pending_product_count ?? 0
    cards.value[3].value = data.today_order_count ?? 0
  } catch (e) { /* ignore */ }
})
</script>

<style scoped lang="scss">
.dashboard { .title { color: #909399; } .value { font-size: 24px; font-weight: 600; } }
</style>
