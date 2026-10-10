/* ==========================================================================
   文章互动：点赞 + 评论

   数据来源：
   - 文件：js/social-data.js（本地服务从 data/social.json 生成），所有人可见
   - 降级：服务没启动时，点赞与评论只存在本机浏览器，并在界面上标明
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  if (!S) return;

  var esc = S.escapeHtml;
  var LOCAL_COMMENTS = 'kairi_local_comments';

  function likedKey(articleId) {
    return 'kairi_liked_' + articleId;
  }

  function isLiked(articleId) {
    try { return window.localStorage.getItem(likedKey(articleId)) === '1'; } catch (err) { return false; }
  }

  function setLiked(articleId, value) {
    try {
      if (value) window.localStorage.setItem(likedKey(articleId), '1');
      else window.localStorage.removeItem(likedKey(articleId));
    } catch (err) { /* 忽略 */ }
  }

  function readLocalComments() {
    return S.readJSON(LOCAL_COMMENTS, {}) || {};
  }

  function writeLocalComment(articleId, item) {
    var all = readLocalComments();
    if (!all[articleId]) all[articleId] = [];
    all[articleId].push(item);
    S.writeJSON(LOCAL_COMMENTS, all);
  }

  function serverEntry(articleId) {
    var data = window.KAIRI_SOCIAL;
    if (!data || !data.articles) return null;
    return data.articles[articleId] || null;
  }

  function formatTime(ms) {
    if (!ms) return '';
    var d = new Date(ms);
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function replyHtml(reply) {
    return '' +
      '<li class="reply" data-id="' + esc(reply.id) + '">' +
        '<div class="reply__head">' +
          '<span class="reply__author">' + esc(reply.author || '站长') + '</span>' +
          '<span class="comment__time">' + esc(formatTime(reply.at)) + '</span>' +
        '</div>' +
        '<p class="reply__text">' + esc(reply.text) + '</p>' +
      '</li>';
  }

  function commentHtml(item, canDelete, canReply) {
    var replies = item.replies || [];
    return '' +
      '<li class="comment" data-id="' + esc(item.id) + '">' +
        '<div class="comment__head">' +
          '<span class="comment__author">' + esc(item.author || '匿名访客') + '</span>' +
          '<span class="comment__time">' + esc(formatTime(item.at)) + '</span>' +
          (item.local ? '<span class="comment__local">仅本机</span>' : '') +
          (canReply ? '<button class="comment__reply" type="button">回复</button>' : '') +
          (canDelete ? '<button class="comment__del" type="button" aria-label="删除评论">×</button>' : '') +
        '</div>' +
        '<p class="comment__text">' + esc(item.text) + '</p>' +
        (replies.length
          ? '<ul class="replies">' + replies.map(replyHtml).join('') + '</ul>'
          : '') +
        (canReply
          ? '<div class="reply-form" hidden>' +
              '<textarea class="field__input" rows="2" maxlength="2000" placeholder="回复这条评论…"></textarea>' +
              '<div class="reply-form__foot">' +
                '<button class="btn btn--primary btn--tiny" type="button" data-reply-send>发送回复</button>' +
              '</div>' +
            '</div>'
          : '') +
      '</li>';
  }

  /* 等本地服务探测有结果之后再画，否则会误判成"服务未启动" */
  function render(host, articleId) {
    var service = window.KairiService;
    if (service && service.ready) {
      service.ready().then(function () { draw(host, articleId); });
      return;
    }
    draw(host, articleId);
  }

  function draw(host, articleId) {
    if (!host) return;

    var canEdit = !!(window.KairiAuth && window.KairiAuth.canEdit());
    var online = window.KairiService && window.KairiService.available();
    var entry = serverEntry(articleId) || { likes: 0, comments: [] };
    var localComments = (readLocalComments()[articleId] || []).map(function (item) {
      var copy = Object.assign({}, item);
      copy.local = true;
      return copy;
    });
    var comments = (entry.comments || []).concat(localComments);
    var liked = isLiked(articleId);
    var likes = Number(entry.likes || 0) + (online ? 0 : (liked ? 1 : 0));

    host.innerHTML =
      '<section class="social">' +
        '<div class="social__bar">' +
          '<button class="like' + (liked ? ' is-on' : '') + '" type="button" id="likeBtn" aria-pressed="' + (liked ? 'true' : 'false') + '">' +
            '<span class="like__heart" aria-hidden="true">♥</span>' +
            '<span class="like__count" id="likeCount">' + likes + '</span>' +
            '<span class="like__label">' + (liked ? '已点赞' : '点赞') + '</span>' +
          '</button>' +
          '<span class="social__note" id="socialNote">' +
            (online ? '赞和评论会保存到博客里，别人也看得到' : '本地服务未启动：赞和评论只保存在本机浏览器') +
          '</span>' +
        '</div>' +

        '<h2 class="social__title">评论 <span id="commentCount">' + comments.length + '</span></h2>' +
        '<ul class="comments" id="commentList">' +
          (comments.length
            ? comments.map(function (item) {
                return commentHtml(item, canEdit && !item.local, canEdit && online && !item.local);
              }).join('')
            : '<li class="comments__empty">还没有人评论，来说两句吧。</li>') +
        '</ul>' +

        '<form class="comment-form" id="commentForm" autocomplete="off">' +
          '<input class="field__input" id="commentAuthor" type="text" maxlength="40" placeholder="你的昵称（可留空）" />' +
          '<textarea class="field__input" id="commentText" rows="3" maxlength="2000" placeholder="写点评论…"></textarea>' +
          '<div class="comment-form__foot">' +
            '<span class="comment-form__hint">' + (online ? '' : '服务未启动，评论只保存在本机') + '</span>' +
            '<button class="btn btn--primary btn--small" type="submit">发表评论</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var likeBtn = host.querySelector('#likeBtn');
    var likeCount = host.querySelector('#likeCount');
    var note = host.querySelector('#socialNote');
    var list = host.querySelector('#commentList');
    var countEl = host.querySelector('#commentCount');
    var form = host.querySelector('#commentForm');

    likeBtn.addEventListener('click', function () {
      var nowLiked = !isLiked(articleId);
      setLiked(articleId, nowLiked);
      likeBtn.classList.toggle('is-on', nowLiked);
      likeBtn.setAttribute('aria-pressed', nowLiked ? 'true' : 'false');
      likeBtn.querySelector('.like__label').textContent = nowLiked ? '已点赞' : '点赞';

      if (online) {
        window.KairiService.like(articleId, nowLiked ? 1 : -1).then(function (result) {
          likeCount.textContent = String(result.likes);
        }).catch(function () {
          note.textContent = '点赞没能保存到服务，请确认本地服务在运行';
        });
      } else {
        var base = Number((serverEntry(articleId) || {}).likes || 0);
        likeCount.textContent = String(base + (nowLiked ? 1 : 0));
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var author = form.querySelector('#commentAuthor').value.trim();
      var text = form.querySelector('#commentText').value.trim();
      if (!text) {
        S.toast('评论内容不能为空', 'warn');
        return;
      }

      if (online) {
        window.KairiService.comment(articleId, author, text).then(function (result) {
          var item = result.comment;
          if (!entry.comments) entry.comments = [];
          entry.comments.push(item);
          appendComment(item, false);
          form.reset();
          S.toast('评论已发表');
        }).catch(function (err) {
          S.toast((err && err.message) || '评论发表失败', 'warn');
        });
        return;
      }

      var local = {
        id: 'c-local-' + Date.now().toString(36),
        author: author || '匿名访客',
        text: text,
        at: Date.now()
      };
      writeLocalComment(articleId, local);
      appendComment(local, true);
      form.reset();
      S.toast('已发表（服务未启动，只有本机能看到）', 'warn');
    });

    function appendComment(item, isLocal) {
      var empty = list.querySelector('.comments__empty');
      if (empty) empty.remove();
      var holder = document.createElement('div');
      holder.innerHTML = commentHtml(item, canEdit && !isLocal, canEdit && online && !isLocal);
      list.appendChild(holder.firstElementChild);
      countEl.textContent = String(list.querySelectorAll('.comment').length);
    }

    list.addEventListener('click', function (event) {
      var target = event.target;
      if (!target.closest) return;

      /* 回复：展开/收起输入框 */
      var replyBtn = target.closest('.comment__reply');
      if (replyBtn) {
        var box = replyBtn.closest('.comment').querySelector('.reply-form');
        if (!box) return;
        box.hidden = !box.hidden;
        if (!box.hidden) box.querySelector('textarea').focus();
        return;
      }

      /* 发送回复 */
      var sendBtn = target.closest('[data-reply-send]');
      if (sendBtn) {
        var comment = sendBtn.closest('.comment');
        var commentId = comment.getAttribute('data-id');
        var textarea = comment.querySelector('.reply-form textarea');
        var text = textarea.value.trim();
        if (!text) {
          S.toast('回复内容不能为空', 'warn');
          return;
        }
        sendBtn.disabled = true;
        window.KairiService.reply(articleId, commentId, text).then(function (result) {
          var holder = document.createElement('div');
          holder.innerHTML = replyHtml(result.reply);
          var wrap = comment.querySelector('.replies');
          if (!wrap) {
            wrap = document.createElement('ul');
            wrap.className = 'replies';
            comment.insertBefore(wrap, comment.querySelector('.reply-form'));
          }
          wrap.appendChild(holder.firstElementChild);
          textarea.value = '';
          comment.querySelector('.reply-form').hidden = true;
          S.toast('已回复');
        }).catch(function (err) {
          S.toast((err && err.message) || '回复失败', 'warn');
        }).then(function () {
          sendBtn.disabled = false;
        });
        return;
      }

      /* 删除评论（连同它的回复） */
      var delBtn = target.closest('.comment__del');
      if (!delBtn) return;
      var node = delBtn.closest('.comment');
      var id = node.getAttribute('data-id');
      S.confirm({
        title: '删除评论',
        message: '确定删除这条评论吗？它下面的回复会一起删掉。',
        okText: '删除',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        window.KairiService.deleteComment(articleId, id).then(function () {
          node.remove();
          countEl.textContent = String(list.querySelectorAll('.comment').length);
          if (!list.querySelectorAll('.comment').length) {
            list.innerHTML = '<li class="comments__empty">还没有人评论，来说两句吧。</li>';
          }
          S.toast('评论已删除');
        }).catch(function (err) {
          S.toast((err && err.message) || '删除失败', 'warn');
        });
      });
    });
  }

  /* 文章列表/卡片上显示的赞数、评论数 */
  function summary(articleId) {
    var entry = serverEntry(articleId) || {};
    var local = (readLocalComments()[articleId] || []).length;
    return {
      likes: Number(entry.likes || 0) + (isLiked(articleId) && !window.KairiService.available() ? 1 : 0),
      comments: (entry.comments || []).length + local
    };
  }

  window.KairiSocial = {
    render: render,
    summary: summary
  };
})();
