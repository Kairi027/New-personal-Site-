<template>
  <div class="travel-page">
    <h3>本地出行</h3>
    <el-card class="form-card">
      <el-form label-width="60px">
        <el-form-item label="起点">
          <el-input v-model="origin" placeholder="经度,纬度" />
        </el-form-item>
        <el-form-item label="终点">
          <el-input v-model="destination" placeholder="经度,纬度" />
        </el-form-item>
        <el-form-item label="方式">
          <el-select v-model="mode" style="width:100%">
            <el-option label="驾车" value="driving" />
            <el-option label="步行" value="walking" />
            <el-option label="骑行" value="riding" />
            <el-option label="公交" value="transit" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="planRoute" :loading="loading" style="width:100%">规划路线</el-button>
      </el-form>
    </el-card>
    <el-card v-if="routeError" class="error-card">
      <el-result icon="warning" title="地图服务不可用" sub-title="请稍后重试或联系管理员配置地图服务" />
    </el-card>
    <el-card v-if="route" class="result-card">
      <p>距离：{{ (route.distance / 1000).toFixed(2) }} 公里</p>
      <p>预计用时：{{ Math.ceil(route.duration / 60) }} 分钟</p>
      <el-button type="success" @click="startNavi" style="width:100%;margin-top:8px">开始导航</el-button>
    </el-card>
    <el-card v-if="naviStatus" class="navi-card">
      <p>导航中... {{ naviStatus }}</p>
      <el-button type="danger" @click="stopNavi">结束导航</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { travelApi } from '@/api'
import { ElMessage } from 'element-plus'

const origin = ref('116.397428,39.90923')
const destination = ref('116.407526,39.904030')
const mode = ref('driving')
const loading = ref(false)
const route = ref<any>(null)
const routeError = ref(false)
const naviStatus = ref('')
const sessionId = ref('')

async function planRoute() {
  loading.value = true
  routeError.value = false
  try {
    const [oLng, oLat] = origin.value.split(',').map(Number)
    const [dLng, dLat] = destination.value.split(',').map(Number)
    route.value = await travelApi.planRoute({
      origin: { lng: oLng, lat: oLat },
      destination: { lng: dLng, lat: dLat },
      mode: mode.value,
    })
  } catch (e: any) {
    routeError.value = true
    ElMessage.error(e?.message || '地图服务不可用，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function startNavi() {
  try {
    const data = await travelApi.startNavi(route.value.route_id)
    sessionId.value = data.session_id
    naviStatus.value = '导航已开始'
  } catch (e: any) { ElMessage.error(e?.message || '启动导航失败') }
}

async function stopNavi() {
  try {
    await travelApi.stopNavi(sessionId.value)
    naviStatus.value = ''
    sessionId.value = ''
  } catch (e: any) { ElMessage.error(e?.message || '结束导航失败') }
}
</script>

<style scoped lang="scss">
.travel-page { padding: 12px; h3 { margin-bottom: 12px; } }
.form-card { margin-bottom: 12px; }
.result-card { margin-bottom: 12px; p { margin: 4px 0; } }
.navi-card { p { margin-bottom: 8px; } }
</style>
