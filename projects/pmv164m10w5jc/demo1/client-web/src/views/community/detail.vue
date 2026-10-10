<template>
  <div class="detail-page" v-if="post">
    <div class="post-card">
      <div class="post-header">
        <span class="author">{{ post.author_name }}</span>
        <span class="time">{{ formatTime(post.created_at) }}</span>
      </div>
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-content">{{ post.content }}</p>
      <div class="post-images" v-if="post.image_urls?.length">
        <img v-for="(url, i) in post.image_urls" :key="i" :src="url" class="post-img" @click="previewImage(url)" />
      </div>
      <div class="post-actions">
        <span @click="handleLike" :class="{ liked: post.liked }">{{ post.liked ? '❤️' : '🤍' }} {{ post.like_count }}</span>
        <span>💬 {{ post.comment_count }}</span>
      </div>
    </div>

    <div class="comments-section">
      <h4>评论 ({{ comments.length }})</h4>
      <div class="comment-item" v-for="c in comments" :key="c.comment_id">
        <div class="comment-header">
          <span class="comment-author">{{ c.author_name }}</span>
          <span class="comment-time">{{ formatTime(c.created_at) }}</span>
        </div>
        <p class="comment-content">{{ c.content }}</p>
        <div class="comment-actions">
          <el-button v-if="c.author_id === currentUserId" size="small" text type="danger" @click="handleDeleteComment(c.comment_id)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!comments.length" description="暂无评论" :image-size="60" />
    </div>

    <div class="comment-input-bar">
      <el-input v-model="commentText" placeholder="写评论..." @keyup.enter="submitComment" />
      <el-button type="primary" @click="submitComment" :loading="submitting">发送</el-button>
    </div>
  </div>
  <el-empty v-else description="加载中..." />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { communityApi } from '@/api'
import { useUserStore } from '@/store/user'
import { formatDateTime } from '@/utils/time'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const post = ref<any>(null)
const comments = ref<any[]>([])
const commentText = ref('')
const submitting = ref(false)

const currentUserId = computed(() => userStore.userInfo?.user_id || '')

onMounted(async () => {
  const postId = route.params.id as string
  try {
    post.value = await communityApi.getPost(postId)
  } catch (e) {
    ElMessage.error('帖子加载失败')
    router.back()
  }
  await loadComments(postId)
})

async function loadComments(postId: string) {
  try {
    const data = await communityApi.getComments(postId)
    comments.value = data?.items || []
  } catch (e) { /* 暂无评论 */ }
}

function formatTime(t: string) {
  const formatted = formatDateTime(t)
  if (formatted.length > 10) return formatted.slice(5, 16)
  return formatted
}

async function handleLike() {
  if (!post.value) return
  try {
    if (post.value.liked) {
      await communityApi.unlike(post.value.post_id)
      post.value.liked = false
      post.value.like_count--
    } else {
      await communityApi.toggleLike(post.value.post_id)
      post.value.liked = true
      post.value.like_count++
    }
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}

async function submitComment() {
  if (!commentText.value.trim()) return
  submitting.value = true
  try {
    await communityApi.createComment(post.value.post_id, commentText.value.trim())
    commentText.value = ''
    if (post.value) post.value.comment_count++
    await loadComments(post.value.post_id)
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

async function handleDeleteComment(commentId: string) {
  try {
    await ElMessageBox.confirm('确定删除该评论？', '提示', { type: 'warning' })
    await communityApi.deleteComment(post.value.post_id, commentId)
    if (post.value) post.value.comment_count--
    await loadComments(post.value.post_id)
    ElMessage.success('已删除')
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

function previewImage(url: string) { window.open(url, '_blank') }
</script>

<style scoped lang="scss">
.detail-page { padding: 12px; padding-bottom: 120px; }
.post-card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.post-header { display: flex; gap: 8px; color: #999; font-size: 12px; margin-bottom: 8px; }
.post-title { margin: 0 0 8px; }
.post-content { color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 12px; white-space: pre-wrap; }
.post-images { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; .post-img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; cursor: pointer; } }
.post-actions { display: flex; gap: 20px; color: #666; font-size: 14px; span { cursor: pointer; } .liked { color: #f56c6c; } }
.comments-section { background: #fff; border-radius: 8px; padding: 16px; h4 { margin: 0 0 12px; } }
.comment-item { padding: 10px 0; border-bottom: 1px solid #f5f5f5; &:last-child { border-bottom: none; } }
.comment-header { display: flex; gap: 8px; font-size: 12px; color: #999; margin-bottom: 4px; }
.comment-content { font-size: 14px; color: #333; margin: 0; }
.comment-actions { display: flex; gap: 4px; margin-top: 4px; }
.comment-input-bar { position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; display: flex; gap: 8px; padding: 8px 12px; background: #fff; border-top: 1px solid #eee; z-index: 99; }
</style>
