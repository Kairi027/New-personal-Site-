<template>
  <div class="mine-orders-page">
    <div class="header">
      <el-button size="small" @click="$router.push('/mine')">返回</el-button>
      <h3>我的订单</h3>
    </div>
    <div class="role-tabs">
      <div class="role-tab" :class="{ active: activeRole === 'buyer' }" @click="switchRole('buyer')">购买</div>
      <div class="role-tab" :class="{ active: activeRole === 'seller' }" @click="switchRole('seller')">售卖</div>
    </div>
    <div class="filter-bar">
      <el-input v-model="filter.order_no" placeholder="订单号" size="small" style="width:120px" clearable />
      <el-input v-model="filter.keyword" placeholder="商品名称" size="small" style="width:120px" clearable />
      <el-select v-model="filter.status" placeholder="全部状态" size="small" style="width:100px" clearable>
        <el-option label="待支付" value="pending_pay" />
        <el-option label="已支付" value="paid" />
        <el-option label="已发货" value="shipped" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="canceled" />
        <el-option label="退款中" value="refunding" />
        <el-option label="已退款" value="refunded" />
      </el-select>
      <el-button size="small" type="primary" @click="loadOrders">查询</el-button>
    </div>
    <div class="order-list">
      <div v-for="o in orders" :key="o.order_id" class="order-card" @click="$router.push(`/mine/orders/${o.order_id}`)">
        <img v-if="o.product_image" :src="o.product_image" class="order-img" />
        <div class="order-info">
          <p class="order-title">{{ o.product_title }}</p>
          <p class="order-meta">¥{{ o.amount.toFixed(2) }} · {{ o.status_label }}</p>
          <p class="order-time">{{ formatDateTime(o.created_at) }}</p>
        </div>
        <span class="order-role" :class="o.role">{{ o.role === 'buyer' ? '买家' : '卖家' }}</span>
      </div>
    </div>
    <el-empty v-if="!orders.length" :description="activeRole === 'buyer' ? '暂无购买订单' : '暂无售卖订单'" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { tradeApi } from '@/api'
import { formatDateTime } from '@/utils/time'

const orders = ref<any[]>([])
const activeRole = ref<'buyer' | 'seller'>('buyer')
const filter = reactive({ order_no: '', keyword: '', status: '' })

function switchRole(role: 'buyer' | 'seller') {
  if (activeRole.value === role) return
  activeRole.value = role
  filter.order_no = ''
  filter.keyword = ''
  filter.status = ''
  loadOrders()
}

async function loadOrders() {
  try {
    const data = await tradeApi.listOrders({ page: 1, page_size: 50, keyword: filter.keyword, status: filter.status, order_no: filter.order_no, role: activeRole.value })
    orders.value = data.items || []
  } catch (e) { /* ignore */ }
}

onMounted(loadOrders)
</script>

<style scoped lang="scss">
.mine-orders-page { padding: 12px; .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; h3 { margin: 0; } } }
.role-tabs { display: flex; margin-bottom: 12px; border-bottom: 1px solid #eee; .role-tab { flex: 1; text-align: center; padding: 10px 0; font-size: 14px; color: #666; cursor: pointer; position: relative; &.active { color: #1890ff; font-weight: 600; &::after { content: ''; position: absolute; bottom: -1px; left: 25%; width: 50%; height: 2px; background: #1890ff; } } } }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.order-list { display: flex; flex-direction: column; gap: 8px; }
.order-card { display: flex; align-items: center; gap: 12px; background: #fff; padding: 12px; border-radius: 8px; cursor: pointer; &:hover { background: #f9f9f9; } }
.order-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.order-info { flex: 1; .order-title { font-size: 14px; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .order-meta { font-size: 13px; color: #f56c6c; margin: 0 0 2px; } .order-time { font-size: 12px; color: #999; margin: 0; } }
.order-role { font-size: 12px; padding: 2px 8px; border-radius: 4px; &.buyer { background: #e6f7ff; color: #1890ff; } &.seller { background: #fff7e6; color: #fa8c16; } }
</style>
