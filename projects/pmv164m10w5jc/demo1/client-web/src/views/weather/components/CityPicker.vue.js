import { ref, computed, watch, onMounted } from 'vue';
import { weatherApi } from '@/api';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { HOT_CITIES, filterCities, getProvinceList } from '@/utils/cities';
const props = defineProps();
const emit = defineEmits();
const keyword = ref('');
const allCities = ref([]);
const grouped = ref({});
const activeProvince = ref('北京');
const loaded = ref(false);
const hotCities = HOT_CITIES;
const searchResults = computed(() => filterCities(allCities.value, keyword.value));
const provinceList = computed(() => getProvinceList(grouped.value));
const currentProvinceCities = computed(() => grouped.value[activeProvince.value] || []);
async function loadCities() {
    if (loaded.value)
        return;
    try {
        const data = await weatherApi.allCities();
        allCities.value = data.cities || [];
        grouped.value = data.grouped || {};
        loaded.value = true;
    }
    catch (e) {
        ElMessage.error(e?.message || '城市数据加载失败');
    }
}
function onSelect(city) {
    emit('select', city.city_name);
}
function onSelectByName(name) {
    emit('select', name);
}
watch(keyword, (val) => {
    if (val && !loaded.value)
        loadCities();
});
onMounted(() => loadCities());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "city-picker" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索城市（支持拼音）",
    clearable: true,
    ...{ class: "search-input" },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索城市（支持拼音）",
    clearable: true,
    ...{ class: "search-input" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_4 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
    const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    const __VLS_8 = {}.Search;
    /** @type {[typeof __VLS_components.Search, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
    var __VLS_7;
}
var __VLS_3;
if (__VLS_ctx.keyword) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "search-result" },
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.searchResults))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.keyword))
                        return;
                    __VLS_ctx.onSelect(c);
                } },
            key: (c.city_id),
            ...{ class: "city-item" },
            ...{ class: ({ active: c.city_name === __VLS_ctx.currentCity }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "name" },
        });
        (c.city_name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "province" },
        });
        (c.province);
    }
    if (!__VLS_ctx.searchResults.length) {
        const __VLS_12 = {}.ElEmpty;
        /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            description: "无匹配城市",
            imageSize: (50),
        }));
        const __VLS_14 = __VLS_13({
            description: "无匹配城市",
            imageSize: (50),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hot-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hot-list" },
    });
    for (const [h] of __VLS_getVForSourceType((__VLS_ctx.hotCities))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.keyword))
                        return;
                    __VLS_ctx.onSelectByName(h);
                } },
            key: (h),
            ...{ class: "hot-item" },
            ...{ class: ({ active: h === __VLS_ctx.currentCity }) },
        });
        (h);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "province-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "province-tabs" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.provinceList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.keyword))
                        return;
                    __VLS_ctx.activeProvince = p;
                } },
            key: (p),
            ...{ class: "province-tab" },
            ...{ class: ({ active: p === __VLS_ctx.activeProvince }) },
        });
        (p);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "city-grid" },
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.currentProvinceCities))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.keyword))
                        return;
                    __VLS_ctx.onSelect(c);
                } },
            key: (c.city_id),
            ...{ class: "grid-item" },
            ...{ class: ({ active: c.city_name === __VLS_ctx.currentCity }) },
        });
        (c.city_name);
    }
    if (!__VLS_ctx.currentProvinceCities.length) {
        const __VLS_16 = {}.ElEmpty;
        /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            description: "无城市",
            imageSize: (40),
        }));
        const __VLS_18 = __VLS_17({
            description: "无城市",
            imageSize: (40),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    }
}
/** @type {__VLS_StyleScopedClasses['city-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-result']} */ ;
/** @type {__VLS_StyleScopedClasses['city-item']} */ ;
/** @type {__VLS_StyleScopedClasses['name']} */ ;
/** @type {__VLS_StyleScopedClasses['province']} */ ;
/** @type {__VLS_StyleScopedClasses['hot-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['hot-list']} */ ;
/** @type {__VLS_StyleScopedClasses['hot-item']} */ ;
/** @type {__VLS_StyleScopedClasses['province-section']} */ ;
/** @type {__VLS_StyleScopedClasses['province-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['province-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['city-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Search: Search,
            keyword: keyword,
            activeProvince: activeProvince,
            hotCities: hotCities,
            searchResults: searchResults,
            provinceList: provinceList,
            currentProvinceCities: currentProvinceCities,
            onSelect: onSelect,
            onSelectByName: onSelectByName,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=CityPicker.vue.js.map