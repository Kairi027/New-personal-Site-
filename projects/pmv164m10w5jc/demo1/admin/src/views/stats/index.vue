<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.title">
        <el-card><p class="title">{{ card.title }}</p><p class="value">{{ card.value }}</p></el-card>
      </el-col>
    </el-row>
    <el-card style="margin-top:16px">
      <h3>数据概览</h3>
      <el-table :data="tableData" border style="margin-top:12px">
        <el-table-column prop="module" label="模块" />
        <el-table-column prop="count" label="数量" />
        <el-table-column prop="today" label="今日新增" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/api/request'

const cards = ref([
  { title: '总用户数', value: '—' },
  { title: '总帖子数', value: '—' },
  { title: '总商品数', value: '—' },
  { title: '总订单数', value: '—' },
])
const tableData = ref<any[]>([])

onMounted(async () => {
  try {
    const data = await request<any>({ url: '/stats/dashboard', method: 'get' })
    cards.value[0].value = data.user_count ?? 0
    cards.value[1].value = data.post_count ?? 0
    cards.value[2].value = data.product_count ?? 0
    cards.value[3].value = data.order_count ?? 0
    tableData.value = [
      { module: '用户', count: data.user_count ?? 0, today: data.today_user_count ?? 0 },
      { module: '帖子', count: data.post_count ?? 0, today: data.today_post_count ?? 0 },
      { module: '商品', count: data.product_count ?? 0, today: data.today_product_count ?? 0 },
      { module: '订单', count: data.order_count ?? 0, today: data.today_order_count ?? 0 },
    ]
  } catch (e) { /* ignore */ }
})
</script>

<style scoped lang="scss">
.title { color: #909399; } .value { font-size: 24px; font-weight: 600; }
</style>
