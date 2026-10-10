<template>
  <div class="layout">
    <main class="content"><router-view /></main>
    <nav class="tabbar">
      <router-link v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab-item" active-class="active">
        <span class="icon">{{ tab.icon }}</span><span class="label">{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { to: '/community', label: '社区', icon: '🏘️' },
  { to: '/trade', label: '闲置', icon: '🛒' },
  { to: '/chat', label: '私信', icon: '�' },
  { to: '/weather', label: '天气', icon: '🌤️' },
  { to: '/mine', label: '我的', icon: '👤' },
]
</script>

<style scoped lang="scss">
.layout { display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 56px; }
.content { flex: 1; }
.tabbar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; height: 56px; display: flex; background: #fff; border-top: 1px solid #eee; z-index: 100; }
.tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; color: #999; font-size: 12px; .icon { font-size: 20px; } &.active { color: #409eff; } }
</style>