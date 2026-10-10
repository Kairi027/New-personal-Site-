<template>
  <div class="order-pay-page" v-if="order">
    <div class="header">
      <el-button size="small" @click="handleBack">返回</el-button>
      <h3>选择支付方式</h3>
    </div>

    <div class="order-summary-card">
      <div class="summary-row">
        <span class="summary-label">商品名称</span>
        <span class="summary-value">{{ order.product?.title || '商品' }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">订单编号</span>
        <span class="summary-value order-no">{{ order.order_id }}</span>
      </div>
      <div class="summary-amount-row">
        <span class="amount-label">支付金额</span>
        <span class="amount-value">¥{{ order.amount?.toFixed(2) }}</span>
      </div>
    </div>

    <div class="countdown-area" :class="{ expired: countdownExpired }">
      <p class="countdown-label" v-if="!countdownExpired">请在 <span class="countdown-time">{{ countdownText }}</span> 内完成支付</p>
      <p class="countdown-label expired" v-else>订单已超时，请重新下单</p>
    </div>

    <div class="off-shelf-warning" v-if="productOffShelf">
      <p class="warning-text">⚠️ 商品已下架</p>
      <p class="warning-hint">商品已被卖家或平台下架，无法继续支付。您可以取消订单或保留订单等待商品恢复在售。</p>
    </div>

    <div class="pay-channels-card" v-if="!productOffShelf">
      <h4 class="card-title">选择支付方式</h4>
      <div class="pay-channels">
        <div v-for="ch in payChannels" :key="ch.channel" class="pay-item" :class="{ disabled: !ch.available }" @click="ch.available && !countdownExpired && startMockPay(ch.channel)">
          <span class="pay-icon">{{ payIcon(ch.channel) }}</span>
          <span class="pay-name">{{ ch.name }}</span>
          <span v-if="!ch.available" class="pay-disabled">{{ ch.disabled_reason }}</span>
          <span v-else class="pay-arrow">›</span>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <el-button @click="handleCancelOrder" :disabled="payLoading">取消订单</el-button>
    </div>

    <el-dialog v-model="mockPayDialog" :title="mockTitle" width="90%" :close-on-click-modal="false" :show-close="false">
      <div class="mock-pay-body">
        <template v-if="currentChannel === 'wechat'">
          <div class="mock-wechat">
            <div class="qr-placeholder">
              <div class="qr-grid">
                <div v-for="i in 64" :key="i" class="qr-cell" :class="{ on: qrPattern[i - 1] }"></div>
              </div>
            </div>
            <p class="mock-amount">¥{{ mockAmount }}</p>
            <p class="mock-hint" v-if="payStatus === 'processing'">请使用微信扫一扫，扫描二维码支付</p>
            <p class="mock-hint success" v-if="payStatus === 'success'">支付成功</p>
          </div>
        </template>
        <template v-if="currentChannel === 'alipay'">
          <div class="mock-alipay">
            <div class="alipay-logo">支付宝</div>
            <p class="mock-amount">¥{{ mockAmount }}</p>
            <p class="mock-hint" v-if="payStatus === 'processing'">正在跳转支付宝...</p>
            <p class="mock-hint success" v-if="payStatus === 'success'">支付成功</p>
          </div>
        </template>
        <template v-if="currentChannel === 'apple_pay'">
          <div class="mock-apple-pay">
            <div class="apple-pay-logo">Pay</div>
            <p class="mock-amount">¥{{ mockAmount }}</p>
            <div v-if="payStatus === 'processing'" class="face-id-area">
              <div class="face-id-icon">Face ID</div>
              <p class="mock-hint">请验证面容以确认支付</p>
              <el-button type="primary" @click="confirmMockPay" style="width:100%;margin-top:16px">确认支付</el-button>
            </div>
            <p class="mock-hint success" v-if="payStatus === 'success'">支付成功</p>
          </div>
        </template>
        <template v-if="currentChannel === 'google_pay'">
          <div class="mock-google-pay">
            <div class="gpay-logo">G Pay</div>
            <p class="mock-amount">¥{{ mockAmount }}</p>
            <div v-if="payStatus === 'processing'" class="gpay-area">
              <p class="mock-hint">确认使用 Google Pay 支付</p>
              <el-button type="primary" @click="confirmMockPay" style="width:100%;margin-top:16px">确认支付</el-button>
            </div>
            <p class="mock-hint success" v-if="payStatus === 'success'">支付成功</p>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button v-if="payStatus === 'processing'" @click="cancelMockPay">取消支付</el-button>
        <el-button v-if="payStatus === 'success'" type="primary" @click="finishPay">完成</el-button>
      </template>
    </el-dialog>
  </div>
  <el-empty v-else description="加载中..." />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tradeApi } from '@/api'
import { request } from '@/api/request'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)
const payChannels = ref<any[]>([])
const orderId = ref('')

const countdownSeconds = ref(1200)
const countdownExpired = computed(() => countdownSeconds.value <= 0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const mockPayDialog = ref(false)
const currentChannel = ref('')
const payStatus = ref<'idle' | 'processing' | 'success'>('idle')
const mockAmount = ref('0.00')
const qrPattern = ref<boolean[]>([])
const mockTitle = ref('支付')
const payLoading = ref(false)
const productOffShelf = ref(false)

const countdownText = computed(() => {
  const m = Math.floor(countdownSeconds.value / 60)
  const s = countdownSeconds.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

onMounted(async () => {
  orderId.value = route.params.orderId as string
  try {
    order.value = await tradeApi.getOrderDetail(orderId.value)
    if (order.value.status !== 'pending_pay') {
      ElMessage.warning('订单状态不可支付')
      router.replace(`/mine/orders/${orderId.value}`)
      return
    }
    mockAmount.value = order.value.amount?.toFixed(2) || '0.00'
    await loadPayChannels()
    startCountdown()
  } catch (e: any) {
    ElMessage.error(e?.message || '订单加载失败')
    router.replace('/mine/orders')
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function loadPayChannels() {
  try {
    const channels = await request<any>({ url: `/orders/${orderId.value}/pay-channels`, method: 'get' })
    payChannels.value = channels || []
    productOffShelf.value = false
  } catch (e: any) {
    if (e?.message?.includes('已下架')) {
      productOffShelf.value = true
      payChannels.value = []
    } else {
      ElMessage.error(e?.message || '获取支付方式失败')
    }
  }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  countdownSeconds.value = 1200
  countdownTimer = setInterval(() => {
    countdownSeconds.value--
    if (countdownSeconds.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      handleCountdownExpired()
    }
  }, 1000)
}

async function handleCountdownExpired() {
  ElMessage.warning('订单超时未支付，已自动取消')
  try {
    await tradeApi.cancelOrder(orderId.value)
  } catch (e) { /* ignore */ }
  router.replace('/mine/orders')
}

function payIcon(channel: string) {
  return { wechat: '💚', alipay: '💙', apple_pay: '🍎', google_pay: '🅖' }[channel] || '💳'
}

function generateQrPattern() {
  const pattern: boolean[] = []
  for (let i = 0; i < 64; i++) pattern.push(Math.random() > 0.5)
  pattern[0] = pattern[7] = pattern[56] = pattern[63] = true
  return pattern
}

async function startMockPay(channel: string) {
  const ch = payChannels.value.find(c => c.channel === channel)
  mockTitle.value = ch?.name || '支付'
  currentChannel.value = channel
  payStatus.value = 'processing'
  payLoading.value = true
  mockPayDialog.value = true

  try {
    await tradeApi.payOrder(orderId.value, channel)
  } catch (e: any) {
    if (e?.message?.includes('已下架')) {
      productOffShelf.value = true
      payChannels.value = []
      ElMessage.warning('商品已下架，无法支付')
      mockPayDialog.value = false
      payLoading.value = false
      return
    }
    ElMessage.error(e?.message || '发起支付失败')
    mockPayDialog.value = false
    payLoading.value = false
    return
  }

  payLoading.value = false

  if (channel === 'wechat') {
    qrPattern.value = generateQrPattern()
    setTimeout(() => confirmMockPay(), 3000)
  } else if (channel === 'alipay') {
    setTimeout(() => confirmMockPay(), 2500)
  }
}

async function confirmMockPay() {
  if (payStatus.value !== 'processing') return
  payStatus.value = 'success'
  try {
    await request({ url: `/orders/${orderId.value}/notify`, method: 'post' })
  } catch (e: any) {
    ElMessage.warning('支付确认异常，请联系客服')
  }
}

async function cancelMockPay() {
  try {
    await tradeApi.cancelOrder(orderId.value)
  } catch (e) { /* ignore */ }
  mockPayDialog.value = false
  payStatus.value = 'idle'
  ElMessage.info('已取消支付')
  router.replace('/mine/orders')
}

function finishPay() {
  mockPayDialog.value = false
  payStatus.value = 'idle'
  ElMessage.success('支付成功')
  router.replace(`/mine/orders/${orderId.value}`)
}

function handleBack() {
  ElMessage.info('订单待支付，可在【我的订单】里查看详情')
  router.push('/mine/orders')
}

async function handleCancelOrder() {
  try {
    await ElMessageBox.confirm('确定取消该订单？', '提示', { type: 'warning' })
    await tradeApi.cancelOrder(orderId.value)
    ElMessage.success('已取消')
    router.replace('/mine/orders')
  } catch (e: any) { if (e !== 'cancel' && e?.message) ElMessage.error(e?.message || '取消失败') }
}
</script>

<style scoped lang="scss">
.order-pay-page { padding: 12px; padding-bottom: 80px; .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; h3 { margin: 0; } } }
.order-summary-card { background: #fff; padding: 16px; margin-bottom: 12px; border-radius: 8px; .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; .summary-label { color: #999; font-size: 13px; } .summary-value { color: #333; font-size: 14px; font-weight: 500; max-width: 60%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.order-no { font-size: 12px; color: #999; } } } .summary-amount-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 6px; border-top: 1px dashed #eee; margin-top: 6px; .amount-label { color: #666; font-size: 14px; } .amount-value { color: #f56c6c; font-size: 24px; font-weight: 700; } } }
.countdown-area { text-align: center; padding: 14px; background: #fff7e6; border-radius: 8px; margin-bottom: 12px; &.expired { background: #fff1f0; } .countdown-label { font-size: 14px; color: #666; margin: 0; .countdown-time { font-size: 22px; font-weight: 700; color: #fa8c16; } &.expired { color: #f56c6c; } } }
.off-shelf-warning { background: #fff1f0; border: 1px solid #ffa39e; border-radius: 8px; padding: 16px; margin-bottom: 12px; text-align: center; .warning-text { font-size: 18px; font-weight: 700; color: #f56c6c; margin: 0 0 8px; } .warning-hint { font-size: 13px; color: #5c0011; margin: 0; line-height: 1.5; } }
.pay-channels-card { background: #fff; padding: 16px; margin-bottom: 12px; border-radius: 8px; .card-title { margin: 0 0 12px; font-size: 15px; } }
.pay-channels {
  .pay-item { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; cursor: pointer; .pay-icon { font-size: 24px; } .pay-name { font-size: 16px; flex: 1; } .pay-disabled { display: block; font-size: 12px; color: #999; margin-top: 4px; } .pay-arrow { color: #ccc; font-size: 20px; } &:hover { background: #f5f7fa; } &.disabled { opacity: 0.5; cursor: not-allowed; &:hover { background: none; } } }
}
.action-bar { position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 8px 12px; background: #fff; border-top: 1px solid #eee; z-index: 101; display: flex; gap: 8px; justify-content: center; }
.mock-pay-body { text-align: center; padding: 20px 0; min-height: 200px; }
.mock-amount { font-size: 32px; font-weight: 700; color: #333; margin: 16px 0; }
.mock-hint { color: #999; font-size: 14px; margin-top: 12px; &.success { color: #67c23a; font-size: 18px; font-weight: 600; } }
.mock-wechat {
  .qr-placeholder { display: flex; justify-content: center; margin: 16px 0; }
  .qr-grid { display: grid; grid-template-columns: repeat(8, 1fr); width: 160px; height: 160px; border: 2px solid #07c160; padding: 8px; background: #fff; }
  .qr-cell { width: 16px; height: 16px; &.on { background: #333; } }
}
.mock-alipay {
  .alipay-logo { font-size: 28px; color: #1677ff; font-weight: 700; }
}
.mock-apple-pay {
  .apple-pay-logo { font-size: 28px; font-weight: 700; color: #333; }
  .face-id-area { margin-top: 16px; .face-id-icon { font-size: 24px; font-weight: 600; color: #333; } }
}
.mock-google-pay {
  .gpay-logo { font-size: 28px; font-weight: 700; color: #4285f4; }
  .gpay-area { margin-top: 16px; }
}
</style>