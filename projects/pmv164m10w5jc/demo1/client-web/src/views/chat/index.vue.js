import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { messageApi } from '@/api';
import { useUserStore } from '@/store/user';
import dayjs from 'dayjs';
const route = useRoute();
const userStore = useUserStore();
const sessions = ref([]);
const currentSession = ref(null);
const messages = ref([]);
const text = ref('');
const msgBox = ref();
onMounted(async () => {
    try {
        sessions.value = await messageApi.listSessions() || [];
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
    const sid = route.query.session_id;
    if (sid) {
        const s = sessions.value.find((x) => x.session_id === sid);
        openSession(s || { session_id: sid, target_name: '私信' });
    }
});
async function openSession(s) {
    currentSession.value = s;
    try {
        const data = await messageApi.getMessages(s.session_id);
        const items = data.items || data || [];
        const myId = userStore.userInfo?.user_id;
        messages.value = items.map((m) => ({ ...m, is_mine: m.sender_id === myId }));
        if (data.session?.target_name) {
            currentSession.value = { ...s, target_name: data.session.target_name };
        }
        await nextTick();
        if (msgBox.value)
            msgBox.value.scrollTop = msgBox.value.scrollHeight;
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
}
async function send() {
    if (!text.value.trim())
        return;
    try {
        await messageApi.send(currentSession.value.session_id, text.value.trim());
        messages.value.push({ message_id: Date.now(), content: text.value.trim(), is_mine: true, created_at: new Date().toISOString() });
        text.value = '';
        await nextTick();
        if (msgBox.value)
            msgBox.value.scrollTop = msgBox.value.scrollHeight;
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
}
function formatTime(t) { return dayjs(t).format('HH:mm'); }
async function clearMessages() {
    try {
        await ElMessageBox.confirm('确定清空与该联系人的聊天记录吗？', '提示', { type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消' });
    }
    catch {
        return;
    }
    try {
        await messageApi.clearSession(currentSession.value.session_id);
        messages.value = [];
        ElMessage.success('已清空');
    }
    catch (e) {
        ElMessage.error(e?.message || '清空失败');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['msg-text']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-page" },
});
if (!__VLS_ctx.currentSession) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "session-list" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sessions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.currentSession))
                        return;
                    __VLS_ctx.openSession(s);
                } },
            ...{ class: "session-item" },
            key: (s.session_id),
        });
        const __VLS_0 = {}.ElAvatar;
        /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            size: (40),
        }));
        const __VLS_2 = __VLS_1({
            size: (40),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "session-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "session-name" },
        });
        (s.target_name || '未知用户');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "session-time" },
        });
        (s.last_message || '点击查看对话');
    }
    if (!__VLS_ctx.sessions.length) {
        const __VLS_4 = {}.ElEmpty;
        /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            description: "暂无私信",
        }));
        const __VLS_6 = __VLS_5({
            description: "暂无私信",
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat-room" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.currentSession))
                    return;
                __VLS_ctx.currentSession = null;
            } },
        ...{ class: "back" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "chat-title" },
    });
    (__VLS_ctx.currentSession.target_name || '私信');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (__VLS_ctx.clearMessages) },
        ...{ class: "clear-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "messages" },
        ref: "msgBox",
    });
    /** @type {typeof __VLS_ctx.msgBox} */ ;
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (m.msg_id || m.message_id),
            ...{ class: (['msg', m.is_mine ? 'mine' : '']) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "msg-text" },
        });
        (m.content);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "msg-time" },
        });
        (__VLS_ctx.formatTime(m.created_at));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "input-bar" },
    });
    const __VLS_8 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.text),
        placeholder: "发消息...",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.text),
        placeholder: "发消息...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onKeyup: (__VLS_ctx.send)
    };
    var __VLS_11;
    const __VLS_16 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.send)
    };
    __VLS_19.slots.default;
    var __VLS_19;
}
/** @type {__VLS_StyleScopedClasses['chat-page']} */ ;
/** @type {__VLS_StyleScopedClasses['session-list']} */ ;
/** @type {__VLS_StyleScopedClasses['session-item']} */ ;
/** @type {__VLS_StyleScopedClasses['session-info']} */ ;
/** @type {__VLS_StyleScopedClasses['session-name']} */ ;
/** @type {__VLS_StyleScopedClasses['session-time']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-room']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['back']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['messages']} */ ;
/** @type {__VLS_StyleScopedClasses['msg-text']} */ ;
/** @type {__VLS_StyleScopedClasses['msg-time']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sessions: sessions,
            currentSession: currentSession,
            messages: messages,
            text: text,
            msgBox: msgBox,
            openSession: openSession,
            send: send,
            formatTime: formatTime,
            clearMessages: clearMessages,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=index.vue.js.map