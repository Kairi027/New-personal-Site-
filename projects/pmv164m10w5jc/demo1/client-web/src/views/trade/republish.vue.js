import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { tradeApi, fileApi } from '@/api';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const imageUrls = ref([]);
const isViolated = ref(false);
const original = ref(null);
const form = reactive({ title: '', description: '', price: 0.01, stock: 1, image_urls: [], contact: '' });
onMounted(async () => {
    try {
        const data = await tradeApi.getDetail(route.params.id);
        form.title = data.title;
        form.description = data.description || '';
        form.price = data.price;
        form.stock = data.stock || 1;
        form.contact = data.contact || '';
        imageUrls.value = data.image_urls || [];
        isViolated.value = data.status === 'violated';
        original.value = {
            title: data.title,
            description: data.description || '',
            price: data.price,
            stock: data.stock || 1,
            contact: data.contact || '',
            image_urls: [...(data.image_urls || [])],
        };
    }
    catch (e) {
        ElMessage.error('加载失败');
        router.replace('/trade');
    }
});
async function handleFileChange(file) {
    if (file.status !== 'ready')
        return;
    try {
        const data = await fileApi.upload(file.raw);
        imageUrls.value.push(data.url);
    }
    catch (e) {
        ElMessage.error('图片上传失败');
    }
}
function handleRemove(file) {
    const idx = imageUrls.value.indexOf(file.url);
    if (idx > -1)
        imageUrls.value.splice(idx, 1);
}
function checkContentModified() {
    if (!original.value)
        return true;
    const o = original.value;
    if (form.title !== o.title)
        return true;
    if (form.description !== o.description)
        return true;
    if (form.price !== o.price)
        return true;
    if (form.stock !== o.stock)
        return true;
    if (form.contact !== o.contact)
        return true;
    const curr = [...imageUrls.value].sort();
    const orig = [...o.image_urls].sort();
    if (curr.length !== orig.length)
        return true;
    if (curr.some((v, i) => v !== orig[i]))
        return true;
    return false;
}
async function submit() {
    if (!form.title) {
        ElMessage.warning('请填写商品名称');
        return;
    }
    if (!imageUrls.value.length) {
        ElMessage.warning('请至少上传一张图片');
        return;
    }
    if (!form.contact) {
        ElMessage.warning('请填写联系方式');
        return;
    }
    if (isViolated.value && !checkContentModified()) {
        ElMessage.warning('违规商品需修改内容后才能重新发布');
        return;
    }
    loading.value = true;
    try {
        form.image_urls = imageUrls.value;
        const res = await tradeApi.republishProduct(route.params.id, form);
        ElMessage.success(res?.status === 'pending' ? '已提交，待审核' : '已上架');
        router.replace('/trade');
    }
    catch (e) {
        ElMessage.error(e?.message || '发布失败');
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "republish-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.isViolated) {
    const __VLS_0 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        type: "warning",
        closable: (false),
        showIcon: true,
        title: "该商品因违规被下架，请修改商品内容后重新发布",
        ...{ style: {} },
    }));
    const __VLS_2 = __VLS_1({
        type: "warning",
        closable: (false),
        showIcon: true,
        title: "该商品因违规被下架，请修改商品内容后重新发布",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
const __VLS_4 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    labelWidth: "80px",
}));
const __VLS_6 = __VLS_5({
    labelWidth: "80px",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "商品名称",
}));
const __VLS_10 = __VLS_9({
    label: "商品名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.form.title),
    maxlength: "50",
    showWordLimit: true,
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.form.title),
    maxlength: "50",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
var __VLS_11;
const __VLS_16 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "商品图片",
}));
const __VLS_18 = __VLS_17({
    label: "商品图片",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElUpload;
/** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    onChange: (__VLS_ctx.handleFileChange),
    listType: "picture-card",
    onRemove: (__VLS_ctx.handleRemove),
    action: "#",
    autoUpload: (false),
    limit: (6),
}));
const __VLS_22 = __VLS_21({
    onChange: (__VLS_ctx.handleFileChange),
    listType: "picture-card",
    onRemove: (__VLS_ctx.handleRemove),
    action: "#",
    autoUpload: (false),
    limit: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.Plus;
/** @type {[typeof __VLS_components.Plus, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
var __VLS_27;
var __VLS_23;
var __VLS_19;
const __VLS_32 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "商品简介",
}));
const __VLS_34 = __VLS_33({
    label: "商品简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    modelValue: (__VLS_ctx.form.description),
    type: "textarea",
    rows: (4),
    maxlength: "1000",
    showWordLimit: true,
}));
const __VLS_38 = __VLS_37({
    modelValue: (__VLS_ctx.form.description),
    type: "textarea",
    rows: (4),
    maxlength: "1000",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
var __VLS_35;
const __VLS_40 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "价格(元)",
}));
const __VLS_42 = __VLS_41({
    label: "价格(元)",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.form.price),
    min: (0.01),
    max: (999999.99),
    precision: (2),
    ...{ style: {} },
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.form.price),
    min: (0.01),
    max: (999999.99),
    precision: (2),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_43;
const __VLS_48 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "库存数量",
}));
const __VLS_50 = __VLS_49({
    label: "库存数量",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.form.stock),
    min: (1),
    max: (999999),
    step: (1),
    ...{ style: {} },
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.form.stock),
    min: (1),
    max: (999999),
    step: (1),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_51;
const __VLS_56 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "联系方式",
}));
const __VLS_58 = __VLS_57({
    label: "联系方式",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.form.contact),
    placeholder: "手机号/微信/QQ",
    maxlength: "128",
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.form.contact),
    placeholder: "手机号/微信/QQ",
    maxlength: "128",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
var __VLS_59;
const __VLS_64 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_68;
let __VLS_69;
let __VLS_70;
const __VLS_71 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_67.slots.default;
var __VLS_67;
var __VLS_7;
/** @type {__VLS_StyleScopedClasses['republish-page']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Plus: Plus,
            loading: loading,
            isViolated: isViolated,
            form: form,
            handleFileChange: handleFileChange,
            handleRemove: handleRemove,
            submit: submit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=republish.vue.js.map