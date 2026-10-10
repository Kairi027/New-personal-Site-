/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { tradeApi } from '@/api';
import { formatDateTime } from '@/utils/time';
const route = useRoute();
const router = useRouter();
const order = ref(null);
onMounted(async () => {
    try {
        order.value = await tradeApi.getOrderDetail(route.params.order_id);
    }
    catch (e) {
        ElMessage.error(e?.message || '加载失败');
        router.push('/mine/orders');
    }
});
async function handleCancel() {
    try {
        await ElMessageBox.confirm('确定取消该订单？', '提示', { type: 'warning' });
        await tradeApi.cancelOrder(order.value.order_id);
        ElMessage.success('已取消');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '取消失败');
    }
}
async function handlePay() {
    router.push(`/mine/orders/${order.value.order_id}/pay`);
}
async function handleShip() {
    try {
        const { value } = await ElMessageBox.prompt('请输入物流单号', '发货', { inputPattern: /.+/, inputErrorMessage: '请输入物流单号' });
        await tradeApi.shipOrder(order.value.order_id);
        ElMessage.success('已发货');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '发货失败');
    }
}
async function handleConfirm() {
    try {
        await ElMessageBox.confirm('确定已收到商品？', '确认收货', { type: 'warning' });
        await tradeApi.confirmOrder(order.value.order_id);
        ElMessage.success('已确认收货');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '确认失败');
    }
}
async function handleRefund() {
    try {
        const { value } = await ElMessageBox.prompt('请输入退款原因', '申请退款', { inputPattern: /.+/, inputErrorMessage: '请输入退款原因' });
        await tradeApi.refundApply(order.value.order_id, value);
        ElMessage.success('退款申请已提交');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '退款失败');
    }
}
async function handleRefundAgree() {
    try {
        await ElMessageBox.confirm('确定同意该退款申请？', '同意退款', { type: 'warning' });
        await tradeApi.refundAgree(order.value.order_id);
        ElMessage.success('已同意退款，处理中...');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '操作失败');
    }
}
async function handleRefundReject() {
    try {
        const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', { inputPattern: /.+/, inputErrorMessage: '请输入拒绝原因' });
        await tradeApi.refundReject(order.value.order_id, value);
        ElMessage.success('已拒绝退款');
        order.value = await tradeApi.getOrderDetail(order.value.order_id);
    }
    catch (e) {
        if (e !== 'cancel')
            ElMessage.error(e?.message || '操作失败');
    }
}
function statusTagType(s) {
    return { pending_pay: 'warning', paid: 'primary', shipped: 'primary', completed: 'success', canceled: 'info', refunding: 'warning', refunded: 'info' }[s] || 'info';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "order-detail-page" },
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
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.order))
                return;
            __VLS_ctx.$router.push('/mine/orders');
        }
    };
    __VLS_3.slots.default;
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "status-card" },
    });
    const __VLS_8 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.order.status)),
        size: "large",
    }));
    const __VLS_10 = __VLS_9({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.order.status)),
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    (__VLS_ctx.order.status_label);
    var __VLS_11;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "role-tag" },
        ...{ class: (__VLS_ctx.order.role) },
    });
    (__VLS_ctx.order.role === 'buyer' ? '买家' : '卖家');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "product-row" },
    });
    if (__VLS_ctx.order.product?.image) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.order.product.image),
            ...{ class: "product-img" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "product-title" },
    });
    (__VLS_ctx.order.product?.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "product-price" },
    });
    (__VLS_ctx.order.product?.price?.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.order.payment?.pay_channel_label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.order.amount?.toFixed(2));
    if (__VLS_ctx.order.payment?.pay_time) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.order.payment.pay_time));
    }
    if (__VLS_ctx.order.logistics?.ship_time) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "info-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        if (__VLS_ctx.order.logistics.logistics_company) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.order.logistics.logistics_company);
        }
        if (__VLS_ctx.order.logistics.logistics_no) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.order.logistics.logistics_no);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.order.logistics.ship_time));
        if (__VLS_ctx.order.logistics.complete_time) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.formatDateTime(__VLS_ctx.order.logistics.complete_time));
        }
    }
    if (__VLS_ctx.order.cancel?.cancel_time) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "info-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.formatDateTime(__VLS_ctx.order.cancel.cancel_time));
        if (__VLS_ctx.order.cancel.cancel_reason) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.order.cancel.cancel_reason);
        }
    }
    if (__VLS_ctx.order.refund && (__VLS_ctx.order.refund.refund_time || __VLS_ctx.order.refund.refund_reason || __VLS_ctx.order.refund.refund_apply_time || __VLS_ctx.order.refund.refund_reject_reason || __VLS_ctx.order.refund.refund_processing)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "info-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        if (__VLS_ctx.order.refund.refund_apply_time) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.formatDateTime(__VLS_ctx.order.refund.refund_apply_time));
        }
        if (__VLS_ctx.order.refund.refund_reason) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.order.refund.refund_reason);
        }
        if (__VLS_ctx.order.refund.refund_processing) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "processing-tip" },
            });
        }
        if (__VLS_ctx.order.refund.refund_reject_reason) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.order.refund.refund_reject_reason);
        }
        if (__VLS_ctx.order.refund.refund_reject_time) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.formatDateTime(__VLS_ctx.order.refund.refund_reject_time));
        }
        if (__VLS_ctx.order.refund.refund_time) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.formatDateTime(__VLS_ctx.order.refund.refund_time));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "action-bar" },
    });
    if (__VLS_ctx.order.actions?.includes('cancel')) {
        const __VLS_12 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_14 = __VLS_13({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        let __VLS_16;
        let __VLS_17;
        let __VLS_18;
        const __VLS_19 = {
            onClick: (__VLS_ctx.handleCancel)
        };
        __VLS_15.slots.default;
        var __VLS_15;
    }
    if (__VLS_ctx.order.actions?.includes('pay')) {
        const __VLS_20 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onClick: (__VLS_ctx.handlePay)
        };
        __VLS_23.slots.default;
        var __VLS_23;
    }
    if (__VLS_ctx.order.actions?.includes('ship')) {
        const __VLS_28 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (__VLS_ctx.handleShip)
        };
        __VLS_31.slots.default;
        var __VLS_31;
    }
    if (__VLS_ctx.order.actions?.includes('confirm')) {
        const __VLS_36 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_40;
        let __VLS_41;
        let __VLS_42;
        const __VLS_43 = {
            onClick: (__VLS_ctx.handleConfirm)
        };
        __VLS_39.slots.default;
        var __VLS_39;
    }
    if (__VLS_ctx.order.actions?.includes('refund')) {
        const __VLS_44 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_48;
        let __VLS_49;
        let __VLS_50;
        const __VLS_51 = {
            onClick: (__VLS_ctx.handleRefund)
        };
        __VLS_47.slots.default;
        var __VLS_47;
    }
    if (__VLS_ctx.order.role === 'seller' && __VLS_ctx.order.status === 'refunding' && !__VLS_ctx.order.refund?.refund_processing) {
        const __VLS_52 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }));
        const __VLS_54 = __VLS_53({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        let __VLS_56;
        let __VLS_57;
        let __VLS_58;
        const __VLS_59 = {
            onClick: (__VLS_ctx.handleRefundAgree)
        };
        __VLS_55.slots.default;
        var __VLS_55;
    }
    if (__VLS_ctx.order.role === 'seller' && __VLS_ctx.order.status === 'refunding' && !__VLS_ctx.order.refund?.refund_processing) {
        const __VLS_60 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }));
        const __VLS_62 = __VLS_61({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        let __VLS_64;
        let __VLS_65;
        let __VLS_66;
        const __VLS_67 = {
            onClick: (__VLS_ctx.handleRefundReject)
        };
        __VLS_63.slots.default;
        var __VLS_63;
    }
}
else {
    const __VLS_68 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        description: "加载中...",
    }));
    const __VLS_70 = __VLS_69({
        description: "加载中...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    var __VLS_72 = {};
    var __VLS_71;
}
/** @type {__VLS_StyleScopedClasses['order-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['role-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['product-row']} */ ;
/** @type {__VLS_StyleScopedClasses['product-img']} */ ;
/** @type {__VLS_StyleScopedClasses['product-title']} */ ;
/** @type {__VLS_StyleScopedClasses['product-price']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['processing-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatDateTime: formatDateTime,
            order: order,
            handleCancel: handleCancel,
            handlePay: handlePay,
            handleShip: handleShip,
            handleConfirm: handleConfirm,
            handleRefund: handleRefund,
            handleRefundAgree: handleRefundAgree,
            handleRefundReject: handleRefundReject,
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
//# sourceMappingURL=order-detail.vue.js.map