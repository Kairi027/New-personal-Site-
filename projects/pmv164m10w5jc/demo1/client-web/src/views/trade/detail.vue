<template>
  <div class="detail-page" v-if="product">
    <div class="img-box" v-if="product.image_urls?.length">
      <img :src="product.image_urls[0]" class="main-img" />
    </div>
    <div class="info-card">
      <p class="price">¥{{ (product.price || product.price_cents / 100).toFixed(2) }}</p>
      <h3 class="title">{{ product.title }}</h3>
      <p class="desc">{{ product.description || '暂无描述' }}</p>
      <el-tag v-if="product.status_label" size="small" :type="statusTagType(product.status)">{{ product.status_label }}</el-tag>
      <div class="takedown-reason" v-if="product.status === 'violated' && product.takedown_reason">
        <p class="takedown-label">下架原因</p>
        <p class="takedown-text">{{ product.takedown_reason }}</p>
      </div>
      <p class="stock-info" v-if="product.is_owner">库存：{{ (product.locked_count || 0) > 0 ? `${product.stock}（锁定：${product.locked_count}）` : `${product.stock} 件` }}</p>
      <p class="stock-hint" v-if="!product.is_owner && product.stock > 0 && product.stock <= 5">仅剩 {{ product.stock }} 件</p>
      <p class="stock-hint" v-if="product.status === 'on_sale' && product.stock === 0" style="color:#f56c6c">商品已售罄</p>
    </div>
    <div class="seller-card">
      <el-avatar :size="40" />
      <div class="seller-info">
        <span class="seller-name">{{ product.seller_name || '卖家' }}</span>
        <span class="seller-tip">闲置交易，谨慎下单</span>
      </div>
    </div>
    <div class="contact-card" v-if="product.contact && !product.is_owner">
      <h4>联系方式</h4>
      <p>{{ product.contact }}</p>
      <el-button size="small" @click="contactSeller">联系卖家</el-button>
    </div>
    <div class="action-bar" v-if="product.order_button_visible">
      <el-button type="warning" @click="handlePlaceOrder" :loading="ordering" style="width:100%">下单</el-button>
    </div>
    <div class="action-bar" v-if="product.is_owner" style="justify-content:center">
      <span style="color:#999;font-size:13px">这是您自己的商品</span>
    </div>
    <div class="action-bar" v-if="!product.order_button_visible && !product.is_owner && product.status !== 'on_sale'" style="justify-content:center">
      <span style="color:#999;font-size:13px">{{ product.status_label || '商品不可交易' }}</span>
    </div>

    <el-dialog v-model="orderConfirmDialog" title="订单确认" width="90%" :close-on-click-modal="false" :show-close="false">
      <div class="order-confirm-body" v-if="currentOrder">
        <div class="order-summary">
          <p class="summary-title">{{ product.title }}</p>
          <p class="summary-amount">¥{{ currentOrder.amount.toFixed(2) }}</p>
        </div>
        <div class="countdown-area" :class="{ expired: countdownExpired }">
          <p class="countdown-label" v-if="!countdownExpired">请在 <span class="countdown-time">{{ countdownText }}</span> 内完成支付</p>
          <p class="countdown-label expired" v-else>订单已超时，正在取消...</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeOrderConfirm">关闭</el-button>
        <el-button @click="cancelOrderFromConfirm">取消订单</el-button>
        <el-button type="primary" :disabled="countdownExpired" @click="proceedToPay">发起支付</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="payDialog" title="选择支付方式" width="90%" :close-on-click-modal="false" :show-close="false">
      <div class="pay-channels">
        <div v-for="ch in payChannels" :key="ch.channel" class="pay-item" :class="{ disabled: !ch.available }" @click="ch.available && startMockPay(ch.channel)">
          <span class="pay-icon">{{ payIcon(ch.channel) }}</span>
          <span class="pay-name">{{ ch.name }}</span>
          <span v-if="!ch.available" class="pay-disabled">{{ ch.disabled_reason }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelPayDialog">取消</el-button>
      </template>
    </el-dialog>

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
import { ElMessage } from 'element-plus'
import { tradeApi, messageApi } from '@/api'
import { request } from '@/api/request'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const product = ref<any>(null)
const ordering = ref(false)
const payDialog = ref(false)
const payChannels = ref<any[]>([])
const currentOrderId = ref('')

const orderConfirmDialog = ref(false)
const currentOrder = ref<any>(null)
const countdownSeconds = ref(1200)
const countdownExpired = computed(() => countdownSeconds.value <= 0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const mockPayDialog = ref(false)
const currentChannel = ref('')
const payStatus = ref<'idle' | 'processing' | 'success'>('idle')
const mockAmount = ref('0.00')
const qrPattern = ref<boolean[]>([])

const mockTitle = ref('支付')

const countdownText = computed(() => {
  const m = Math.floor(countdownSeconds.value / 60)
  const s = countdownSeconds.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

onMounted(async () => {
  try {
    product.value = await tradeApi.getDetail(route.params.id as string)
  } catch (e) {
    ElMessage.error('商品加载失败')
    router.replace('/trade')
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function contactSeller() {
  if (!userStore.token) { ElMessage.warning('请先登录'); router.push('/login'); return }
  if (product.value.is_owner) { ElMessage.warning('不能与自己发起私聊'); return }
  try {
    const data = await messageApi.createSession(product.value.seller_id)
    router.push(`/chat?session_id=${data.session_id}`)
  } catch (e: any) { ElMessage.error(e?.message || '创建会话失败') }
}

function startCountdown(_created_at?: string) {
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
  if (currentOrderId.value) {
    try {
      await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' })
    } catch (e) { /* ignore */ }
  }
  orderConfirmDialog.value = false
  ElMessage.warning('订单超时未支付，已自动取消')
  if (product.value) {
    product.value.order_button_visible = true
    product.value.status = 'on_sale'
    product.value.status_label = '在售'
  }
}

async function handlePlaceOrder() {
  if (!userStore.token) { ElMessage.warning('请先登录'); router.push('/login'); return }
  try {
    ordering.value = true
    const data = await tradeApi.createOrder(product.value.product_id)
    currentOrderId.value = data.order_id
    currentOrder.value = { amount: data.amount, created_at: data.created_at }
    orderConfirmDialog.value = true
    startCountdown(data.created_at)
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  } finally {
    ordering.value = false
  }
}

async function proceedToPay() {
  try {
    const channels = await request<any>({ url: `/orders/${currentOrderId.value}/pay-channels`, method: 'get' })
    payChannels.value = channels || []
    orderConfirmDialog.value = false
    if (countdownTimer) clearInterval(countdownTimer)
    payDialog.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '获取支付方式失败')
  }
}

async function cancelOrderFromConfirm() {
  if (currentOrderId.value) {
    try {
      await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' })
    } catch (e) { /* ignore */ }
  }
  orderConfirmDialog.value = false
  if (countdownTimer) clearInterval(countdownTimer)
  ElMessage.info('已取消订单')
  if (product.value) {
    product.value.order_button_visible = true
    product.value.status = 'on_sale'
    product.value.status_label = '在售'
  }
}

function closeOrderConfirm() {
  orderConfirmDialog.value = false
  if (countdownTimer) clearInterval(countdownTimer)
  ElMessage.info('订单待支付，可在【我的订单】里查看详情')
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
  mockAmount.value = (product.value.price || product.value.price_cents / 100).toFixed(2)
  payStatus.value = 'processing'
  payDialog.value = false
  mockPayDialog.value = true

  try {
    await tradeApi.payOrder(currentOrderId.value, channel)
  } catch (e: any) {
    ElMessage.error(e?.message || '发起支付失败')
    mockPayDialog.value = false
    return
  }

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
    await request({ url: `/orders/${currentOrderId.value}/notify`, method: 'post' })
  } catch (e: any) {
    ElMessage.warning('支付确认异常，请联系客服')
  }
}

async function cancelPayDialog() {
  if (currentOrderId.value) {
    try {
      await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' })
    } catch (e) { /* ignore */ }
  }
  payDialog.value = false
  ElMessage.info('已取消支付')
  if (product.value) {
    product.value.order_button_visible = true
    product.value.status = 'on_sale'
    product.value.status_label = '在售'
  }
}

async function cancelMockPay() {
  try {
    await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' })
  } catch (e) { /* ignore */ }
  mockPayDialog.value = false
  payStatus.value = 'idle'
  ElMessage.info('已取消支付')
  if (product.value) {
    product.value.order_button_visible = true
    product.value.status = 'on_sale'
    product.value.status_label = '在售'
  }
}

function finishPay() {
  mockPayDialog.value = false
  payStatus.value = 'idle'
  ElMessage.success('支付成功')
  product.value.order_button_visible = false
  product.value.status = 'sold'
  product.value.status_label = '售罄'
}

function statusTagType(s: string) {
  return { pending: 'warning', on_sale: 'success', locked: 'warning', sold: 'info', off_shelf: 'danger', rejected: 'danger', violated: 'danger' }[s] || 'info'
}
</script>

<style scoped lang="scss">
.detail-page { padding-bottom: 120px; }
.img-box { .main-img { width: 100%; max-height: 300px; object-fit: cover; } }
.info-card { background: #fff; padding: 16px; margin-bottom: 12px; .price { color: #f56c6c; font-size: 24px; font-weight: 700; margin: 0 0 8px; } .title { margin: 0 0 8px; } .desc { color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 8px; white-space: pre-wrap; } .stock-info { font-size: 13px; color: #666; margin: 8px 0 0; } .stock-hint { font-size: 13px; color: #fa8c16; margin: 8px 0 0; font-weight: 600; } .takedown-reason { background: #fff1f0; border: 1px solid #ffa39e; border-radius: 8px; padding: 10px 12px; margin: 10px 0 0; .takedown-label { color: #f56c6c; font-weight: 600; font-size: 13px; margin: 0 0 4px; } .takedown-text { color: #5c0011; font-size: 13px; margin: 0; line-height: 1.5; } } }
.seller-card { display: flex; gap: 12px; align-items: center; background: #fff; padding: 12px 16px; margin-bottom: 12px; .seller-info { display: flex; flex-direction: column; .seller-name { font-size: 15px; } .seller-tip { color: #999; font-size: 12px; } } }
.contact-card { background: #fff; padding: 16px; margin-bottom: 12px; h4 { margin: 0 0 8px; } p { color: #333; margin: 0 0 12px; } }
.action-bar { position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 8px 12px; background: #fff; border-top: 1px solid #eee; z-index: 101; display: flex; }
.order-confirm-body { .order-summary { text-align: center; padding: 16px 0; .summary-title { font-size: 16px; margin: 0 0 8px; } .summary-amount { font-size: 28px; font-weight: 700; color: #f56c6c; margin: 0; } } .countdown-area { text-align: center; padding: 16px; background: #fff7e6; border-radius: 8px; &.expired { background: #fff1f0; } .countdown-label { font-size: 14px; color: #666; margin: 0; .countdown-time { font-size: 20px; font-weight: 700; color: #fa8c16; } &.expired { color: #f56c6c; } } } }
.pay-channels {
  .pay-item { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; cursor: pointer; .pay-icon { font-size: 24px; } .pay-name { font-size: 16px; flex: 1; } .pay-disabled { display: block; font-size: 12px; color: #999; margin-top: 4px; } &:hover { background: #f5f7fa; } &.disabled { opacity: 0.5; cursor: not-allowed; &:hover { background: none; } } }
}
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
  .face-id-area { margin-top: 20px; }
  .face-id-icon { font-size: 48px; margin: 16px auto; width: 80px; height: 80px; border: 3px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
}
.mock-google-pay {
  .gpay-logo { font-size: 28px; font-weight: 700; color: #4285f4; }
  .gpay-area { margin-top: 20px; }
}
</style>
