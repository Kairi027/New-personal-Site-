<template>
  <div>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <el-input v-model="operatorId" placeholder="操作人ID" style="width:180px" @keyup.enter="load" />
      <el-input v-model="actionFilter" placeholder="操作类型" style="width:180px" @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>
    <el-table :data="logs" border>
      <el-table-column prop="operator_id" label="操作人" width="120" show-overflow-tooltip />
      <el-table-column prop="operator_type" label="类型" width="80" />
      <el-table-column prop="action" label="操作" width="150" />
      <el-table-column prop="target_type" label="对象类型" width="100" />
      <el-table-column prop="target_id" label="对象ID" width="120" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" width="180" :formatter="timeFormatter" />
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="load" style="margin-top:16px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/api/request'
import { formatDateTime } from '@/utils/time'

const timeFormatter = (_r: any, _c: any, val: string) => formatDateTime(val)

const operatorId = ref('')
const actionFilter = ref('')
const logs = ref<any[]>([])
const page = ref(1)
const total = ref(0)

async function load() {
  try {
    const data = await request<any>({ url: '/audit-logs', method: 'get', params: { page: page.value, page_size: 20, operator_id: operatorId.value, action: actionFilter.value } })
    logs.value = data.items || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
}
onMounted(load)
</script>
