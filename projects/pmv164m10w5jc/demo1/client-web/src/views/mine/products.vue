<template>
  <div class="mine-products-page">
    <div class="header">
      <el-button size="small" @click="$router.push('/mine')">返回</el-button>
      <h3>我的商品</h3>
      <el-button size="small" type="warning" @click="$router.push('/mine/products/trash')">回收站</el-button>
      <el-button size="small" type="primary" @click="$router.push('/trade/create')">发布商品</el-button>
    </div>
    <div class="goods-grid">
      <el-card v-for="g in myGoods" :key="g.product_id" class="goods-card">
        <img v-if="g.image_urls?.[0]" :src="g.image_urls[0]" class="goods-img" @click="$router.push(`/goods/${g.product_id}`)" />
        <div class="goods-info">
          <p class="goods-title" @click="$router.push(`/goods/${g.product_id}`)">{{ g.title }}</p>
          <div class="goods-bottom">
            <span class="goods-price">¥{{ g.price.toFixed(2) }}</span>
            <el-tag size="small" :type="statusTagType(g.status)">{{ g.status_label }}</el-tag>
          </div>
          <p class="goods-stock">库存：{{ g.locked_count > 0 ? `${g.stock}（锁定：${g.locked_count}）` : `${g.stock} 件` }}<span v-if="g.stock === 0 && g.locked_count === 0" class="sold-out-tag"> 已售罄</span></p>
          <div class="takedown-reason" v-if="g.status === 'violated' && g.takedown_reason">
            <span class="takedown-label">下架原因：</span>
            <span class="takedown-text">{{ g.takedown_reason }}</span>
          </div>
          <div class="goods-actions">
            <el-button size="small" @click="$router.push(`/trade/republish/${g.product_id}`)" :disabled="g.status === 'locked' || g.status === 'pending' || (g.locked_count || 0) > 0">编辑重发</el-button>
            <el-button v-if="g.status === 'on_sale'" size="small" type="warning" @click="handleOffShelf(g.product_id)">下架</el-button>
            <el-button v-if="g.status === 'off_shelf'" size="small" type="success" @click="handleOnShelf(g.product_id)" :disabled="g.stock <= 0">上架</el-button>
            <el-button size="small" type="danger" @click="handleDelete(g.product_id)">废弃</el-button>
          </div>
        </div>
      </el-card>
    </div>
    <el-empty v-if="!myGoods.length" description="您还没有发布过商品">
      <el-button type="primary" @click="$router.push('/trade/create')">去发布商品</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tradeApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/request'

const myGoods = ref<any[]>([])

async function loadMyProducts() {
  try {
    const data = await tradeApi.mine({ page: 1, page_size: 50 })
    myGoods.value = data.items || []
  } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
}

async function handleDelete(productId: string) {
  try {
    await ElMessageBox.confirm('确定废弃该商品？废弃后可在回收站恢复或彻底删除。', '提示', { type: 'warning' })
    await tradeApi.deleteProduct(productId)
    ElMessage.success('已废弃')
    loadMyProducts()
  } catch (e: any) { if (e !== 'cancel' && e?.message) ElMessage.error(e.message) }
}

async function handleOffShelf(productId: string) {
  try {
    await ElMessageBox.confirm('确定下架该商品？', '提示', { type: 'warning' })
    await request({ url: `/products/${productId}/off-shelf`, method: 'post' })
    ElMessage.success('已下架')
    loadMyProducts()
  } catch (e: any) { if (e !== 'cancel' && e?.message) ElMessage.error(e.message) }
}

async function handleOnShelf(productId: string) {
  try {
    await request({ url: `/products/${productId}/on-shelf`, method: 'post' })
    ElMessage.success('已上架')
    loadMyProducts()
  } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
}

function statusTagType(s: string) {
  return { pending: 'warning', on_sale: 'success', locked: 'warning', sold: 'info', off_shelf: 'danger', rejected: 'danger', violated: 'danger' }[s] || 'info'
}

onMounted(loadMyProducts)
</script>

<style scoped lang="scss">
.mine-products-page { padding: 12px; .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; h3 { margin: 0; } } }
.goods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.goods-card { .goods-img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; cursor: pointer; } }
.goods-info { margin-top: 8px; .goods-title { font-size: 14px; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; } .goods-price { color: #f56c6c; font-weight: 600; } .goods-stock { font-size: 12px; color: #999; margin: 4px 0; } .goods-bottom { display: flex; justify-content: space-between; align-items: center; } .goods-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; } }
.takedown-reason { background: #fff1f0; border: 1px solid #ffa39e; border-radius: 4px; padding: 6px 8px; margin: 6px 0; font-size: 12px; .takedown-label { color: #f56c6c; font-weight: 600; } .takedown-text { color: #5c0011; } }
</style>
