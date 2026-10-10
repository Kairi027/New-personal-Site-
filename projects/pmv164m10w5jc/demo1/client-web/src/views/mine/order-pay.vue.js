/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { tradeApi } from '@/api';
import { request } from '@/api/request';
const route = useRoute();
const router = useRouter();
const order = ref(null);
const payChannels = ref([]);
const orderId = ref('');
const countdownSeconds = ref(1200);
const countdownExpired = computed(() => countdownSeconds.value <= 0);
let countdownTimer = null;
const mockPayDialog = ref(false);
const currentChannel = ref('');
const payStatus = ref('idle');
const mockAmount = ref('0.00');
const qrPattern = ref([]);
const mockTitle = ref('支付');
const payLoading = ref(false);
const productOffShelf = ref(false);
const countdownText = computed(() => {
    const m = Math.floor(countdownSeconds.value / 60);
    const s = countdownSeconds.value % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});
onMounted(async () => {
    orderId.value = route.params.orderId;
    try {
        order.value = await tradeApi.getOrderDetail(orderId.value);
        if (order.value.status !== 'pending_pay') {
            ElMessage.warning('订单状态不可支付');
            router.replace(`/mine/orders/${orderId.value}`);
            return;
        }
        mockAmount.value = order.value.amount?.toFixed(2) || '0.00';
        await loadPayChannels();
        startCountdown();
    }
    catch (e) {
        ElMessage.error(e?.message || '订单加载失败');
        router.replace('/mine/orders');
    }
});
onUnmounted(() => {
    if (countdownTimer)
        clearInterval(countdownTimer);
});
async function loadPayChannels() {
    try {
        const channels = await request({ url: `/orders/${orderId.value}/pay-channels`, method: 'get' });
        payChannels.value = channels || [];
        productOffShelf.value = false;
    }
    catch (e) {
        if (e?.message?.includes('已下架')) {
            productOffShelf.value = true;
            payChannels.value = [];
        }
        else {
            ElMessage.error(e?.message || '获取支付方式失败');
        }
    }
}
function startCountdown() {
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
    ElMessage.warning('订单超时未支付，已自动取消');
    try {
        await tradeApi.cancelOrder(orderId.value);
    }
    catch (e) { /* ignore */ }
    router.replace('/mine/orders');
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
    payStatus.value = 'processing';
    payLoading.value = true;
    mockPayDialog.value = true;
    try {
        await tradeApi.payOrder(orderId.value, channel);
    }
    catch (e) {
        if (e?.message?.includes('已下架')) {
            productOffShelf.value = true;
            payChannels.value = [];
            ElMessage.warning('商品已下架，无法支付');
            mockPayDialog.value = false;
            payLoading.value = false;
            return;
        }
        ElMessage.error(e?.message || '发起支付失败');
        mockPayDialog.value = false;
        payLoading.value = false;
        return;
    }
    payLoading.value = false;
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
        await request({ url: `/orders/${orderId.value}/notify`, method: 'post' });
    }
    catch (e) {
        ElMessage.warning('支付确认异常，请联系客服');
    }
}
async function cancelMockPay() {
    try {
        await tradeApi.cancelOrder(orderId.value);
    }
    catch (e) { /* ignore */ }
    mockPayDialog.value = false;
    payStatus.value = 'idle';
    ElMessage.info('已取消支付');
    router.replace('/mine/orders');
}
function finishPay() {
    mockPayDialog.value = false;
    payStatus.value = 'idle';
    ElMessage.success('支付成功');
    router.replace(`/mine/orders/${orderId.value}`);
}
function handleBack() {
    ElMessage.info('订单待支付，可在【我的订单】里查看详情');
    router.push('/mine/orders');
}
async function handleCancelOrder() {
    try {
        await ElMessageBox.confirm('确定取消该订单？', '提示', { type: 'warning' });
        await tradeApi.cancelOrder(orderId.value);
        ElMessage.success('已取消');
        router.replace('/mine/orders');
    }
    catch (e) {
        if (e !== 'cancel' && e?.message)
            ElMessage.error(e?.message || '取消失败');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['expired']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "order-pay-page" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "header" },
    });
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
        onClick: (__VLS_ctx.handleBack)
    };
    __VLS_3.slots.default;
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "order-summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.order.product?.title || '商品');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "summary-value order-no" },
    });
    (__VLS_ctx.order.order_id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-amount-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "amount-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "amount-value" },
    });
    (__VLS_ctx.order.amount?.toFixed(2));
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
    if (__VLS_ctx.productOffShelf) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "off-shelf-warning" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "warning-text" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "warning-hint" },
        });
    }
    if (!__VLS_ctx.productOffShelf) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "pay-channels-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
            ...{ class: "card-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "pay-channels" },
        });
        for (const [ch] of __VLS_getVForSourceType((__VLS_ctx.payChannels))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.order))
                            return;
                        if (!(!__VLS_ctx.productOffShelf))
                            return;
                        ch.available && !__VLS_ctx.countdownExpired && __VLS_ctx.startMockPay(ch.channel);
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
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "pay-arrow" },
                });
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "action-bar" },
    });
    const __VLS_8 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.payLoading),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.payLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.handleCancelOrder)
    };
    __VLS_11.slots.default;
    var __VLS_11;
    const __VLS_16 = {}.ElDialog;
    /** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        modelValue: (__VLS_ctx.mockPayDialog),
        title: (__VLS_ctx.mockTitle),
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }));
    const __VLS_18 = __VLS_17({
        modelValue: (__VLS_ctx.mockPayDialog),
        title: (__VLS_ctx.mockTitle),
        width: "90%",
        closeOnClickModal: (false),
        showClose: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
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
            const __VLS_20 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }));
            const __VLS_22 = __VLS_21({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            let __VLS_24;
            let __VLS_25;
            let __VLS_26;
            const __VLS_27 = {
                onClick: (__VLS_ctx.confirmMockPay)
            };
            __VLS_23.slots.default;
            var __VLS_23;
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
            const __VLS_28 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }));
            const __VLS_30 = __VLS_29({
                ...{ 'onClick': {} },
                type: "primary",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
            let __VLS_32;
            let __VLS_33;
            let __VLS_34;
            const __VLS_35 = {
                onClick: (__VLS_ctx.confirmMockPay)
            };
            __VLS_31.slots.default;
            var __VLS_31;
        }
        if (__VLS_ctx.payStatus === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mock-hint success" },
            });
        }
    }
    {
        const { footer: __VLS_thisSlot } = __VLS_19.slots;
        if (__VLS_ctx.payStatus === 'processing') {
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
                onClick: (__VLS_ctx.cancelMockPay)
            };
            __VLS_39.slots.default;
            var __VLS_39;
        }
        if (__VLS_ctx.payStatus === 'success') {
            const __VLS_44 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
                ...{ 'onClick': {} },
                type: "primary",
            }));
            const __VLS_46 = __VLS_45({
                ...{ 'onClick': {} },
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
            let __VLS_48;
            let __VLS_49;
            let __VLS_50;
            const __VLS_51 = {
                onClick: (__VLS_ctx.finishPay)
            };
            __VLS_47.slots.default;
            var __VLS_47;
        }
    }
    var __VLS_19;
}
else {
    const __VLS_52 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        description: "加载中...",
    }));
    const __VLS_54 = __VLS_53({
        description: "加载中...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    var __VLS_56 = {};
    var __VLS_55;
}
/** @type {__VLS_StyleScopedClasses['order-pay-page']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['order-summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['order-no']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-amount-row']} */ ;
/** @type {__VLS_StyleScopedClasses['amount-label']} */ ;
/** @type {__VLS_StyleScopedClasses['amount-value']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-area']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-time']} */ ;
/** @type {__VLS_StyleScopedClasses['countdown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['expired']} */ ;
/** @type {__VLS_StyleScopedClasses['off-shelf-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
/** @type {__VLS_StyleScopedClasses['warning-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-channels-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-channels']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-name']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
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
            order: order,
            payChannels: payChannels,
            countdownExpired: countdownExpired,
            mockPayDialog: mockPayDialog,
            currentChannel: currentChannel,
            payStatus: payStatus,
            mockAmount: mockAmount,
            qrPattern: qrPattern,
            mockTitle: mockTitle,
            payLoading: payLoading,
            productOffShelf: productOffShelf,
            countdownText: countdownText,
            payIcon: payIcon,
            startMockPay: startMockPay,
            confirmMockPay: confirmMockPay,
            cancelMockPay: cancelMockPay,
            finishPay: finishPay,
            handleBack: handleBack,
            handleCancelOrder: handleCancelOrder,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=order-pay.vue.js.map