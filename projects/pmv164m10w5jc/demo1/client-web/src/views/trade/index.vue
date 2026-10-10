<template>
  <div class="trade-page">
    <div class="header">
      <h3>跳蚤市场</h3>
      <div class="header-btns">
        <el-button type="primary" size="small" @click="$router.push('/trade/create')">发布商品</el-button>
      </div>
    </div>

    <el-input v-model="keyword" placeholder="搜索商品" prefix-icon="Search" @keyup.enter="loadProducts" style="margin-bottom:12px" />
    <div class="goods-grid">
      <el-card v-for="g in goods" :key="g.product_id" class="goods-card" @click="$router.push(`/goods/${g.product_id}`)">
        <img v-if="g.image_urls?.[0]" :src="g.image_urls[0]" class="goods-img" />
        <div class="goods-info">
          <p class="goods-title">{{ g.title }}</p>
          <span class="goods-price">¥{{ g.price.toFixed(2) }}</span>
        </div>
      </el-card>
    </div>
    <el-empty v-if="!goods.length" description="暂无商品" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tradeApi } from '@/api'

const keyword = ref('')
const goods = ref<any[]>([])

async function loadProducts() {
  try {
    const data = await tradeApi.search({ keyword: keyword.value, page: 1, page_size: 20 })
    goods.value = data.items || []
  } catch (e) { /* ignore */ }
}

onMounted(loadProducts)
</script>

<style scoped lang="scss">
.trade-page { padding: 12px; .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { margin: 0; } .header-btns { display: flex; gap: 8px; } } }
.goods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.goods-card { cursor: pointer; .goods-img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; } }
.goods-info { margin-top: 8px; .goods-title { font-size: 14px; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; } .goods-price { color: #f56c6c; font-weight: 600; } }
</style>
