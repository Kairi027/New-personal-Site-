/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { weatherApi } from '@/api';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import CityPicker from './components/CityPicker.vue';
const STORAGE_KEY = 'weather_selected_city';
const DEFAULT_CITY = '北京';
const currentCity = ref(DEFAULT_CITY);
const panelVisible = ref(false);
const weather = ref(null);
const forecast = ref(null);
const weatherError = ref(false);
const loading = ref(false);
function togglePanel() {
    panelVisible.value = !panelVisible.value;
}
async function selectCity(city) {
    currentCity.value = city;
    panelVisible.value = false;
    localStorage.setItem(STORAGE_KEY, city);
    await loadWeather();
}
async function loadWeather() {
    loading.value = true;
    weatherError.value = false;
    try {
        weather.value = await weatherApi.now(currentCity.value);
        forecast.value = await weatherApi.forecast(currentCity.value, 7);
    }
    catch (e) {
        weatherError.value = true;
        ElMessage.error(e?.message || '天气服务不可用');
    }
    finally {
        loading.value = false;
    }
}
onMounted(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved)
        currentCity.value = saved;
    await loadWeather();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "weather-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.togglePanel) },
    ...{ class: "city-selector" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "city-name" },
});
(__VLS_ctx.currentCity);
const __VLS_0 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "arrow" },
    ...{ class: ({ open: __VLS_ctx.panelVisible }) },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "arrow" },
    ...{ class: ({ open: __VLS_ctx.panelVisible }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ArrowDown;
/** @type {[typeof __VLS_components.ArrowDown, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
if (__VLS_ctx.panelVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "city-panel" },
    });
    /** @type {[typeof CityPicker, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(CityPicker, new CityPicker({
        ...{ 'onSelect': {} },
        currentCity: (__VLS_ctx.currentCity),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onSelect': {} },
        currentCity: (__VLS_ctx.currentCity),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = {
        onSelect: (__VLS_ctx.selectCity)
    };
    var __VLS_10;
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-wrap" },
    });
    const __VLS_15 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        shadow: "hover",
    }));
    const __VLS_17 = __VLS_16({
        shadow: "hover",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    __VLS_18.slots.default;
    const __VLS_19 = {}.ElSkeleton;
    /** @type {[typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        rows: (4),
        animated: true,
    }));
    const __VLS_21 = __VLS_20({
        rows: (4),
        animated: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    var __VLS_18;
}
else if (__VLS_ctx.weather) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "weather-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "city" },
    });
    (__VLS_ctx.currentCity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "temp" },
    });
    (__VLS_ctx.weather.now?.temp ?? '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "desc" },
    });
    (__VLS_ctx.weather.now?.text || '未知');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "details" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.weather.now?.humidity ?? '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.weather.now?.windDir || '--');
    (__VLS_ctx.weather.now?.windScale ?? '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.weather.now?.feelsLike ?? '--');
}
if (__VLS_ctx.forecast) {
    const __VLS_23 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ...{ class: "forecast-card" },
        shadow: "hover",
    }));
    const __VLS_25 = __VLS_24({
        ...{ class: "forecast-card" },
        shadow: "hover",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_26.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "card-title" },
    });
    for (const [d] of __VLS_getVForSourceType((__VLS_ctx.forecast.daily))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (d.fxDate),
            ...{ class: "forecast-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "date" },
        });
        (d.fxDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "temp-range" },
        });
        (d.tempMax);
        (d.tempMin);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text" },
        });
        (d.textDay);
    }
    var __VLS_26;
}
if (__VLS_ctx.weatherError) {
    const __VLS_27 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        ...{ class: "error-card" },
    }));
    const __VLS_29 = __VLS_28({
        ...{ class: "error-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    __VLS_30.slots.default;
    const __VLS_31 = {}.ElResult;
    /** @type {[typeof __VLS_components.ElResult, typeof __VLS_components.elResult, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        icon: "warning",
        title: "天气服务不可用",
        subTitle: "请稍后重试或联系管理员配置天气服务",
    }));
    const __VLS_33 = __VLS_32({
        icon: "warning",
        title: "天气服务不可用",
        subTitle: "请稍后重试或联系管理员配置天气服务",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    var __VLS_30;
}
/** @type {__VLS_StyleScopedClasses['weather-page']} */ ;
/** @type {__VLS_StyleScopedClasses['city-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['city-name']} */ ;
/** @type {__VLS_StyleScopedClasses['arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['city-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['weather-card']} */ ;
/** @type {__VLS_StyleScopedClasses['city']} */ ;
/** @type {__VLS_StyleScopedClasses['temp']} */ ;
/** @type {__VLS_StyleScopedClasses['desc']} */ ;
/** @type {__VLS_StyleScopedClasses['details']} */ ;
/** @type {__VLS_StyleScopedClasses['forecast-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['forecast-item']} */ ;
/** @type {__VLS_StyleScopedClasses['date']} */ ;
/** @type {__VLS_StyleScopedClasses['temp-range']} */ ;
/** @type {__VLS_StyleScopedClasses['text']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ArrowDown: ArrowDown,
            CityPicker: CityPicker,
            currentCity: currentCity,
            panelVisible: panelVisible,
            weather: weather,
            forecast: forecast,
            weatherError: weatherError,
            loading: loading,
            togglePanel: togglePanel,
            selectCity: selectCity,
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