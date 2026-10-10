<template>
  <div class="weather-page">
    <div class="city-selector" @click="togglePanel">
      <span class="city-name">{{ currentCity }}</span>
      <el-icon class="arrow" :class="{ open: panelVisible }"><ArrowDown /></el-icon>
    </div>

    <div v-if="panelVisible" class="city-panel">
      <CityPicker :current-city="currentCity" @select="selectCity" />
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-card shadow="hover"><el-skeleton :rows="4" animated /></el-card>
    </div>

    <div v-else-if="weather" class="weather-card">
      <p class="city">{{ currentCity }}</p>
      <p class="temp">{{ weather.now?.temp ?? '--' }}°C</p>
      <p class="desc">{{ weather.now?.text || '未知' }}</p>
      <div class="details">
        <span>湿度：{{ weather.now?.humidity ?? '--' }}%</span>
        <span>风力：{{ weather.now?.windDir || '--' }} {{ weather.now?.windScale ?? '--' }}级</span>
        <span>体感：{{ weather.now?.feelsLike ?? '--' }}°C</span>
      </div>
    </div>

    <el-card v-if="forecast" class="forecast-card" shadow="hover">
      <p class="card-title">未来预报</p>
      <div v-for="d in forecast.daily" :key="d.fxDate" class="forecast-item">
        <span class="date">{{ d.fxDate }}</span>
        <span class="temp-range">{{ d.tempMax }}°/{{ d.tempMin }}°</span>
        <span class="text">{{ d.textDay }}</span>
      </div>
    </el-card>

    <el-card v-if="weatherError" class="error-card">
      <el-result icon="warning" title="天气服务不可用" sub-title="请稍后重试或联系管理员配置天气服务" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { weatherApi } from '@/api'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import CityPicker from './components/CityPicker.vue'

const STORAGE_KEY = 'weather_selected_city'
const DEFAULT_CITY = '北京'

const currentCity = ref(DEFAULT_CITY)
const panelVisible = ref(false)
const weather = ref<any>(null)
const forecast = ref<any>(null)
const weatherError = ref(false)
const loading = ref(false)

function togglePanel() {
  panelVisible.value = !panelVisible.value
}

async function selectCity(city: string) {
  currentCity.value = city
  panelVisible.value = false
  localStorage.setItem(STORAGE_KEY, city)
  await loadWeather()
}

async function loadWeather() {
  loading.value = true
  weatherError.value = false
  try {
    weather.value = await weatherApi.now(currentCity.value)
    forecast.value = await weatherApi.forecast(currentCity.value, 7)
  } catch (e: any) {
    weatherError.value = true
    ElMessage.error(e?.message || '天气服务不可用')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) currentCity.value = saved
  await loadWeather()
})
</script>

<style scoped lang="scss">
.weather-page {
  padding: 16px;
  max-width: 720px;
  margin: 0 auto;
  position: relative;
}

.city-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
  user-select: none;
  .city-name { letter-spacing: 1px; }
  .arrow { transition: transform 0.2s; &.open { transform: rotate(180deg); } }
}

.city-panel {
  margin-top: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.loading-wrap { margin-top: 16px; }

.weather-card {
  margin-top: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  .city { margin: 0 0 8px; font-size: 18px; opacity: 0.9; }
  .temp { margin: 0 0 4px; font-size: 48px; font-weight: 700; line-height: 1.1; }
  .desc { margin: 0 0 16px; font-size: 16px; opacity: 0.85; }
  .details {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 13px;
    opacity: 0.9;
    span {
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
    }
  }
}

.forecast-card {
  margin-top: 16px;
  .card-title { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #303133; }
  .forecast-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
    &:last-child { border-bottom: none; }
    .date { color: #606266; font-size: 13px; }
    .temp-range { color: #303133; font-weight: 600; }
    .text { color: #409eff; font-size: 13px; }
  }
}

.error-card { margin-top: 16px; }
</style>
