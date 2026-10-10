<template>
  <div class="create-post-page">
    <h3>发表帖子</h3>
    <el-form label-width="60px">
      <el-form-item label="板块">
        <el-select v-model="form.section_id" placeholder="选择板块" style="width:100%">
          <el-option v-for="s in sections" :key="s.section_id" :label="s.name" :value="s.section_id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="form.title" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.content" type="textarea" :rows="6" maxlength="2000" show-word-limit />
      </el-form-item>
      <el-form-item label="图片">
        <el-upload :before-upload="handleUpload" list-type="picture-card" :file-list="fileList" :on-remove="handleRemove" action="#" :auto-upload="false">
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-button type="primary" @click="submit" :loading="loading" style="width:100%">发布</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { communityApi, fileApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const fileList = ref<any[]>([])
const imageUrls = ref<string[]>([])
const sections = ref<any[]>([])
const form = reactive({ section_id: 'default', title: '', content: '', image_urls: [] as string[] })

onMounted(async () => {
  try {
    sections.value = await communityApi.listSections() || []
  } catch (e) { /* ignore */ }
})

async function handleUpload(file: File) {
  try {
    const data = await fileApi.upload(file)
    imageUrls.value.push(data.url)
    fileList.value.push({ name: file.name, url: data.url })
  } catch (e: any) { ElMessage.error('图片上传失败') }
  return false
}

function handleRemove(file: any) {
  const idx = imageUrls.value.indexOf(file.url)
  if (idx > -1) imageUrls.value.splice(idx, 1)
}

async function submit() {
  if (!form.title || !form.content) { ElMessage.warning('请填写标题和正文'); return }
  loading.value = true
  try {
    form.image_urls = imageUrls.value
    await communityApi.createPost(form)
    ElMessage.success('已发布，待审核')
    router.push('/community')
  } catch (e: any) { ElMessage.error(e?.message || '发布失败') } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.create-post-page { padding: 12px; h3 { margin-bottom: 12px; } }
</style>
