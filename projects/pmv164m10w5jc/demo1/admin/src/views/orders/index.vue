<template>
  <div>
    <div style="margin-bottom:16px">
      <el-select v-model="statusFilter" placeholder="订单状态" style="width:150px" @change="load">
        <el-option label="全部" value="" />
        <el-option label="待支付" value="pending_pay" /><el-option label="已支付" value="paid" />
        <el-option label="已发货" value="shipped" /><el-option label="已完成" value="completed" />
        <el-option label="已取消" value="canceled" /><el-option label="退款中" value="refunding" />
        <el-option label="已退款" value="refunded" />
      </el-select>
    </div>
    <el-table :data="orders" border>
      <el-table-column prop="order_id" label="订单号" width="120" show-overflow-tooltip />
      <el-table-column prop="product_title" label="商品" width="180" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag>{{ statusText(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" :formatter="timeFormatter" />

    </el-table>
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="load" style="margin-top:16px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { request } from '@/api/request'
import { formatDateTime } from '@/utils/time'

const timeFormatter = (_r: any, _c: any, val: string) => formatDateTime(val)

const statusFilter = ref('')
const orders = ref<any[]>([])
const page = ref(1)
const total = ref(0)

async function load() {
  try {
    const data = await request<any>({ url: '/orders', method: 'get', params: { page: page.value, page_size: 20, status: statusFilter.value } })
    orders.value = data.items || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
}
onMounted(load)


function statusText(s: string) {
  return { pending_pay: '待支付', paid: '已支付', shipped: '已发货', completed: '已完成', canceled: '已取消', refunding: '退款中', refunded: '已退款' }[s] || s
}
</script>
