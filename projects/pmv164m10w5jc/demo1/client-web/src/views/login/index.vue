<template>
  <div class="login-page">
    <div class="login-box">
      <h2>本地生活</h2>
      <p>{{ isRegister ? '注册账号' : '登录后体验完整功能' }}</p>

      <el-form :model="form" label-width="0" @submit.prevent="handleSubmit">
        <el-form-item>
          <el-input v-model="form.account" placeholder="手机号或邮箱" size="large" />
        </el-form-item>

        <el-form-item v-if="isRegister">
          <el-input v-model="form.nickname" placeholder="昵称（2-32字）" size="large" />
        </el-form-item>

        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>

        <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="handleSubmit">
          {{ isRegister ? '注册' : '登录' }}
        </el-button>
      </el-form>

      <div class="toggle-mode">
        <span @click="isRegister = !isRegister">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </span>
      </div>

      <el-divider>或</el-divider>
      <el-button type="success" plain style="width:100%" @click="$router.push('/community')">游客进入</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const isRegister = ref(false)
const loading = ref(false)

const form = reactive({
  account: '',
  password: '',
  nickname: '',
})

async function handleSubmit() {
  if (!form.account || !form.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }
  loading.value = true
  try {
    if (isRegister.value) {
      if (!form.nickname) {
        ElMessage.warning('请填写昵称')
        loading.value = false
        return
      }
      const data = await authApi.register({
        account: form.account,
        password: form.password,
        nickname: form.nickname,
      })
      handleLoginSuccess(data)
    } else {
      const data = await authApi.login(form.account, form.password)
      handleLoginSuccess(data)
    }
  } catch (e) {
    // 错误已由拦截器提示
  } finally {
    loading.value = false
  }
}

function handleLoginSuccess(data: any) {
  userStore.setToken(data.access_token)
  userStore.setUserInfo(data.user)
  ElMessage.success('登录成功')
  router.push('/community')
}
</script>

<style scoped lang="scss">
.login-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg,#667eea,#764ba2); }
.login-box { background: #fff; padding: 32px; border-radius: 12px; width: 340px; text-align: center; h2 { margin-bottom: 8px; } p { color: #999; margin-bottom: 24px; } }
.toggle-mode { margin-top: 12px; color: #409eff; font-size: 14px; span { cursor: pointer; } &:hover { text-decoration: underline; } }
</style>
