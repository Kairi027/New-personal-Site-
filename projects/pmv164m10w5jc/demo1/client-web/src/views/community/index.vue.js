import { ref, onMounted } from 'vue';
import { communityApi } from '@/api';
import dayjs from 'dayjs';
const posts = ref([]);
const sections = ref([]);
const currentSection = ref('');
onMounted(async () => {
    try {
        sections.value = await communityApi.listSections() || [];
    }
    catch (e) { /* ignore */ }
    await loadPosts();
});
async function loadPosts() {
    try {
        const data = await communityApi.listPosts(currentSection.value, 1, 50);
        posts.value = data.items || [];
    }
    catch (e) { /* 未登录或无数据 */ }
}
function switchSection(sid) {
    currentSection.value = sid;
    loadPosts();
}
function sectionName(sid) {
    const s = sections.value.find(x => x.section_id === sid);
    return s ? s.name : '';
}
function formatTime(t) { return dayjs(t).format('MM-DD HH:mm'); }
async function handleLike(post) {
    if (post.liked) {
        await communityApi.unlike(post.post_id);
        post.liked = false;
        post.like_count--;
    }
    else {
        await communityApi.toggleLike(post.post_id);
        post.liked = true;
        post.like_count++;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "community-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
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
        __VLS_ctx.$router.push('/post/create');
    }
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.switchSection('');
        } },
    ...{ class: (['tab', { active: __VLS_ctx.currentSection === '' }]) },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sections))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchSection(s.section_id);
            } },
        key: (s.section_id),
        ...{ class: (['tab', { active: __VLS_ctx.currentSection === s.section_id }]) },
    });
    (s.name);
}
for (const [post] of __VLS_getVForSourceType((__VLS_ctx.posts))) {
    const __VLS_8 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        key: (post.post_id),
        ...{ class: "post-card" },
        shadow: "hover",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        key: (post.post_id),
        ...{ class: "post-card" },
        shadow: "hover",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (...[$event]) => {
            __VLS_ctx.$router.push(`/post/${post.post_id}`);
        }
    };
    __VLS_11.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "post-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "author" },
    });
    (post.author_name);
    if (__VLS_ctx.sectionName(post.section_id)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "section-tag" },
        });
        (__VLS_ctx.sectionName(post.section_id));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "time" },
    });
    (__VLS_ctx.formatTime(post.created_at));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
        ...{ class: "post-title" },
    });
    (post.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "post-content" },
    });
    (post.content);
    if (post.image_urls?.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "post-images" },
        });
        for (const [url, i] of __VLS_getVForSourceType((post.image_urls.slice(0, 3)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                key: (i),
                src: (url),
                ...{ class: "post-img" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "post-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleLike(post);
            } },
    });
    (post.like_count);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (post.comment_count);
    var __VLS_11;
}
if (!__VLS_ctx.posts.length) {
    const __VLS_16 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        description: "暂无帖子",
    }));
    const __VLS_18 = __VLS_17({
        description: "暂无帖子",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
/** @type {__VLS_StyleScopedClasses['community-page']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['post-card']} */ ;
/** @type {__VLS_StyleScopedClasses['post-header']} */ ;
/** @type {__VLS_StyleScopedClasses['author']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['time']} */ ;
/** @type {__VLS_StyleScopedClasses['post-title']} */ ;
/** @type {__VLS_StyleScopedClasses['post-content']} */ ;
/** @type {__VLS_StyleScopedClasses['post-images']} */ ;
/** @type {__VLS_StyleScopedClasses['post-img']} */ ;
/** @type {__VLS_StyleScopedClasses['post-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            posts: posts,
            sections: sections,
            currentSection: currentSection,
            switchSection: switchSection,
            sectionName: sectionName,
            formatTime: formatTime,
            handleLike: handleLike,
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