<template>
  <div class="my-posts-page">
    <div class="header">
      <h3>我的帖子</h3>
      <el-button size="small" @click="$router.push('/community')">返回社区</el-button>
      <el-button size="small" type="primary" @click="$router.push('/post/create')">发布帖子</el-button>
    </div>
    <el-card v-for="post in posts" :key="post.post_id" class="post-card" shadow="hover">
      <div class="post-header">
        <h4 class="post-title" @click="$router.push(`/post/${post.post_id}`)">{{ post.title }}</h4>
        <el-tag v-if="post.audit_label" :type="auditTagType(post.status)" size="small">{{ post.audit_label }}</el-tag>
      </div>
      <p class="post-content">{{ post.content }}</p>
      <div class="post-footer">
        <span>👍 {{ post.like_count }}</span>
        <span>💬 {{ post.comment_count }}</span>
        <span class="time">{{ formatTime(post.created_at) }}</span>
      </div>
      <div class="post-actions">
        <el-button size="small" @click="$router.push(`/community/republish/${post.post_id}`)">编辑重发</el-button>
        <el-button size="small" type="danger" @click="handleDelete(post.post_id)">删除</el-button>
      </div>
    </el-card>
    <el-empty v-if="!posts.length" description="暂无帖子" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/api/request'
import { communityApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const posts = ref<any[]>([])

async function loadPosts() {
  try {
    const data = await request<any>({ url: '/posts/my', method: 'get', params: { page: 1, page_size: 50 } })
    posts.value = data.items || []
  } catch (e: any) { /* ignore */ }
}

async function handleDelete(postId: string) {
  try {
    await ElMessageBox.confirm('确定删除该帖子？', '提示', { type: 'warning' })
    await communityApi.deletePost(postId)
    ElMessage.success('已删除')
    loadPosts()
  } catch (e: any) { if (e !== 'cancel' && e?.message) ElMessage.error(e.message) }
}

function formatTime(t: string) { return dayjs(t).format('MM-DD HH:mm') }
function auditTagType(s: string) { return { pending: 'warning', rejected: 'danger', violated: 'danger' }[s] || 'info' }

onMounted(loadPosts)
</script>

<style scoped lang="scss">
.my-posts-page { padding: 12px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { margin: 0; } }
.post-card { margin-bottom: 12px; }
.post-header { display: flex; justify-content: space-between; align-items: center; .post-title { margin: 0; cursor: pointer; } }
.post-content { color: #666; font-size: 14px; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-footer { display: flex; gap: 16px; color: #999; font-size: 12px; .time { margin-left: auto; } }
.post-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>
