/* ==========================================================================
   文章：数据读写、Markdown 渲染、列表 / 阅读 / 编辑器 / 导入导出
   同一个文件服务 index.html（最新文章）、articles.html（管理）、article.html（阅读）
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  if (!S) return;

  var esc = S.escapeHtml;
  var STORE_KEY = 'kairi_posts_v1';
  /* 内存里的权威列表：页面打开后所有读写都走它，
     这样新建 / 编辑 / 删除 / 导入之后列表能立刻更新，不用整页刷新。 */
  var current = null;

  /* ---------------------------------------------------------------------
     数据层
     --------------------------------------------------------------------- */

  function normalize(raw) {
    raw = raw || {};
    return {
      id: String(raw.id || 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      title: String(raw.title || '无标题'),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date || '')) ? String(raw.date) : S.todayISO(),
      tags: Array.isArray(raw.tags)
        ? raw.tags.map(function (t) { return String(t).trim(); }).filter(Boolean)
        : String(raw.tags || '').split(/[,，、]/).map(function (t) { return t.trim(); }).filter(Boolean),
      summary: String(raw.summary || ''),
      body: String(raw.body == null ? '' : raw.body)
    };
  }

  function seedList() {
    var src = window.KAIRI_DEFAULT_POSTS || [];
    return src.map(normalize);
  }

  function saveList(list) {
    current = (list || []).slice();
    // 先写浏览器本地，保证界面立刻正确
    S.writeJSON(STORE_KEY, current);
    // 服务在跑就同步写进 js/articles-data.js，这样文章能随文件夹传播
    var service = window.KairiService;
    if (service && service.ready) {
      return service.ready().then(function (ok) {
        if (!ok) return false;
        // 闭包里读 current，连续保存时最后落盘的总是最新内容
        return service.writeDataFile('articles', articlesFileText(current)).catch(function () { return false; });
      });
    }
    return Promise.resolve(false);
  }

  function articlesFileText(list) {
    return '/* 由「开发者模式 · 文章管理」自动生成，请勿手改 */\n\n' +
      'window.KAIRI_ARTICLES = ' + JSON.stringify(list, null, 2) + ';\n';
  }

  /* 文件里的文章（服务写出来的那份）；空数组表示还没写过 */
  function fileArticles() {
    var list = window.KAIRI_ARTICLES;
    return Array.isArray(list) && list.length ? list.map(normalize) : null;
  }

  function loadList() {
    if (current) return current;

    var fromFile = fileArticles();
    if (fromFile) {
      current = fromFile;
      return current;
    }

    var stored = S.readJSON(STORE_KEY, null);
    // 关键：要区分「还没初始化过」和「用户主动把文章删光了」。
    // 只有前者才播种默认文章；空数组必须原样保留，否则删完一刷新又全冒出来。
    if (stored === null || typeof stored === 'undefined') {
      var seeded = seedList();
      saveList(seeded);
      return current;
    }
    current = Array.isArray(stored) ? stored.map(normalize) : [];
    return current;
  }

  /* 把最初自带的示例文章补回来（只补缺失的，不会覆盖或删除你自己的文章） */
  function restoreDefaults() {
    var list = loadList();
    var existing = {};
    list.forEach(function (item) { existing[item.id] = true; });
    var added = 0;
    seedList().forEach(function (item) {
      if (!existing[item.id]) {
        list.push(item);
        existing[item.id] = true;
        added++;
      }
    });
    if (added) saveList(list);
    return added;
  }

  function sortedList() {
    return loadList().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });
  }

  function findById(id) {
    var list = loadList();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function upsert(article) {
    var list = loadList();
    var index = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === article.id) { index = i; break; }
    }
    if (index >= 0) list[index] = article;
    else list.push(article);
    saveList(list);
  }

  function remove(id) {
    var list = loadList().filter(function (item) { return item.id !== id; });
    saveList(list);
  }

  function readMinutes(body) {
    var chars = String(body || '').replace(/\s+/g, '').length;
    return Math.max(1, Math.round(chars / 400));
  }

  /* ---------------------------------------------------------------------
     轻量 Markdown（先转义，再套用少量语法）
     --------------------------------------------------------------------- */

  function inlineFormat(text) {
    var codes = [];
    text = text.replace(/`([^`]+)`/g, function (m, code) {
      codes.push(code);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });

    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
      if (!/^(https?:|mailto:|#|\.{1,2}\/|\/)/i.test(url)) return label;
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });

    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    text = text.replace(/\u0000(\d+)\u0000/g, function (m, idx) {
      return '<code>' + codes[Number(idx)] + '</code>';
    });
    return text;
  }

  function markdownToHtml(source) {
    var lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var para = [];
    var i = 0;

    function flushPara() {
      if (para.length) {
        out.push('<p>' + para.join('<br>') + '</p>');
        para = [];
      }
    }

    while (i < lines.length) {
      var line = lines[i];
      var trimmed = line.trim();

      if (/^```/.test(trimmed)) {
        flushPara();
        var buffer = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          buffer.push(lines[i]);
          i++;
        }
        i++;
        out.push('<pre class="md-code"><code>' + esc(buffer.join('\n')) + '</code></pre>');
        continue;
      }

      if (!trimmed) {
        flushPara();
        i++;
        continue;
      }

      var heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (heading) {
        flushPara();
        var level = Math.min(6, heading[1].length);
        out.push('<h' + level + '>' + inlineFormat(esc(heading[2])) + '</h' + level + '>');
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushPara();
        out.push('<hr>');
        i++;
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        flushPara();
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quote.push(inlineFormat(esc(lines[i].replace(/^\s*>\s?/, ''))));
          i++;
        }
        out.push('<blockquote>' + quote.join('<br>') + '</blockquote>');
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        flushPara();
        var bullet = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          bullet.push('<li>' + inlineFormat(esc(lines[i].replace(/^\s*[-*+]\s+/, ''))) + '</li>');
          i++;
        }
        out.push('<ul>' + bullet.join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        flushPara();
        var ordered = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          ordered.push('<li>' + inlineFormat(esc(lines[i].replace(/^\s*\d+[.)]\s+/, ''))) + '</li>');
          i++;
        }
        out.push('<ol>' + ordered.join('') + '</ol>');
        continue;
      }

      para.push(inlineFormat(esc(trimmed)));
      i++;
    }

    flushPara();
    return out.join('\n');
  }

  /* ---------------------------------------------------------------------
     片段
     --------------------------------------------------------------------- */

  function tagChips(tags) {
    if (!tags || !tags.length) return '';
    return tags.map(function (tag) {
      return '<span class="chip">' + esc(tag) + '</span>';
    }).join('');
  }

  function socialMeta(articleId) {
    var data = window.KairiSocial
      ? window.KairiSocial.summary(articleId)
      : { likes: 0, comments: 0 };
    return '<span class="meta-social">♥ ' + data.likes + '</span>' +
      '<span class="card__sep">·</span>' +
      '<span class="meta-social">评论 ' + data.comments + '</span>';
  }

  function cardHtml(article) {
    var firstTag = (article.tags && article.tags[0]) || '随笔';
    return '' +
      '<article class="card reveal">' +
        '<span class="card__tag">' + esc(firstTag) + '</span>' +
        '<h3 class="card__title"><a href="article.html?id=' + encodeURIComponent(article.id) + '">' +
          esc(article.title) +
        '</a></h3>' +
        '<p class="card__excerpt">' + esc(article.summary || '（暂无摘要）') + '</p>' +
        '<footer class="card__meta">' +
          '<time datetime="' + esc(article.date) + '">' + esc(S.formatDate(article.date)) + '</time>' +
          '<span class="card__sep">·</span>' +
          '<span>约 ' + readMinutes(article.body) + ' 分钟</span>' +
          '<span class="card__sep">·</span>' +
          socialMeta(article.id) +
          '<span class="card__arrow" aria-hidden="true">→</span>' +
        '</footer>' +
      '</article>';
  }

  /* ---------------------------------------------------------------------
     index.html：最新文章
     --------------------------------------------------------------------- */

  var latestHost = document.getElementById('latestPosts');
  if (latestHost) {
    var latest = sortedList().slice(0, 3);
    latestHost.innerHTML = latest.length
      ? latest.map(cardHtml).join('')
      : '<p class="empty">还没有文章，去 <a href="articles.html">文章页</a> 写第一篇吧。</p>';
    if (S.revealNow) S.revealNow(latestHost);
  }

  var countHost = document.getElementById('articleCount');
  var statHost = document.getElementById('statPosts');
  if (countHost || statHost) {
    var total = String(loadList().length);
    if (countHost) countHost.textContent = total;
    if (statHost) statHost.textContent = total;
  }

  /* 本地服务在跑、但文件里还没有文章时，把现有文章（或默认文章）写进 js/articles-data.js */
  function publishArticlesOnce() {
    var service = window.KairiService;
    if (!service) return;
    if (Array.isArray(window.KAIRI_ARTICLES) && window.KAIRI_ARTICLES.length) return;
    try {
      if (window.localStorage.getItem('kairi_articles_published') === '1') return;
    } catch (err) {
      return;
    }
    service.ready().then(function (ok) {
      if (!ok) return;
      var list = loadList();
      if (!list.length) return null;
      return service.writeDataFile('articles', articlesFileText(list)).then(function () {
        try { window.localStorage.setItem('kairi_articles_published', '1'); } catch (err) { /* 忽略 */ }
        S.toast('已把现有文章同步到 js/articles-data.js，之后文章会随文件夹一起传播');
      });
    }).catch(function () { /* 服务不可用就算了 */ });
  }

  publishArticlesOnce();

  /* ---------------------------------------------------------------------
     article.html：阅读
     --------------------------------------------------------------------- */

  var reader = document.getElementById('articleReader');
  if (reader) {
    var wantedId = S.getParam('id');
    var article = wantedId ? findById(wantedId) : null;

    if (!article) {
      reader.innerHTML =
        '<div class="empty-state">' +
          '<p class="empty-state__title">没有找到这篇文章</p>' +
          '<p class="empty-state__text">它可能已被删除，或者你打开的是另一台设备上的链接。文章数据保存在浏览器的本地存储里。</p>' +
          '<a class="btn btn--primary" href="articles.html">回到文章列表</a>' +
        '</div>';
    } else {
      document.title = article.title + ' · Kairi 的小站';
      reader.innerHTML =
        '<header class="article__head">' +
          '<p class="article__kicker"><a href="articles.html">文章</a> / ' + esc(S.formatDate(article.date)) + '</p>' +
          '<h1 class="article__title">' + esc(article.title) + '</h1>' +
          '<p class="article__meta">' +
            '<time datetime="' + esc(article.date) + '">' + esc(S.formatDate(article.date)) + '</time>' +
            '<span class="card__sep">·</span><span>约 ' + readMinutes(article.body) + ' 分钟</span>' +
          '</p>' +
          (article.tags.length ? '<div class="article__tags">' + tagChips(article.tags) + '</div>' : '') +
        '</header>' +
        '<div class="article__body">' + markdownToHtml(article.body) + '</div>' +
        '<div id="articleSocial"></div>' +
        '<footer class="article__foot">' +
          '<a class="btn btn--ghost" href="articles.html">← 全部文章</a>' +
          ((window.KairiAuth && window.KairiAuth.canEdit())
            ? '<a class="btn btn--ghost" href="articles.html?edit=' + encodeURIComponent(article.id) + '">编辑这篇</a>'
            : '') +
        '</footer>';

      if (window.KairiSocial) {
        window.KairiSocial.render(document.getElementById('articleSocial'), article.id);
      }
    }
  }

  /* ---------------------------------------------------------------------
     articles.html：列表 + 编辑器 + 备份
     --------------------------------------------------------------------- */

  var listHost = document.getElementById('articleList');
  if (!listHost) return;

  /* 访客只能看，不能改 */
  var canEdit = !!(window.KairiAuth && window.KairiAuth.canEdit());
  var articleTools = document.getElementById('articleTools');
  if (articleTools && canEdit) articleTools.hidden = false;
  if (!canEdit) {
    var newButton = document.getElementById('newArticleBtn');
    if (newButton) newButton.closest('.toolbar').hidden = true;
  }

  var modal = document.getElementById('editorModal');
  var form = document.getElementById('editorForm');
  var fieldTitle = document.getElementById('fieldTitle');
  var fieldDate = document.getElementById('fieldDate');
  var fieldTags = document.getElementById('fieldTags');
  var fieldSummary = document.getElementById('fieldSummary');
  var fieldBody = document.getElementById('fieldBody');
  var editorHeading = document.getElementById('editorHeading');
  var editingId = null;

  function renderList() {
    var list = sortedList();
    if (!list.length) {
      listHost.innerHTML = '<p class="empty">' +
        (canEdit ? '还没有文章，点左上角「新建文章」开始写吧。' : '还没有文章。') +
        '</p>';
      return;
    }
    listHost.innerHTML = list.map(function (article) {
      return '' +
        '<article class="row reveal" data-id="' + esc(article.id) + '">' +
          '<div class="row__main">' +
            '<h3 class="row__title">' +
              '<a href="article.html?id=' + encodeURIComponent(article.id) + '">' + esc(article.title) + '</a>' +
            '</h3>' +
            '<p class="row__summary">' + esc(article.summary || '（暂无摘要）') + '</p>' +
            '<div class="row__meta">' +
              '<time datetime="' + esc(article.date) + '">' + esc(S.formatDate(article.date)) + '</time>' +
              '<span class="card__sep">·</span><span>约 ' + readMinutes(article.body) + ' 分钟</span>' +
              '<span class="card__sep">·</span>' + socialMeta(article.id) +
              (article.tags.length ? '<span class="card__sep">·</span>' + tagChips(article.tags) : '') +
            '</div>' +
          '</div>' +
          (canEdit
            ? '<div class="row__actions">' +
                '<button class="btn btn--tiny" type="button" data-action="edit">编辑</button>' +
                '<button class="btn btn--tiny btn--danger" type="button" data-action="delete">删除</button>' +
              '</div>'
            : '') +
        '</article>';
    }).join('');
    if (S.revealNow) S.revealNow(listHost);
  }

  function openEditor(article) {
    if (!canEdit) return;
    editingId = article ? article.id : null;
    editorHeading.textContent = article ? '编辑文章' : '新建文章';
    fieldTitle.value = article ? article.title : '';
    fieldDate.value = article ? article.date : S.todayISO();
    fieldTags.value = article ? article.tags.join(', ') : '';
    fieldSummary.value = article ? article.summary : '';
    fieldBody.value = article ? article.body : '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    window.setTimeout(function () { fieldTitle.focus(); }, 60);
  }

  function closeEditor() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    editingId = null;
  }

  listHost.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-action]') : null;
    if (!button) return;
    var row = button.closest('.row');
    if (!row) return;
    var id = row.getAttribute('data-id');
    var article = findById(id);
    if (!article) return;

    if (button.getAttribute('data-action') === 'edit') {
      openEditor(article);
      return;
    }

    S.confirm({
      title: '删除文章',
      message: '确定删除《' + article.title + '》吗？此操作不可撤销。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      remove(id);
      renderList();
      S.toast('已删除《' + article.title + '》');
    });
  });

  document.getElementById('newArticleBtn').addEventListener('click', function () {
    openEditor(null);
  });

  document.getElementById('editorCancel').addEventListener('click', closeEditor);

  modal.addEventListener('click', function (event) {
    if (event.target === modal) closeEditor();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeEditor();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var title = fieldTitle.value.trim();
    if (!title) {
      S.toast('标题不能为空', 'warn');
      fieldTitle.focus();
      return;
    }
    var isNew = !editingId;
    var article = normalize({
      id: editingId || undefined,
      title: title,
      date: fieldDate.value || S.todayISO(),
      tags: fieldTags.value,
      summary: fieldSummary.value.trim(),
      body: fieldBody.value
    });
    upsert(article);
    closeEditor();
    renderList();
    S.toast(isNew ? '已新建《' + title + '》' : '已保存《' + title + '》');
  });

  /* 备份：导出 / 导入 / 复制为 posts.js */

  document.getElementById('exportBtn').addEventListener('click', function () {
    var list = sortedList();
    var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'kairi-posts-' + S.todayISO().replace(/-/g, '') + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    S.toast('已导出 ' + list.length + ' 篇文章');
  });

  var importInput = document.getElementById('importInput');
  document.getElementById('importBtn').addEventListener('click', function () {
    importInput.click();
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (err) {
        S.toast('文件不是合法的 JSON', 'warn');
        return;
      }
      if (!Array.isArray(parsed) || !parsed.length) {
        S.toast('文件里没有文章数据', 'warn');
        return;
      }
      S.confirm({
        title: '导入文章',
        message: '导入会覆盖当前的 ' + loadList().length + ' 篇文章（本次导入 ' + parsed.length + ' 篇），确定吗？',
        okText: '覆盖导入'
      }).then(function (ok) {
        if (ok) {
          saveList(parsed.map(normalize));
          renderList();
          S.toast('已导入 ' + parsed.length + ' 篇文章');
        }
        importInput.value = '';
      });
    };
    reader.readAsText(file, 'utf-8');
  });

  var postsModal = document.getElementById('postsModal');
  document.getElementById('copyPostsBtn').addEventListener('click', function () {
    var text = 'window.KAIRI_DEFAULT_POSTS = ' + JSON.stringify(sortedList(), null, 2) + ';';
    var output = document.getElementById('postsOutput');
    output.value = text;
    postsModal.classList.add('is-open');
    postsModal.setAttribute('aria-hidden', 'false');
    S.copyText(text, '已复制，粘回 js/posts.js 即可固化');
  });

  document.getElementById('postsModalClose').addEventListener('click', function () {
    postsModal.classList.remove('is-open');
    postsModal.setAttribute('aria-hidden', 'true');
  });

  postsModal.addEventListener('click', function (event) {
    if (event.target === postsModal) {
      postsModal.classList.remove('is-open');
      postsModal.setAttribute('aria-hidden', 'true');
    }
  });

  document.getElementById('restoreBtn').addEventListener('click', function () {
    S.confirm({
      title: '恢复默认文章',
      message: '会把最初自带的 4 篇示例文章补回来。已经存在的不会重复添加，你自己的文章不受影响。',
      okText: '恢复'
    }).then(function (ok) {
      if (!ok) return;
      var added = restoreDefaults();
      renderList();
      S.toast(added ? '已恢复 ' + added + ' 篇默认文章' : '默认文章都已经在列表里了');
    });
  });

  renderList();

  /* 从 article.html 的「编辑这篇」跳过来时自动打开编辑器 */
  var editParam = S.getParam('edit');
  if (editParam) {
    var target = findById(editParam);
    if (target) openEditor(target);
  }
})();
