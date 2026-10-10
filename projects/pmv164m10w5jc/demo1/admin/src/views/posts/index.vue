<template>
  <div>
    <div style="margin-bottom:12px">
      <el-radio-group v-model="filterStatus" @change="load">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="published">已发布</el-radio-button>
        <el-radio-button label="rejected">已拒绝</el-radio-button>
        <el-radio-button label="violated">已下架</el-radio-button>
      </el-radio-group>
    </div>
    <el-table :data="posts" border>
      <el-table-column prop="title" label="标题" width="200" />
      <el-table-column prop="author_name" label="作者" width="100" />
      <el-table-column prop="section_id" label="板块" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="created_at" label="发布时间" width="180" :formatter="timeFormatter" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" type="success" :disabled="!canApprove(row.status)" @click="audit(row, 'approve')">通过</el-button>
          <el-button size="small" type="warning" :disabled="!canReject(row.status)" @click="audit(row, 'reject')">拒绝</el-button>
          <el-button size="small" type="danger" :disabled="!canTakedown(row.status)" @click="audit(row, 'takedown')">下架</el-button>
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

const posts = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const filterStatus = ref('')

async function load() {
  try {
    const data = await request<any>({ url: '/posts', method: 'get', params: { page: page.value, page_size: 20, status: filterStatus.value } })
    posts.value = data.items || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
}
onMounted(load)

async function audit(row: any, action: string) {
  try {
    await request({ url: `/posts/${row.post_id}/audit`, method: 'post', data: { action } })
    ElMessage.success('操作成功')
    load()
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}

function canApprove(s: string) { return s === 'pending' }
function canReject(s: string) { return s === 'pending' }
function canTakedown(s: string) { return s === 'published' }
function statusType(s: string) { return { published: 'success', pending: 'warning', rejected: 'danger', violated: 'danger', draft: 'info' }[s] || 'info' }
function statusText(s: string) { return { published: '已发布', pending: '待审核', rejected: '已拒绝', violated: '已下架', draft: '草稿' }[s] || s }
</script>
