import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { tradeApi, messageApi } from '@/api';
import { request } from '@/api/request';
import { useUserStore } from '@/store/user';
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const product = ref(null);
const ordering = ref(false);
const payDialog = ref(false);
const payChannels = ref([]);
const currentOrderId = ref('');
const orderConfirmDialog = ref(false);
const currentOrder = ref(null);
const countdownSeconds = ref(1200);
const countdownExpired = computed(() => countdownSeconds.value <= 0);
let countdownTimer = null;
const mockPayDialog = ref(false);
const currentChannel = ref('');
const payStatus = ref('idle');
const mockAmount = ref('0.00');
const qrPattern = ref([]);
const mockTitle = ref('支付');
const countdownText = computed(() => {
    const m = Math.floor(countdownSeconds.value / 60);
    const s = countdownSeconds.value % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});
onMounted(async () => {
    try {
        product.value = await tradeApi.getDetail(route.params.id);
    }
    catch (e) {
        ElMessage.error('商品加载失败');
        router.replace('/trade');
    }
});
onUnmounted(() => {
    if (countdownTimer)
        clearInterval(countdownTimer);
});
async function contactSeller() {
    if (!userStore.token) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    if (product.value.is_owner) {
        ElMessage.warning('不能与自己发起私聊');
        return;
    }
    try {
        const data = await messageApi.createSession(product.value.seller_id);
        router.push(`/chat?session_id=${data.session_id}`);
    }
    catch (e) {
        ElMessage.error(e?.message || '创建会话失败');
    }
}
function startCountdown(_created_at) {
    if (countdownTimer)
        clearInterval(countdownTimer);
    countdownSeconds.value = 1200;
    countdownTimer = setInterval(() => {
        countdownSeconds.value--;
        if (countdownSeconds.value <= 0) {
            if (countdownTimer)
                clearInterval(countdownTimer);
            handleCountdownExpired();
        }
    }, 1000);
}
async function handleCountdownExpired() {
    if (currentOrderId.value) {
        try {
            await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' });
        }
        catch (e) { /* ignore */ }
    }
    orderConfirmDialog.value = false;
    ElMessage.warning('订单超时未支付，已自动取消');
    if (product.value) {
        product.value.order_button_visible = true;
        product.value.status = 'on_sale';
        product.value.status_label = '在售';
    }
}
async function handlePlaceOrder() {
    if (!userStore.token) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    try {
        ordering.value = true;
        const data = await tradeApi.createOrder(product.value.product_id);
        currentOrderId.value = data.order_id;
        currentOrder.value = { amount: data.amount, created_at: data.created_at };
        orderConfirmDialog.value = true;
        startCountdown(data.created_at);
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
    finally {
        ordering.value = false;
    }
}
async function proceedToPay() {
    try {
        const channels = await request({ url: `/orders/${currentOrderId.value}/pay-channels`, method: 'get' });
        payChannels.value = channels || [];
        orderConfirmDialog.value = false;
        if (countdownTimer)
            clearInterval(countdownTimer);
        payDialog.value = true;
    }
    catch (e) {
        ElMessage.error(e?.message || '获取支付方式失败');
    }
}
async function cancelOrderFromConfirm() {
    if (currentOrderId.value) {
        try {
            await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' });
        }
        catch (e) { /* ignore */ }
    }
    orderConfirmDialog.value = false;
    if (countdownTimer)
        clearInterval(countdownTimer);
    ElMessage.info('已取消订单');
    if (product.value) {
        product.value.order_button_visible = true;
        product.value.status = 'on_sale';
        product.value.status_label = '在售';
    }
}
function closeOrderConfirm() {
    orderConfirmDialog.value = false;
    if (countdownTimer)
        clearInterval(countdownTimer);
    ElMessage.info('订单待支付，可在【我的订单】里查看详情');
}
function payIcon(channel) {
    return { wechat: '💚', alipay: '💙', apple_pay: '🍎', google_pay: '🅖' }[channel] || '💳';
}
function generateQrPattern() {
    const pattern = [];
    for (let i = 0; i < 64; i++)
        pattern.push(Math.random() > 0.5);
    pattern[0] = pattern[7] = pattern[56] = pattern[63] = true;
    return pattern;
}
async function startMockPay(channel) {
    const ch = payChannels.value.find(c => c.channel === channel);
    mockTitle.value = ch?.name || '支付';
    currentChannel.value = channel;
    mockAmount.value = (product.value.price || product.value.price_cents / 100).toFixed(2);
    payStatus.value = 'processing';
    payDialog.value = false;
    mockPayDialog.value = true;
    try {
        await tradeApi.payOrder(currentOrderId.value, channel);
    }
    catch (e) {
        ElMessage.error(e?.message || '发起支付失败');
        mockPayDialog.value = false;
        return;
    }
    if (channel === 'wechat') {
        qrPattern.value = generateQrPattern();
        setTimeout(() => confirmMockPay(), 3000);
    }
    else if (channel === 'alipay') {
        setTimeout(() => confirmMockPay(), 2500);
    }
}
async function confirmMockPay() {
    if (payStatus.value !== 'processing')
        return;
    payStatus.value = 'success';
    try {
        await request({ url: `/orders/${currentOrderId.value}/notify`, method: 'post' });
    }
    catch (e) {
        ElMessage.warning('支付确认异常，请联系客服');
    }
}
async function cancelPayDialog() {
    if (currentOrderId.value) {
        try {
            await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' });
        }
        catch (e) { /* ignore */ }
    }
    payDialog.value = false;
    ElMessage.info('已取消支付');
    if (product.value) {
        product.value.order_button_visible = true;
        product.value.status = 'on_sale';
        product.value.status_label = '在售';
    }
}
async function cancelMockPay() {
    try {
        await request({ url: `/orders/${currentOrderId.value}/cancel`, method: 'post' });
    }
    catch (e) { /* ignore */ }
    mockPayDialog.value = false;
    payStatus.value = 'idle';
    ElMessage.info('已取消支付');
    if (product.value) {
        product.value.order_button_visible = true;
        product.value.status = 'on_sale';
        product.value.status_label = '在售';
    }
}
function finishPay() {
    mockPayDialog.value = false;
    payStatus.value = 'idle';
    ElMessage.success('支付成功');
    product.value.order_button_visible = false;
    product.value.status = 'sold';
    product.value.status_label = '售罄';
}
function statusTagType(s) {
    return { pending: 'warning', on_sale: 'success', locked: 'warning', sold: 'info', off_shelf: 'danger', rejected: 'danger', violated: 'danger' }[s] || 'info';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['expired']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.product) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-page" },
    });
    if (__VLS_ctx.product.image_urls?.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "img-box" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.product.image_urls[0]),
            ...{ class: "main-img" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "price" },
    });
    ((__VLS_ctx.product.price || __VLS_ctx.product.price_cents / 100).toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "title" },
    });
    (__VLS_ctx.product.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "desc" },
    });
    (__VLS_ctx.product.description || '暂无描述');
    if (__VLS_ctx.product.status_label) {
        const __VLS_0 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            size: "small",
            type: (__VLS_ctx.statusTagType(__VLS_ctx.product.status)),
        }));
        const __VLS_2 = __VLS_1({
            size: "small",
            type: (__VLS_ctx.statusTagType(__VLS_ctx.product.status)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_3.slots.default;
        (__VLS_ctx.product.status_label);
        var __VLS_3;
    }
    if (__VLS_ctx.product.status === 'violated' && __VLS_ctx.product.takedown_reason) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "takedown-reason" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "takedown-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "takedown-text" },
        });
        (__VLS_ctx.product.takedown_reason);
    }
    if (__VLS_ctx.product.is_owner) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "stock-info" },
        });
        ((__VLS_ctx.product.locked_count || 0) > 0 ? `${__VLS_ctx.product.stock}（锁定：${__VLS_ctx.product.locked_count}）` : `${__VLS_ctx.product.stock} 件`);
    }
    if (!__VLS_ctx.product.is_owner && __VLS_ctx.product.stock > 0 && __VLS_ctx.product.stock <= 5) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "stock-hint" },
        });
        (__VLS_ctx.product.stock);
    }
    if (__VLS_ctx.product.status === 'on_sale' && __VLS_ctx.product.stock === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "stock-hint" },
            ...{ style: {} },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "seller-card" },
    });
    const __VLS_4 = {}.ElAvatar;
    /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        size: (40),
    }));
    const __VLS_6 = __VLS_5({
        size: (40),
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "seller-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "seller-name" },
    });
    (__VLS_ctx.product.seller_name || '卖家');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "seller-tip" },
    });
    if (__VLS_ctx.product.contact && !__VLS_ctx.product.is_owner) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "contact-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.product.contact);
        const __VLS_8 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_10 = __VLS_9({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        let __VLS_12;
        let __VLS_13;
        let __VLS_14;
        const __VLS_15 = {
            onClick: (__VLS_ctx.contactSeller)
        };
        __VLS_11.slots.default;
        var __VLS_11;
    }
    if (__VLS_ctx.product.order_button_visible) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "action-bar" },
        });
        const __VLS_16 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            ...{ 'onClick': {} },
            type: "warning",
            loading: (__VLS_ctx.ordering),
            ...{ style: {} },
        }));
        const __VLS_18 = __VLS_17({
            ...{ 'onClick': {} },
            type: "warning",
            loading: (__VLS_ctx.ordering),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        let __VLS_20;
        let __VLS_21;
        let __VLS_22;
        const __VLS_23 = {
            onClick: (__VLS_ctx.handlePlaceOrder)
        };
        __VLS_19.slots.default;
        var __VLS_19;
    }
    if (__VLS_ctx.product.is_owner) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "action-bar" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
    }
    if (!__VLS_ctx.product.order_button_visible && !__VLS_ctx.product.is_owner && __VLS_ctx.product.status !== 'on_sale') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "action-bar" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
        (__VLS_ctx.product.status_label || '商品不可交易');
    }
    const __VLS_24 = {}.ElDialog;
    /** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        modelValue: (__VLS_ctx.orderConfirmDialog),
        title: "订单确认",
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }));
    const __VLS_26 = __VLS_25({
        modelValue: (__VLS_ctx.orderConfirmDialog),
        title: "订单确认",
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    if (__VLS_ctx.currentOrder) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "order-confirm-body" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "order-summary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "summary-title" },
        });
        (__VLS_ctx.product.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "summary-amount" },
        });
        (__VLS_ctx.currentOrder.amount.toFixed(2));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "countdown-area" },
            ...{ class: ({ expired: __VLS_ctx.countdownExpired }) },
        });
        if (!__VLS_ctx.countdownExpired) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "countdown-label" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "countdown-time" },
            });
            (__VLS_ctx.countdownText);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "countdown-label expired" },
            });
        }
    }
    {
        const { footer: __VLS_thisSlot } = __VLS_27.slots;
        const __VLS_28 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (__VLS_ctx.closeOrderConfirm)
        };
        __VLS_31.slots.default;
        var __VLS_31;
        const __VLS_36 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_40;
        let __VLS_41;
        let __VLS_42;
        const __VLS_43 = {
            onClick: (__VLS_ctx.cancelOrderFromConfirm)
        };
        __VLS_39.slots.default;
        var __VLS_39;
        const __VLS_44 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            ...{ 'onClick': {} },
            type: "primary",
            disabled: (__VLS_ctx.countdownExpired),
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onClick': {} },
            type: "primary",
            disabled: (__VLS_ctx.countdownExpired),
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_48;
        let __VLS_49;
        let __VLS_50;
        const __VLS_51 = {
            onClick: (__VLS_ctx.proceedToPay)
        };
        __VLS_47.slots.default;
        var __VLS_47;
    }
    var __VLS_27;
    const __VLS_52 = {}.ElDialog;
    /** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        modelValue: (__VLS_ctx.payDialog),
        title: "选择支付方式",
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }));
    const __VLS_54 = __VLS_53({
        modelValue: (__VLS_ctx.payDialog),
        title: "选择支付方式",
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-channels" },
    });
    for (const [ch] of __VLS_getVForSourceType((__VLS_ctx.payChannels))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.product))
                        return;
                    ch.available && __VLS_ctx.startMockPay(ch.channel);
                } },
            key: (ch.channel),
            ...{ class: "pay-item" },
            ...{ class: ({ disabled: !ch.available }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pay-icon" },
        });
        (__VLS_ctx.payIcon(ch.channel));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pay-name" },
        });
        (ch.name);
        if (!ch.available) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "pay-disabled" },
            });
            (ch.disabled_reason);
        }
    }
    {
        const { footer: __VLS_thisSlot } = __VLS_55.slots;
        const __VLS_56 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            ...{ 'onClick': {} },
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_60;
        let __VLS_61;
        let __VLS_62;
        const __VLS_63 = {
            onClick: (__VLS_ctx.cancelPayDialog)
        };
        __VLS_59.slots.default;
        var __VLS_59;
    }
    var __VLS_55;
    const __VLS_64 = {}.ElDialog;
    /** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        modelValue: (__VLS_ctx.mockPayDialog),
        title: (__VLS_ctx.mockTitle),
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }));
    const __VLS_66 = __VLS_65({
        modelValue: (__VLS_ctx.mockPayDialog),
        title: (__VLS_ctx.mockTitle),
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mock-pay-body" },
    });
    if (__VLS_ctx.currentChannel === 'wechat') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mock-wechat" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "qr-placeholder" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "qr-grid" },
        });
        for (const [i] of __VLS_getVForSourceType((64))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (i),
                ...{ class: "qr-cell" },
                ...{ class: ({ on: __VLS_ctx.qrPattern[i - 1] }) },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mock-amount" },
        });
        (__VLS_ctx.mockAmount);
        if (__VLS_ctx.payStatus === 'processing') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint" },
            });
        }
        if (__VLS_ctx.payStatus === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint success" },
            });
        }
    }
    if (__VLS_ctx.currentChannel === 'alipay') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mock-alipay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "alipay-logo" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mock-amount" },
        });
        (__VLS_ctx.mockAmount);
        if (__VLS_ctx.payStatus === 'processing') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint" },
            });
        }
        if (__VLS_ctx.payStatus === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint success" },
            });
        }
    }
    if (__VLS_ctx.currentChannel === 'apple_pay') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mock-apple-pay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "apple-pay-logo" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mock-amount" },
        });
        (__VLS_ctx.mockAmount);
        if (__VLS_ctx.payStatus === 'processing') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "face-id-area" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "face-id-icon" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint" },
            });
            const __VLS_68 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }));
            const __VLS_70 = __VLS_69({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            let __VLS_72;
            let __VLS_73;
            let __VLS_74;
            const __VLS_75 = {
                onClick: (__VLS_ctx.confirmMockPay)
            };
            __VLS_71.slots.default;
            var __VLS_71;
        }
        if (__VLS_ctx.payStatus === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint success" },
            });
        }
    }
    if (__VLS_ctx.currentChannel === 'google_pay') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mock-google-pay" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "gpay-logo" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mock-amount" },
        });
        (__VLS_ctx.mockAmount);
        if (__VLS_ctx.payStatus === 'processing') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "gpay-area" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint" },
            });
            const __VLS_76 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }));
            const __VLS_78 = __VLS_77({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
            let __VLS_80;
            let __VLS_81;
            let __VLS_82;
            const __VLS_83 = {
                onClick: (__VLS_ctx.confirmMockPay)
            };
            __VLS_79.slots.default;
            var __VLS_79;
        }
        if (__VLS_ctx.payStatus === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint success" },
            });
        }
    }
    {
        const { footer: __VLS_thisSlot } = __VLS_67.slots;
        if (__VLS_ctx.payStatus === 'processing') {
            const __VLS_84 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
                ...{ 'onClick': {} },
            }));
            const __VLS_86 = __VLS_85({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            let __VLS_88;
            let __VLS_89;
            let __VLS_90;
            const __VLS_91 = {
                onClick: (__VLS_ctx.cancelMockPay)
            };
            __VLS_87.slots.default;
            var __VLS_87;
        }
        if (__VLS_ctx.payStatus === 'success') {
            const __VLS_92 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                ...{ 'onClick': {} },
                type: "primary",
            }));
            const __VLS_94 = __VLS_93({
                ...{ 'onClick': {} },
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            let __VLS_96;
            let __VLS_97;
            let __VLS_98;
            const __VLS_99 = {
                onClick: (__VLS_ctx.finishPay)
            };
            __VLS_95.slots.default;
            var __VLS_95;
        }
    }
    var __VLS_67;
}
else {
    const __VLS_100 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        description: "加载中...",
    }));
    const __VLS_102 = __VLS_101({
        description: "加载中...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    var __VLS_104 = {};
    var __VLS_103;
}
/** @type {__VLS_StyleScopedClasses['detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['img-box']} */ ;
/** @type {__VLS_StyleScopedClasses['main-img']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['price']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['desc']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-reason']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-text']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-info']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['seller-card']} */ ;
/** @type {__VLS_StyleScopedClasses['seller-info']} */ ;
/** @type {__VLS_StyleScopedClasses['seller-name']} */ ;
/** @type {__VLS_StyleScopedClasses['seller-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['contact-card']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['order-confirm-body']} */ ;
/** @type {__VLS_StyleScopedClasses['order-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-title']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-area']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-time']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['expired']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-channels']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-name']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-pay-body']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-wechat']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-alipay']} */ ;
/** @type {__VLS_StyleScopedClasses['alipay-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-apple-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['apple-pay-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['face-id-area']} */ ;
/** @type {__VLS_StyleScopedClasses['face-id-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-google-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['gpay-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['gpay-area']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['mock-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            product: product,
            ordering: ordering,
            payDialog: payDialog,
            payChannels: payChannels,
            orderConfirmDialog: orderConfirmDialog,
            currentOrder: currentOrder,
            countdownExpired: countdownExpired,
            mockPayDialog: mockPayDialog,
            currentChannel: currentChannel,
            payStatus: payStatus,
            mockAmount: mockAmount,
            qrPattern: qrPattern,
            mockTitle: mockTitle,
            countdownText: countdownText,
            contactSeller: contactSeller,
            handlePlaceOrder: handlePlaceOrder,
            proceedToPay: proceedToPay,
            cancelOrderFromConfirm: cancelOrderFromConfirm,
            closeOrderConfirm: closeOrderConfirm,
            payIcon: payIcon,
            startMockPay: startMockPay,
            confirmMockPay: confirmMockPay,
            cancelPayDialog: cancelPayDialog,
            cancelMockPay: cancelMockPay,
            finishPay: finishPay,
            statusTagType: statusTagType,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=detail.vue.js.map