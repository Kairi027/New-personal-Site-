<template>
  <div class="ai-chat-page">
    <div class="chat-header">
      <h3>AI 智能助手</h3>
      <el-button size="small" @click="newSession">新对话</el-button>
    </div>
    <div class="messages" ref="msgBox">
      <div v-for="msg in messages" :key="msg.msg_id || msg.temp_id" :class="['msg', msg.role, { 'system-notice': msg.content === 'AI 服务暂未配置，请联系管理员。' }]">
        <div class="bubble">{{ msg.content }}</div>
      </div>
    </div>
    <div class="input-area">
      <el-input v-model="input" placeholder="输入消息..." @keyup.enter="send" :disabled="loading" />
      <el-button type="primary" @click="send" :loading="loading">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { aiApi } from '@/api'

const sessionId = ref('')
const messages = ref<any[]>([])
const input = ref('')
const loading = ref(false)
const msgBox = ref<HTMLElement>()

onMounted(async () => {
  try {
    const sessions = await aiApi.listSessions()
    if (sessions.length) {
      sessionId.value = sessions[0].session_id
      const history = await aiApi.getHistory(sessionId.value)
      messages.value = history || []
    } else {
      await newSession()
    }
  } catch (e) { /* ignore */ }
})

async function newSession() {
  const data = await aiApi.createSession()
  sessionId.value = data.session_id
  messages.value = []
}

async function send() {
  if (!input.value.trim() || !sessionId.value) return
  const content = input.value
  messages.value.push({ temp_id: Date.now(), role: 'user', content })
  input.value = ''
  loading.value = true
  await scrollToBottom()
  try {
    const result = await aiApi.chat(sessionId.value, content)
    messages.value.push({ temp_id: Date.now(), role: 'assistant', content: result.content })
  } catch (e) {
    messages.value.push({ temp_id: Date.now(), role: 'assistant', content: '发送失败，请重试' })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
}
</script>

<style scoped lang="scss">
.ai-chat-page { display: flex; flex-direction: column; height: calc(100vh - 56px); padding: 12px; }
.chat-header { display: flex; justify-content: space-between; align-items: center; h3 { margin: 0; } }
.messages { flex: 1; overflow-y: auto; padding: 12px 0; .msg { margin-bottom: 12px; &.user { text-align: right; .bubble { background: #409eff; color: #fff; } } &.assistant { .bubble { background: #f0f0f0; } } &.system-notice { .bubble { background: #fdf6ec; color: #e6a23c; border: 1px solid #f5dab1; } } .bubble { display: inline-block; padding: 8px 12px; border-radius: 8px; max-width: 80%; text-align: left; } } }
.input-area { display: flex; gap: 8px; }
</style>
