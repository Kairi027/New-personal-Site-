<template>
  <div>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <el-input v-model="keyword" placeholder="搜索账号/昵称" style="width:200px" @keyup.enter="loadUsers" />
      <el-select v-model="statusFilter" placeholder="状态" style="width:120px" @change="loadUsers">
        <el-option label="全部" value="" /><el-option label="正常" value="active" /><el-option label="冻结" value="frozen" />
      </el-select>
      <el-button type="primary" @click="loadUsers">查询</el-button>
    </div>
    <el-table :data="users" border>
      <el-table-column prop="account" label="账号" width="180" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'danger'">{{ row.status === 'active' ? '正常' : '冻结' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="register_time" label="注册时间" width="180" :formatter="timeFormatter" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" :type="row.status === 'active' ? 'danger' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 'active' ? '冻结' : '解冻' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="loadUsers" style="margin-top:16px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/api/request'
import { formatDateTime } from '@/utils/time'

const timeFormatter = (_r: any, _c: any, val: string) => formatDateTime(val)

const keyword = ref('')
const statusFilter = ref('')
const users = ref<any[]>([])
const page = ref(1)
const total = ref(0)

async function loadUsers() {
  try {
    const data = await request<any>({ url: '/users', method: 'get', params: { page: page.value, page_size: 20, keyword: keyword.value, status: statusFilter.value } })
    users.value = data.items || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
}
onMounted(loadUsers)

async function toggleStatus(row: any) {
  const newStatus = row.status === 'active' ? 'frozen' : 'active'
  try {
    await request({ url: `/users/${row.user_id}/status`, method: 'put', data: { status: newStatus } })
    row.status = newStatus
    ElMessage.success(newStatus === 'active' ? '已解冻' : '已冻结')
  } catch (e) { /* ignore */ }
}
</script>
