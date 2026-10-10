import { ref } from 'vue';
import { travelApi } from '@/api';
import { ElMessage } from 'element-plus';
const origin = ref('116.397428,39.90923');
const destination = ref('116.407526,39.904030');
const mode = ref('driving');
const loading = ref(false);
const route = ref(null);
const routeError = ref(false);
const naviStatus = ref('');
const sessionId = ref('');
async function planRoute() {
    loading.value = true;
    routeError.value = false;
    try {
        const [oLng, oLat] = origin.value.split(',').map(Number);
        const [dLng, dLat] = destination.value.split(',').map(Number);
        route.value = await travelApi.planRoute({
            origin: { lng: oLng, lat: oLat },
            destination: { lng: dLng, lat: dLat },
            mode: mode.value,
        });
    }
    catch (e) {
        routeError.value = true;
        ElMessage.error(e?.message || '地图服务不可用，请稍后重试');
    }
    finally {
        loading.value = false;
    }
}
async function startNavi() {
    try {
        const data = await travelApi.startNavi(route.value.route_id);
        sessionId.value = data.session_id;
        naviStatus.value = '导航已开始';
    }
    catch (e) {
        ElMessage.error(e?.message || '启动导航失败');
    }
}
async function stopNavi() {
    try {
        await travelApi.stopNavi(sessionId.value);
        naviStatus.value = '';
        sessionId.value = '';
    }
    catch (e) {
        ElMessage.error(e?.message || '结束导航失败');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "travel-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "form-card" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "form-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    labelWidth: "60px",
}));
const __VLS_6 = __VLS_5({
    labelWidth: "60px",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "起点",
}));
const __VLS_10 = __VLS_9({
    label: "起点",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.origin),
    placeholder: "经度,纬度",
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.origin),
    placeholder: "经度,纬度",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
var __VLS_11;
const __VLS_16 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "终点",
}));
const __VLS_18 = __VLS_17({
    label: "终点",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.destination),
    placeholder: "经度,纬度",
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.destination),
    placeholder: "经度,纬度",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
var __VLS_19;
const __VLS_24 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    label: "方式",
}));
const __VLS_26 = __VLS_25({
    label: "方式",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.mode),
    ...{ style: {} },
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.mode),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "驾车",
    value: "driving",
}));
const __VLS_34 = __VLS_33({
    label: "驾车",
    value: "driving",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "步行",
    value: "walking",
}));
const __VLS_38 = __VLS_37({
    label: "步行",
    value: "walking",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "骑行",
    value: "riding",
}));
const __VLS_42 = __VLS_41({
    label: "骑行",
    value: "riding",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "公交",
    value: "transit",
}));
const __VLS_46 = __VLS_45({
    label: "公交",
    value: "transit",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_31;
var __VLS_27;
const __VLS_48 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}));
const __VLS_50 = __VLS_49({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onClick: (__VLS_ctx.planRoute)
};
__VLS_51.slots.default;
var __VLS_51;
var __VLS_7;
var __VLS_3;
if (__VLS_ctx.routeError) {
    const __VLS_56 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ class: "error-card" },
    }));
    const __VLS_58 = __VLS_57({
        ...{ class: "error-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    const __VLS_60 = {}.ElResult;
    /** @type {[typeof __VLS_components.ElResult, typeof __VLS_components.elResult, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        icon: "warning",
        title: "地图服务不可用",
        subTitle: "请稍后重试或联系管理员配置地图服务",
    }));
    const __VLS_62 = __VLS_61({
        icon: "warning",
        title: "地图服务不可用",
        subTitle: "请稍后重试或联系管理员配置地图服务",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    var __VLS_59;
}
if (__VLS_ctx.route) {
    const __VLS_64 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ class: "result-card" },
    }));
    const __VLS_66 = __VLS_65({
        ...{ class: "result-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    ((__VLS_ctx.route.distance / 1000).toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (Math.ceil(__VLS_ctx.route.duration / 60));
    const __VLS_68 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        type: "success",
        ...{ style: {} },
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        type: "success",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_72;
    let __VLS_73;
    let __VLS_74;
    const __VLS_75 = {
        onClick: (__VLS_ctx.startNavi)
    };
    __VLS_71.slots.default;
    var __VLS_71;
    var __VLS_67;
}
if (__VLS_ctx.naviStatus) {
    const __VLS_76 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ class: "navi-card" },
    }));
    const __VLS_78 = __VLS_77({
        ...{ class: "navi-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.naviStatus);
    const __VLS_80 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        ...{ 'onClick': {} },
        type: "danger",
    }));
    const __VLS_82 = __VLS_81({
        ...{ 'onClick': {} },
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    let __VLS_84;
    let __VLS_85;
    let __VLS_86;
    const __VLS_87 = {
        onClick: (__VLS_ctx.stopNavi)
    };
    __VLS_83.slots.default;
    var __VLS_83;
    var __VLS_79;
}
/** @type {__VLS_StyleScopedClasses['travel-page']} */ ;
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card']} */ ;
/** @type {__VLS_StyleScopedClasses['result-card']} */ ;
/** @type {__VLS_StyleScopedClasses['navi-card']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            origin: origin,
            destination: destination,
            mode: mode,
            loading: loading,
            route: route,
            routeError: routeError,
            naviStatus: naviStatus,
            planRoute: planRoute,
            startNavi: startNavi,
            stopNavi: stopNavi,
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