import { ref, onMounted, nextTick } from 'vue';
import { aiApi } from '@/api';
const sessionId = ref('');
const messages = ref([]);
const input = ref('');
const loading = ref(false);
const msgBox = ref();
onMounted(async () => {
    try {
        const sessions = await aiApi.listSessions();
        if (sessions.length) {
            sessionId.value = sessions[0].session_id;
            const history = await aiApi.getHistory(sessionId.value);
            messages.value = history || [];
        }
        else {
            await newSession();
        }
    }
    catch (e) { /* ignore */ }
});
async function newSession() {
    const data = await aiApi.createSession();
    sessionId.value = data.session_id;
    messages.value = [];
}
async function send() {
    if (!input.value.trim() || !sessionId.value)
        return;
    const content = input.value;
    messages.value.push({ temp_id: Date.now(), role: 'user', content });
    input.value = '';
    loading.value = true;
    await scrollToBottom();
    try {
        const result = await aiApi.chat(sessionId.value, content);
        messages.value.push({ temp_id: Date.now(), role: 'assistant', content: result.content });
    }
    catch (e) {
        messages.value.push({ temp_id: Date.now(), role: 'assistant', content: '发送失败，请重试' });
    }
    finally {
        loading.value = false;
        await scrollToBottom();
    }
}
async function scrollToBottom() {
    await nextTick();
    if (msgBox.value)
        msgBox.value.scrollTop = msgBox.value.scrollHeight;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['bubble']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ai-chat-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.newSession)
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "messages" },
    ref: "msgBox",
});
/** @type {typeof __VLS_ctx.msgBox} */ ;
for (const [msg] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (msg.msg_id || msg.temp_id),
        ...{ class: (['msg', msg.role, { 'system-notice': msg.content === 'AI 服务暂未配置，请联系管理员。' }]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bubble" },
    });
    (msg.content);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-area" },
});
const __VLS_8 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.input),
    placeholder: "输入消息...",
    disabled: (__VLS_ctx.loading),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.input),
    placeholder: "输入消息...",
    disabled: (__VLS_ctx.loading),
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
    loading: (__VLS_ctx.loading),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.send)
};
__VLS_19.slots.default;
var __VLS_19;
/** @type {__VLS_StyleScopedClasses['ai-chat-page']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['messages']} */ ;
/** @type {__VLS_StyleScopedClasses['bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['input-area']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            messages: messages,
            input: input,
            loading: loading,
            msgBox: msgBox,
            newSession: newSession,
            send: send,
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