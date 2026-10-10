<template>
  <div class="chat-page">
    <div class="session-list" v-if="!currentSession">
      <h3>私信</h3>
      <div class="session-item" v-for="s in sessions" :key="s.session_id" @click="openSession(s)">
        <el-avatar :size="40" />
        <div class="session-info">
          <span class="session-name">{{ s.target_name || '未知用户' }}</span>
          <span class="session-time">{{ s.last_message || '点击查看对话' }}</span>
        </div>
      </div>
      <el-empty v-if="!sessions.length" description="暂无私信" />
    </div>
    <div class="chat-room" v-else>
      <div class="chat-header">
        <span @click="currentSession = null" class="back">←</span>
        <span class="chat-title">{{ currentSession.target_name || '私信' }}</span>
        <span class="clear-btn" @click="clearMessages">清空记录</span>
      </div>
      <div class="messages" ref="msgBox">
        <div v-for="m in messages" :key="m.msg_id || m.message_id" :class="['msg', m.is_mine ? 'mine' : '']">
          <span class="msg-text">{{ m.content }}</span>
          <span class="msg-time">{{ formatTime(m.created_at) }}</span>
        </div>
      </div>
      <div class="input-bar">
        <el-input v-model="text" placeholder="发消息..." @keyup.enter="send" />
        <el-button type="primary" @click="send">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { messageApi } from '@/api'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()
const sessions = ref<any[]>([])
const currentSession = ref<any>(null)
const messages = ref<any[]>([])
const text = ref('')
const msgBox = ref<HTMLElement>()

onMounted(async () => {
  try { sessions.value = await messageApi.listSessions() || [] } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
  const sid = route.query.session_id as string
  if (sid) {
    const s = sessions.value.find((x: any) => x.session_id === sid)
    openSession(s || { session_id: sid, target_name: '私信' })
  }
})

async function openSession(s: any) {
  currentSession.value = s
  try {
    const data = await messageApi.getMessages(s.session_id)
    const items = data.items || data || []
    const myId = userStore.userInfo?.user_id as string
    messages.value = items.map((m: any) => ({ ...m, is_mine: m.sender_id === myId }))
    if (data.session?.target_name) {
      currentSession.value = { ...s, target_name: data.session.target_name }
    }
    await nextTick()
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  } catch (e: any) { if (e?.message) ElMessage.error(e.message) }
}

async function send() {
  if (!text.value.trim()) return
  try {
    await messageApi.send(currentSession.value.session_id, text.value.trim())
    messages.value.push({ message_id: Date.now(), content: text.value.trim(), is_mine: true, created_at: new Date().toISOString() })
    text.value = ''
    await nextTick()
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}

function formatTime(t: string) { return dayjs(t).format('HH:mm') }

async function clearMessages() {
  try {
    await ElMessageBox.confirm('确定清空与该联系人的聊天记录吗？', '提示', { type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消' })
  } catch { return }
  try {
    await messageApi.clearSession(currentSession.value.session_id)
    messages.value = []
    ElMessage.success('已清空')
  } catch (e: any) { ElMessage.error(e?.message || '清空失败') }
}
</script>

<style scoped lang="scss">
.chat-page { height: 100vh; display: flex; flex-direction: column; }
.session-list { padding: 12px; h3 { margin: 0 0 12px; } }
.session-item { display: flex; gap: 12px; align-items: center; padding: 12px; background: #fff; border-radius: 8px; margin-bottom: 8px; cursor: pointer; .session-info { display: flex; flex-direction: column; .session-name { font-size: 15px; } .session-time { color: #999; font-size: 12px; } } }
.chat-room { display: flex; flex-direction: column; height: 100vh; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border-bottom: 1px solid #eee; .back { font-size: 20px; cursor: pointer; } .chat-title { flex: 1; } .clear-btn { font-size: 13px; color: #f56c6c; cursor: pointer; } }
.messages { flex: 1; overflow-y: auto; padding: 12px; .msg { margin-bottom: 12px; display: flex; flex-direction: column; align-items: flex-start; .msg-text { background: #fff; padding: 8px 12px; border-radius: 8px; max-width: 70%; } .msg-time { font-size: 11px; color: #ccc; margin-top: 2px; } &.mine { align-items: flex-end; .msg-text { background: #409eff; color: #fff; } } } }
.input-bar { display: flex; gap: 8px; padding: 8px 12px; background: #fff; border-top: 1px solid #eee; }
</style>
