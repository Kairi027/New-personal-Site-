import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { communityApi } from '@/api';
import dayjs from 'dayjs';
const route = useRoute();
const router = useRouter();
const post = ref(null);
const comments = ref([]);
const commentText = ref('');
const submitting = ref(false);
onMounted(async () => {
    const postId = route.params.id;
    try {
        post.value = await communityApi.getPost(postId);
    }
    catch (e) {
        ElMessage.error('帖子加载失败');
        router.back();
    }
    try {
        const data = await communityApi.getComments(postId);
        comments.value = data.items || data || [];
    }
    catch (e) { /* 暂无评论 */ }
});
function formatTime(t) { return dayjs(t).format('MM-DD HH:mm'); }
async function handleLike() {
    if (!post.value)
        return;
    try {
        if (post.value.liked) {
            await communityApi.unlike(post.value.post_id);
            post.value.liked = false;
            post.value.like_count--;
        }
        else {
            await communityApi.toggleLike(post.value.post_id);
            post.value.liked = true;
            post.value.like_count++;
        }
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
}
async function submitComment() {
    if (!commentText.value.trim())
        return;
    submitting.value = true;
    try {
        const data = await communityApi.createComment(post.value.post_id, commentText.value.trim());
        comments.value.push({ ...data, author_name: '我', created_at: new Date().toISOString() });
        commentText.value = '';
        if (post.value)
            post.value.comment_count++;
    }
    catch (e) {
        if (e?.message)
            ElMessage.error(e.message);
    }
    finally {
        submitting.value = false;
    }
}
function previewImage(url) { window.open(url, '_blank'); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.post) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-page" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "post-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "post-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "author" },
    });
    (__VLS_ctx.post.author_name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "time" },
    });
    (__VLS_ctx.formatTime(__VLS_ctx.post.created_at));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "post-title" },
    });
    (__VLS_ctx.post.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "post-content" },
    });
    (__VLS_ctx.post.content);
    if (__VLS_ctx.post.image_urls?.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "post-images" },
        });
        for (const [url, i] of __VLS_getVForSourceType((__VLS_ctx.post.image_urls))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.post))
                            return;
                        if (!(__VLS_ctx.post.image_urls?.length))
                            return;
                        __VLS_ctx.previewImage(url);
                    } },
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
        ...{ onClick: (__VLS_ctx.handleLike) },
        ...{ class: ({ liked: __VLS_ctx.post.liked }) },
    });
    (__VLS_ctx.post.liked ? '❤️' : '🤍');
    (__VLS_ctx.post.like_count);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.post.comment_count);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "comments-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.comments.length);
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.comments))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comment-item" },
            key: (c.comment_id),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comment-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "comment-author" },
        });
        (c.author_name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "comment-time" },
        });
        (__VLS_ctx.formatTime(c.created_at));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "comment-content" },
        });
        (c.content);
    }
    if (!__VLS_ctx.comments.length) {
        const __VLS_0 = {}.ElEmpty;
        /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            description: "暂无评论",
            imageSize: (60),
        }));
        const __VLS_2 = __VLS_1({
            description: "暂无评论",
            imageSize: (60),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "comment-input-bar" },
    });
    const __VLS_4 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.commentText),
        placeholder: "写评论...",
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.commentText),
        placeholder: "写评论...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onKeyup: (__VLS_ctx.submitComment)
    };
    var __VLS_7;
    const __VLS_12 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_16;
    let __VLS_17;
    let __VLS_18;
    const __VLS_19 = {
        onClick: (__VLS_ctx.submitComment)
    };
    __VLS_15.slots.default;
    var __VLS_15;
}
else {
    const __VLS_20 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        description: "加载中...",
    }));
    const __VLS_22 = __VLS_21({
        description: "加载中...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    var __VLS_24 = {};
    var __VLS_23;
}
/** @type {__VLS_StyleScopedClasses['detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['post-card']} */ ;
/** @type {__VLS_StyleScopedClasses['post-header']} */ ;
/** @type {__VLS_StyleScopedClasses['author']} */ ;
/** @type {__VLS_StyleScopedClasses['time']} */ ;
/** @type {__VLS_StyleScopedClasses['post-title']} */ ;
/** @type {__VLS_StyleScopedClasses['post-content']} */ ;
/** @type {__VLS_StyleScopedClasses['post-images']} */ ;
/** @type {__VLS_StyleScopedClasses['post-img']} */ ;
/** @type {__VLS_StyleScopedClasses['post-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['comments-section']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-item']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-header']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-author']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-time']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-content']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-input-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            post: post,
            comments: comments,
            commentText: commentText,
            submitting: submitting,
            formatTime: formatTime,
            handleLike: handleLike,
            submitComment: submitComment,
            previewImage: previewImage,
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