import { ref, onMounted } from 'vue';
import { tradeApi } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { request } from '@/api/request';
const myGoods = ref([]);
async function loadMyProducts() {
    try {
        const data = await tradeApi.mine({ page: 1, page_size: 50 });
        myGoods.value = data.items || [];
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
}
async function handleDelete(productId) {
    try {
        await ElMessageBox.confirm('确定废弃该商品？废弃后可在回收站恢复或彻底删除。', '提示', { type: 'warning' });
        await tradeApi.deleteProduct(productId);
        ElMessage.success('已废弃');
        loadMyProducts();
    }
    catch (e) {
        if (e !== 'cancel' && e?.message)
            ElMessage.error(e.message);
    }
}
async function handleOffShelf(productId) {
    try {
        await ElMessageBox.confirm('确定下架该商品？', '提示', { type: 'warning' });
        await request({ url: `/products/${productId}/off-shelf`, method: 'post' });
        ElMessage.success('已下架');
        loadMyProducts();
    }
    catch (e) {
        if (e !== 'cancel' && e?.message)
            ElMessage.error(e.message);
    }
}
async function handleOnShelf(productId) {
    try {
        await request({ url: `/products/${productId}/on-shelf`, method: 'post' });
        ElMessage.success('已上架');
        loadMyProducts();
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
}
function statusTagType(s) {
    return { pending: 'warning', on_sale: 'success', locked: 'warning', sold: 'info', off_shelf: 'danger', rejected: 'danger', violated: 'danger' }[s] || 'info';
}
onMounted(loadMyProducts);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mine-products-page" },
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
        __VLS_ctx.$router.push('/mine');
    }
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    size: "small",
    type: "warning",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    size: "small",
    type: "warning",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.$router.push('/mine/products/trash');
    }
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "goods-grid" },
});
for (const [g] of __VLS_getVForSourceType((__VLS_ctx.myGoods))) {
    const __VLS_16 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        key: (g.product_id),
        ...{ class: "goods-card" },
    }));
    const __VLS_18 = __VLS_17({
        key: (g.product_id),
        ...{ class: "goods-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    if (g.image_urls?.[0]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ onClick: (...[$event]) => {
                    if (!(g.image_urls?.[0]))
                        return;
                    __VLS_ctx.$router.push(`/goods/${g.product_id}`);
                } },
            src: (g.image_urls[0]),
            ...{ class: "goods-img" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "goods-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$router.push(`/goods/${g.product_id}`);
            } },
        ...{ class: "goods-title" },
    });
    (g.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "goods-bottom" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "goods-price" },
    });
    (g.price.toFixed(2));
    const __VLS_20 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        size: "small",
        type: (__VLS_ctx.statusTagType(g.status)),
    }));
    const __VLS_22 = __VLS_21({
        size: "small",
        type: (__VLS_ctx.statusTagType(g.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    (g.status_label);
    var __VLS_23;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "goods-stock" },
    });
    (g.locked_count > 0 ? `${g.stock}（锁定：${g.locked_count}）` : `${g.stock} 件`);
    if (g.stock === 0 && g.locked_count === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "sold-out-tag" },
        });
    }
    if (g.status === 'violated' && g.takedown_reason) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "takedown-reason" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "takedown-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "takedown-text" },
        });
        (g.takedown_reason);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "goods-actions" },
    });
    const __VLS_24 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (g.status === 'locked' || g.status === 'pending' || (g.locked_count || 0) > 0),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (g.status === 'locked' || g.status === 'pending' || (g.locked_count || 0) > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (...[$event]) => {
            __VLS_ctx.$router.push(`/trade/republish/${g.product_id}`);
        }
    };
    __VLS_27.slots.default;
    var __VLS_27;
    if (g.status === 'on_sale') {
        const __VLS_32 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }));
        const __VLS_34 = __VLS_33({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        let __VLS_36;
        let __VLS_37;
        let __VLS_38;
        const __VLS_39 = {
            onClick: (...[$event]) => {
                if (!(g.status === 'on_sale'))
                    return;
                __VLS_ctx.handleOffShelf(g.product_id);
            }
        };
        __VLS_35.slots.default;
        var __VLS_35;
    }
    if (g.status === 'off_shelf') {
        const __VLS_40 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
            disabled: (g.stock <= 0),
        }));
        const __VLS_42 = __VLS_41({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
            disabled: (g.stock <= 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        let __VLS_44;
        let __VLS_45;
        let __VLS_46;
        const __VLS_47 = {
            onClick: (...[$event]) => {
                if (!(g.status === 'off_shelf'))
                    return;
                __VLS_ctx.handleOnShelf(g.product_id);
            }
        };
        __VLS_43.slots.default;
        var __VLS_43;
    }
    const __VLS_48 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (...[$event]) => {
            __VLS_ctx.handleDelete(g.product_id);
        }
    };
    __VLS_51.slots.default;
    var __VLS_51;
    var __VLS_19;
}
if (!__VLS_ctx.myGoods.length) {
    const __VLS_56 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        description: "您还没有发布过商品",
    }));
    const __VLS_58 = __VLS_57({
        description: "您还没有发布过商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    const __VLS_60 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_62 = __VLS_61({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    let __VLS_64;
    let __VLS_65;
    let __VLS_66;
    const __VLS_67 = {
        onClick: (...[$event]) => {
            if (!(!__VLS_ctx.myGoods.length))
                return;
            __VLS_ctx.$router.push('/trade/create');
        }
    };
    __VLS_63.slots.default;
    var __VLS_63;
    var __VLS_59;
}
/** @type {__VLS_StyleScopedClasses['mine-products-page']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-card']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-img']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-info']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-title']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-price']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-stock']} */ ;
/** @type {__VLS_StyleScopedClasses['sold-out-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-reason']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-label']} */ ;
/** @type {__VLS_StyleScopedClasses['takedown-text']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            myGoods: myGoods,
            handleDelete: handleDelete,
            handleOffShelf: handleOffShelf,
            handleOnShelf: handleOnShelf,
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
//# sourceMappingURL=products.vue.js.map