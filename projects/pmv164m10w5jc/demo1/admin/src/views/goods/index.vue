<template>
  <div>
    <div style="margin-bottom:16px">
      <el-radio-group v-model="statusFilter" @change="load">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="on_sale">在售（未售罃）</el-radio-button>
        <el-radio-button label="sold">已售罃</el-radio-button>
        <el-radio-button label="off_shelf">商户下架</el-radio-button>
        <el-radio-button label="rejected">审核拒绝</el-radio-button>
        <el-radio-button label="violated">平台下架</el-radio-button>
      </el-radio-group>
    </div>
    <el-table :data="products" border>
      <el-table-column prop="title" label="商品名称" width="200" />
      <el-table-column prop="seller_name" label="卖家" width="120" />
      <el-table-column prop="price" label="价格" width="100" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column prop="created_at" label="发布时间" width="180" :formatter="timeFormatter" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" type="success" :disabled="row.status !== 'pending'" @click="audit(row, 'approve')">通过</el-button>
          <el-button size="small" type="warning" :disabled="row.status !== 'pending'" @click="audit(row, 'reject')">拒绝</el-button>
          <el-button size="small" type="danger" :disabled="row.status !== 'on_sale' && row.status !== 'locked'" @click="audit(row, 'takedown')">下架</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="load" style="margin-top:16px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/api/request'
import { formatDateTime } from '@/utils/time'

const timeFormatter = (_r: any, _c: any, val: string) => formatDateTime(val)

const products = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const statusFilter = ref('')

async function load() {
  try {
    const data = await request<any>({ url: '/products', method: 'get', params: { page: page.value, page_size: 20, status: statusFilter.value } })
    products.value = data.items || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
}
onMounted(load)

async function audit(row: any, action: string) {
  try {
    await request({ url: `/products/${row.product_id}/audit`, method: 'post', data: { action } })
    ElMessage.success('操作成功')
    load()
  } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
}

function statusTagType(s: string) {
  return { pending: 'warning', on_sale: 'success', off_shelf: 'danger', locked: 'success', sold: 'info', rejected: 'danger', violated: 'danger' }[s] || 'info'
}
function statusLabel(s: string) {
  return { pending: '待审核', on_sale: '在售（未售罃）', off_shelf: '商户下架', locked: '在售（未售罃）', sold: '已售罃', rejected: '审核拒绝', violated: '平台下架' }[s] || s
}
</script>
