<template>
  <div class="republish-page">
    <h3>编辑重发帖子</h3>
    <el-form label-width="80px">
      <el-form-item label="板块">
        <el-input :value="form.section_id" disabled />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="form.title" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="内容">
        <el-input v-model="form.content" type="textarea" :rows="6" maxlength="2000" show-word-limit />
      </el-form-item>
      <el-button type="primary" @click="submit" :loading="loading" style="width:100%">提交审核</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { communityApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const form = reactive({ section_id: '', title: '', content: '', image_urls: [] as string[] })

onMounted(async () => {
  try {
    const data = await communityApi.getPost(route.params.id as string)
    form.section_id = data.section_id
    form.title = data.title
    form.content = data.content
    form.image_urls = data.image_urls || []
  } catch (e: any) { ElMessage.error('加载失败'); router.replace('/community/my') }
})

async function submit() {
  if (!form.title || !form.content) { ElMessage.warning('请填写标题和内容'); return }
  loading.value = true
  try {
    await communityApi.republishPost(route.params.id as string, { ...form })
    ElMessage.success('已提交审核')
    router.replace('/community/my')
  } catch (e: any) { ElMessage.error(e?.message || '提交失败') } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.republish-page { padding: 12px; h3 { margin-bottom: 12px; } }
</style>