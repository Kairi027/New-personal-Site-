<template>
  <div class="mine-trash-page">
    <div class="header">
      <el-button size="small" @click="$router.push('/mine/products')">返回</el-button>
      <h3>回收站</h3>
    </div>
    <div class="goods-grid">
      <el-card v-for="g in trashGoods" :key="g.product_id" class="goods-card">
        <img v-if="g.image_urls?.[0]" :src="g.image_urls[0]" class="goods-img" />
        <div class="goods-info">
          <p class="goods-title">{{ g.title }}</p>
          <div class="goods-bottom">
            <span class="goods-price">¥{{ g.price.toFixed(2) }}</span>
            <el-tag size="small" type="info">已废弃</el-tag>
          </div>
          <p class="goods-stock">库存：{{ g.stock }} 件</p>
          <p class="discard-time" v-if="g.discard_time">废弃时间：{{ g.discard_time }}</p>
          <div class="goods-actions">
            <el-button size="small" type="primary" @click="$router.push(`/trade/republish/${g.product_id}`)">编辑重发</el-button>
            <el-button size="small" type="danger" @click="handlePurge(g.product_id)">彻底删除</el-button>
          </div>
        </div>
      </el-card>
    </div>
    <el-empty v-if="!trashGoods.length" description="回收站为空">
      <el-button type="primary" @click="$router.push('/mine/products')">返回我的商品</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tradeApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const trashGoods = ref<any[]>([])

async function loadTrash() {
  try {
    const data = await tradeApi.listTrash({ page: 1, page_size: 50 })
    trashGoods.value = data.items || []
  } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
}

async function handlePurge(productId: string) {
  try {
    await ElMessageBox.confirm('彻底删除后无法恢复，确定删除该商品？', '警告', { type: 'warning' })
    await tradeApi.purgeProduct(productId)
    ElMessage.success('已彻底删除')
    loadTrash()
  } catch (e: any) { if (e !== 'cancel' && e?.message) ElMessage.error(e.message) }
}

onMounted(loadTrash)
</script>

<style scoped lang="scss">
.mine-trash-page { padding: 12px; .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; h3 { margin: 0; } } }
.goods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.goods-card { .goods-img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; } }
.goods-info { margin-top: 8px; .goods-title { font-size: 14px; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .goods-price { color: #f56c6c; font-weight: 600; } .goods-stock { font-size: 12px; color: #999; margin: 4px 0; } .discard-time { font-size: 12px; color: #bbb; margin: 2px 0; } .goods-bottom { display: flex; justify-content: space-between; align-items: center; } .goods-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; } }
</style>