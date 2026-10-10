import { ref, onMounted } from 'vue';
import { tradeApi } from '@/api';
const keyword = ref('');
const goods = ref([]);
async function loadProducts() {
    try {
        const data = await tradeApi.search({ keyword: keyword.value, page: 1, page_size: 20 });
        goods.value = data.items || [];
    }
    catch (e) { /* ignore */ }
}
onMounted(loadProducts);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "trade-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-btns" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.$router.push('/trade/create');
    }
};
__VLS_3.slots.default;
var __VLS_3;
const __VLS_8 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索商品",
    prefixIcon: "Search",
    ...{ style: {} },
}));
const __VLS_10 = __VLS_9({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索商品",
    prefixIcon: "Search",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onKeyup: (__VLS_ctx.loadProducts)
};
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "goods-grid" },
});
for (const [g] of __VLS_getVForSourceType((__VLS_ctx.goods))) {
    const __VLS_16 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        key: (g.product_id),
        ...{ class: "goods-card" },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        key: (g.product_id),
        ...{ class: "goods-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (...[$event]) => {
            __VLS_ctx.$router.push(`/goods/${g.product_id}`);
        }
    };
    __VLS_19.slots.default;
    if (g.image_urls?.[0]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (g.image_urls[0]),
            ...{ class: "goods-img" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "goods-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "goods-title" },
    });
    (g.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "goods-price" },
    });
    (g.price.toFixed(2));
    var __VLS_19;
}
if (!__VLS_ctx.goods.length) {
    const __VLS_24 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        description: "暂无商品",
    }));
    const __VLS_26 = __VLS_25({
        description: "暂无商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
/** @type {__VLS_StyleScopedClasses['trade-page']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-btns']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-card']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-img']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-info']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-title']} */ ;
/** @type {__VLS_StyleScopedClasses['goods-price']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            keyword: keyword,
            goods: goods,
            loadProducts: loadProducts,
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