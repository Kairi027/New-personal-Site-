<template>
  <div class="community-page">
    <div class="header">
      <h3>社区广场</h3>
      <div>

        <el-button type="primary" size="small" @click="$router.push('/post/create')">发帖</el-button>
      </div>
    </div>
    <div class="section-tabs">
      <span :class="['tab', { active: currentSection === '' }]" @click="switchSection('')">全部</span>
      <span v-for="s in sections" :key="s.section_id" :class="['tab', { active: currentSection === s.section_id }]" @click="switchSection(s.section_id)">{{ s.name }}</span>
    </div>
    <el-card v-for="post in posts" :key="post.post_id" class="post-card" shadow="hover" @click="$router.push(`/post/${post.post_id}`)">
      <div class="post-header">
        <span class="author">{{ post.author_name }}</span>
        <span class="section-tag" v-if="sectionName(post.section_id)">{{ sectionName(post.section_id) }}</span>
        <span class="time">{{ formatTime(post.created_at) }}</span>
      </div>
      <h4 class="post-title">{{ post.title }}</h4>
      <p class="post-content">{{ post.content }}</p>
      <div class="post-images" v-if="post.image_urls?.length">
        <img v-for="(url, i) in post.image_urls.slice(0,3)" :key="i" :src="url" class="post-img" />
      </div>
      <div class="post-actions">
        <span @click.stop="handleLike(post)">👍 {{ post.like_count }}</span>
        <span>💬 {{ post.comment_count }}</span>
      </div>
    </el-card>
    <el-empty v-if="!posts.length" description="暂无帖子" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { communityApi } from '@/api'
import dayjs from 'dayjs'

const posts = ref<any[]>([])
const sections = ref<any[]>([])
const currentSection = ref('')

onMounted(async () => {
  try {
    sections.value = await communityApi.listSections() || []
  } catch (e) { /* ignore */ }
  await loadPosts()
})

async function loadPosts() {
  try {
    const data = await communityApi.listPosts(currentSection.value, 1, 50)
    posts.value = data.items || []
  } catch (e) { /* 未登录或无数据 */ }
}

function switchSection(sid: string) {
  currentSection.value = sid
  loadPosts()
}

function sectionName(sid: string) {
  const s = sections.value.find(x => x.section_id === sid)
  return s ? s.name : ''
}

function formatTime(t: string) { return dayjs(t).format('MM-DD HH:mm') }

async function handleLike(post: any) {
  if (post.liked) {
    await communityApi.unlike(post.post_id)
    post.liked = false
    post.like_count--
  } else {
    await communityApi.toggleLike(post.post_id)
    post.liked = true
    post.like_count++
  }
}
</script>

<style scoped lang="scss">
.community-page { padding: 12px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { margin: 0; } }
.section-tabs { display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; .tab { padding: 4px 12px; border-radius: 16px; background: #f0f0f0; font-size: 13px; cursor: pointer; white-space: nowrap; &.active { background: #409eff; color: #fff; } } }
.post-card { margin-bottom: 12px; cursor: pointer; }
.post-header { display: flex; gap: 8px; color: #999; font-size: 12px; margin-bottom: 4px; .section-tag { background: #e8f4ff; color: #409eff; padding: 0 6px; border-radius: 4px; } }
.post-title { margin: 0 0 4px; }
.post-content { color: #666; font-size: 14px; margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-images { display: flex; gap: 4px; margin-bottom: 8px; .post-img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; } }
.post-actions { display: flex; gap: 16px; color: #666; font-size: 14px; span { cursor: pointer; } }
</style>
