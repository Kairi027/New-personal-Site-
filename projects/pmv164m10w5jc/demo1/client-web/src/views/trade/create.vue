<template>
  <div class="create-product-page">
    <h3>发布商品</h3>
    <el-form label-width="80px">
      <el-form-item label="商品名称">
        <el-input v-model="form.title" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="商品图片">
        <el-upload :on-change="handleFileChange" list-type="picture-card" :on-remove="handleRemove" action="#" :auto-upload="false" :limit="6">
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="商品简介">
        <el-input v-model="form.description" type="textarea" :rows="4" maxlength="1000" show-word-limit />
      </el-form-item>
      <el-form-item label="价格(元)">
        <el-input-number v-model="form.price" :min="0.01" :max="999999.99" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="库存数量">
        <el-input-number v-model="form.stock" :min="1" :max="999999" :step="1" style="width:100%" />
      </el-form-item>
      <el-form-item label="联系方式">
        <el-input v-model="form.contact" placeholder="手机号/微信/QQ" maxlength="128" />
      </el-form-item>
      <el-button type="primary" @click="submit" :loading="loading" style="width:100%">发布</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { tradeApi, fileApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const imageUrls = ref<string[]>([])
const form = reactive({ title: '', description: '', price: 0.01, stock: 1, image_urls: [] as string[], contact: '' })

async function handleFileChange(file: any) {
  if (file.status !== 'ready') return
  try {
    const data = await fileApi.upload(file.raw)
    imageUrls.value.push(data.url)
  } catch (e: any) { ElMessage.error('图片上传失败') }
}

function handleRemove(file: any) {
  const idx = imageUrls.value.indexOf(file.url)
  if (idx > -1) imageUrls.value.splice(idx, 1)
}

async function submit() {
  if (!form.title) { ElMessage.warning('请填写商品名称'); return }
  if (!imageUrls.value.length) { ElMessage.warning('请至少上传一张图片'); return }
  if (!form.description) { ElMessage.warning('请填写商品简介'); return }
  if (!form.price || form.price <= 0) { ElMessage.warning('请设置商品价格'); return }
  if (!form.contact) { ElMessage.warning('请填写联系方式'); return }
  loading.value = true
  try {
    form.image_urls = imageUrls.value
    await tradeApi.createProduct(form)
    ElMessage.success('已发布，待审核')
    router.push('/trade')
  } catch (e: any) { ElMessage.error(e?.message || '发布失败') } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.create-product-page { padding: 12px; h3 { margin-bottom: 12px; } }
</style>