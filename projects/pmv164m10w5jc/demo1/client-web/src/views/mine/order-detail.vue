<template>
  <div class="order-detail-page" v-if="order">
    <div class="header">
      <el-button size="small" @click="$router.push('/mine/orders')">返回</el-button>
      <h3>订单详情</h3>
    </div>
    <div class="status-card">
      <el-tag :type="statusTagType(order.status)" size="large">{{ order.status_label }}</el-tag>
      <span class="role-tag" :class="order.role">{{ order.role === 'buyer' ? '买家' : '卖家' }}</span>
    </div>
    <div class="info-card">
      <h4>商品信息</h4>
      <div class="product-row">
        <img v-if="order.product?.image" :src="order.product.image" class="product-img" />
        <div>
          <p class="product-title">{{ order.product?.title }}</p>
          <p class="product-price">¥{{ order.product?.price?.toFixed(2) }}</p>
        </div>
      </div>
    </div>
    <div class="info-card">
      <h4>支付信息</h4>
      <p>支付方式：{{ order.payment?.pay_channel_label }}</p>
      <p>支付金额：¥{{ order.amount?.toFixed(2) }}</p>
      <p v-if="order.payment?.pay_time">支付时间：{{ formatDateTime(order.payment.pay_time) }}</p>
    </div>
    <div class="info-card" v-if="order.logistics?.ship_time">
      <h4>物流信息</h4>
      <p v-if="order.logistics.logistics_company">物流公司：{{ order.logistics.logistics_company }}</p>
      <p v-if="order.logistics.logistics_no">物流单号：{{ order.logistics.logistics_no }}</p>
      <p>发货时间：{{ formatDateTime(order.logistics.ship_time) }}</p>
      <p v-if="order.logistics.complete_time">完成时间：{{ formatDateTime(order.logistics.complete_time) }}</p>
    </div>
    <div class="info-card" v-if="order.cancel?.cancel_time">
      <h4>取消信息</h4>
      <p>取消时间：{{ formatDateTime(order.cancel.cancel_time) }}</p>
      <p v-if="order.cancel.cancel_reason">取消原因：{{ order.cancel.cancel_reason }}</p>
    </div>
    <div class="info-card" v-if="order.refund && (order.refund.refund_time || order.refund.refund_reason || order.refund.refund_apply_time || order.refund.refund_reject_reason || order.refund.refund_processing)">
      <h4>退款信息</h4>
      <p v-if="order.refund.refund_apply_time">申请时间：{{ formatDateTime(order.refund.refund_apply_time) }}</p>
      <p v-if="order.refund.refund_reason">退款原因：{{ order.refund.refund_reason }}</p>
      <p v-if="order.refund.refund_processing" class="processing-tip">退款处理中...</p>
      <p v-if="order.refund.refund_reject_reason">拒绝原因：{{ order.refund.refund_reject_reason }}</p>
      <p v-if="order.refund.refund_reject_time">拒绝时间：{{ formatDateTime(order.refund.refund_reject_time) }}</p>
      <p v-if="order.refund.refund_time">退款时间：{{ formatDateTime(order.refund.refund_time) }}</p>
    </div>
    <div class="action-bar">
      <el-button v-if="order.actions?.includes('cancel')" size="small" @click="handleCancel">取消订单</el-button>
      <el-button v-if="order.actions?.includes('pay')" size="small" type="warning" @click="handlePay">支付</el-button>
      <el-button v-if="order.actions?.includes('ship')" size="small" type="primary" @click="handleShip">发货</el-button>
      <el-button v-if="order.actions?.includes('confirm')" size="small" type="success" @click="handleConfirm">确认收货</el-button>
      <el-button v-if="order.actions?.includes('refund')" size="small" type="danger" @click="handleRefund">申请退款</el-button>
      <el-button v-if="order.role === 'seller' && order.status === 'refunding' && !order.refund?.refund_processing" size="small" type="success" @click="handleRefundAgree">同意退款</el-button>
      <el-button v-if="order.role === 'seller' && order.status === 'refunding' && !order.refund?.refund_processing" size="small" type="danger" @click="handleRefundReject">拒绝退款</el-button>
    </div>
  </div>
  <el-empty v-else description="加载中..." />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tradeApi } from '@/api'
import { formatDateTime } from '@/utils/time'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)

onMounted(async () => {
  try {
    order.value = await tradeApi.getOrderDetail(route.params.order_id as string)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
    router.push('/mine/orders')
  }
})

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定取消该订单？', '提示', { type: 'warning' })
    await tradeApi.cancelOrder(order.value.order_id)
    ElMessage.success('已取消')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '取消失败') }
}

async function handlePay() {
  router.push(`/mine/orders/${order.value.order_id}/pay`)
}

async function handleShip() {
  try {
    const { value } = await ElMessageBox.prompt('请输入物流单号', '发货', { inputPattern: /.+/, inputErrorMessage: '请输入物流单号' })
    await tradeApi.shipOrder(order.value.order_id)
    ElMessage.success('已发货')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '发货失败') }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确定已收到商品？', '确认收货', { type: 'warning' })
    await tradeApi.confirmOrder(order.value.order_id)
    ElMessage.success('已确认收货')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '确认失败') }
}

async function handleRefund() {
  try {
    const { value } = await ElMessageBox.prompt('请输入退款原因', '申请退款', { inputPattern: /.+/, inputErrorMessage: '请输入退款原因' })
    await tradeApi.refundApply(order.value.order_id, value)
    ElMessage.success('退款申请已提交')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '退款失败') }
}

async function handleRefundAgree() {
  try {
    await ElMessageBox.confirm('确定同意该退款申请？', '同意退款', { type: 'warning' })
    await tradeApi.refundAgree(order.value.order_id)
    ElMessage.success('已同意退款，处理中...')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '操作失败') }
}

async function handleRefundReject() {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', { inputPattern: /.+/, inputErrorMessage: '请输入拒绝原因' })
    await tradeApi.refundReject(order.value.order_id, value)
    ElMessage.success('已拒绝退款')
    order.value = await tradeApi.getOrderDetail(order.value.order_id)
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e?.message || '操作失败') }
}

function statusTagType(s: string) {
  return { pending_pay: 'warning', paid: 'primary', shipped: 'primary', completed: 'success', canceled: 'info', refunding: 'warning', refunded: 'info' }[s] || 'info'
}
</script>

<style scoped lang="scss">
.order-detail-page { padding: 12px; padding-bottom: 80px; .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; h3 { margin: 0; } } }
.status-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; .role-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; &.buyer { background: #e6f7ff; color: #1890ff; } &.seller { background: #fff7e6; color: #fa8c16; } } }
.info-card { background: #fff; padding: 16px; margin-bottom: 12px; border-radius: 8px; h4 { margin: 0 0 12px; } p { color: #666; font-size: 14px; margin: 4px 0; } .processing-tip { color: #e6a23c; font-weight: 600; } }
.product-row { display: flex; gap: 12px; align-items: center; .product-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; } .product-title { font-size: 15px; margin: 0 0 4px; } .product-price { color: #f56c6c; font-weight: 600; margin: 0; } }
.action-bar { position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 8px 12px; background: #fff; border-top: 1px solid #eee; z-index: 101; display: flex; gap: 8px; justify-content: center; }
</style>