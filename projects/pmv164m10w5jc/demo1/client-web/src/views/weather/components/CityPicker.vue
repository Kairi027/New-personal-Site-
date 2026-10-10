<template>
  <div class="city-picker">
    <el-input
      v-model="keyword"
      placeholder="搜索城市（支持拼音）"
      clearable
      class="search-input"
    >
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>

    <div v-if="keyword" class="search-result">
      <div
        v-for="c in searchResults"
        :key="c.city_id"
        class="city-item"
        :class="{ active: c.city_name === currentCity }"
        @click="onSelect(c)"
      >
        <span class="name">{{ c.city_name }}</span>
        <span class="province">{{ c.province }}</span>
      </div>
      <el-empty v-if="!searchResults.length" description="无匹配城市" :image-size="50" />
    </div>

    <template v-else>
      <div class="hot-section">
        <p class="section-title">热门城市</p>
        <div class="hot-list">
          <span
            v-for="h in hotCities"
            :key="h"
            class="hot-item"
            :class="{ active: h === currentCity }"
            @click="onSelectByName(h)"
          >{{ h }}</span>
        </div>
      </div>

      <div class="province-section">
        <div class="province-tabs">
          <span
            v-for="p in provinceList"
            :key="p"
            class="province-tab"
            :class="{ active: p === activeProvince }"
            @click="activeProvince = p"
          >{{ p }}</span>
        </div>

        <div class="city-grid">
          <span
            v-for="c in currentProvinceCities"
            :key="c.city_id"
            class="grid-item"
            :class="{ active: c.city_name === currentCity }"
            @click="onSelect(c)"
          >{{ c.city_name }}</span>
          <el-empty v-if="!currentProvinceCities.length" description="无城市" :image-size="40" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { weatherApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { HOT_CITIES, filterCities, getProvinceList, type CityItem } from '@/utils/cities'

const props = defineProps<{
  currentCity: string
}>()

const emit = defineEmits<{
  select: [city: string]
}>()

const keyword = ref('')
const allCities = ref<CityItem[]>([])
const grouped = ref<Record<string, CityItem[]>>({})
const activeProvince = ref('北京')
const loaded = ref(false)

const hotCities = HOT_CITIES

const searchResults = computed(() => filterCities(allCities.value, keyword.value))

const provinceList = computed(() => getProvinceList(grouped.value))

const currentProvinceCities = computed(() => grouped.value[activeProvince.value] || [])

async function loadCities() {
  if (loaded.value) return
  try {
    const data = await weatherApi.allCities()
    allCities.value = data.cities || []
    grouped.value = data.grouped || {}
    loaded.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '城市数据加载失败')
  }
}

function onSelect(city: CityItem) {
  emit('select', city.city_name)
}

function onSelectByName(name: string) {
  emit('select', name)
}

watch(keyword, (val) => {
  if (val && !loaded.value) loadCities()
})

onMounted(() => loadCities())
</script>

<style scoped lang="scss">
.city-picker {
  .search-input { margin-bottom: 12px; }
}

.search-result {
  max-height: 300px;
  overflow-y: auto;
  .city-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #f5f7fa; }
    &.active { background: #ecf5ff; }
    .name { font-size: 14px; color: #303133; }
    .province { font-size: 12px; color: #c0c4cc; }
  }
}

.section-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.hot-section { margin-bottom: 16px; }
.hot-list { display: flex; flex-wrap: wrap; gap: 8px; }
.hot-item {
  padding: 4px 12px;
  background: #f4f4f5;
  border-radius: 14px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #ecf5ff; color: #409eff; }
  &.active { background: #409eff; color: #fff; }
}

.province-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
  max-height: 80px;
  overflow-y: auto;
}
.province-tab {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  &:hover { color: #409eff; }
  &.active { background: #409eff; color: #fff; }
}

.city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.grid-item {
  padding: 4px 12px;
  background: #f4f4f5;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #ecf5ff; color: #409eff; }
  &.active { background: #409eff; color: #fff; }
}
</style>