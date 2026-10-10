<template>
  <div class="republish-page">
    <h3>编辑重发商品</h3>
    <el-alert
      v-if="isViolated"
      type="warning"
      :closable="false"
      show-icon
      title="该商品因违规被下架，请修改商品内容后重新发布"
      style="margin-bottom: 12px"
    />
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
      <el-button type="primary" @click="submit" :loading="loading" style="width:100%">重新发布</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tradeApi, fileApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const imageUrls = ref<string[]>([])
const isViolated = ref(false)
const original = ref<any>(null)
const form = reactive({ title: '', description: '', price: 0.01, stock: 1, image_urls: [] as string[], contact: '' })

onMounted(async () => {
  try {
    const data = await tradeApi.getDetail(route.params.id as string)
    form.title = data.title
    form.description = data.description || ''
    form.price = data.price
    form.stock = data.stock || 1
    form.contact = data.contact || ''
    imageUrls.value = data.image_urls || []
    isViolated.value = data.status === 'violated'
    original.value = {
      title: data.title,
      description: data.description || '',
      price: data.price,
      stock: data.stock || 1,
      contact: data.contact || '',
      image_urls: [...(data.image_urls || [])],
    }
  } catch (e: any) { ElMessage.error('加载失败'); router.replace('/trade') }
})

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

function checkContentModified(): boolean {
  if (!original.value) return true
  const o = original.value
  if (form.title !== o.title) return true
  if (form.description !== o.description) return true
  if (form.price !== o.price) return true
  if (form.stock !== o.stock) return true
  if (form.contact !== o.contact) return true
  const curr = [...imageUrls.value].sort()
  const orig = [...o.image_urls].sort()
  if (curr.length !== orig.length) return true
  if (curr.some((v, i) => v !== orig[i])) return true
  return false
}

async function submit() {
  if (!form.title) { ElMessage.warning('请填写商品名称'); return }
  if (!imageUrls.value.length) { ElMessage.warning('请至少上传一张图片'); return }
  if (!form.contact) { ElMessage.warning('请填写联系方式'); return }
  if (isViolated.value && !checkContentModified()) {
    ElMessage.warning('违规商品需修改内容后才能重新发布')
    return
  }
  loading.value = true
  try {
    form.image_urls = imageUrls.value
    const res = await tradeApi.republishProduct(route.params.id as string, form)
    ElMessage.success(res?.status === 'pending' ? '已提交，待审核' : '已上架')
    router.replace('/trade')
  } catch (e: any) { ElMessage.error(e?.message || '发布失败') } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.republish-page { padding: 12px; h3 { margin-bottom: 12px; } }
</style>
