/* ==========================================================================
   项目：卡片列表 + 项目页（介绍 + 源代码仓库 + 打包下载）
   数据来自 KairiProjects（内置 + 上传 + 覆盖），因此是异步的。
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  var P = window.KairiProjects;
  if (!S || !P) return;

  var esc = S.escapeHtml;
  var canEdit = !!(window.KairiAuth && window.KairiAuth.canEdit());
  var PROJECTS = [];

  function findProject(id) {
    for (var i = 0; i < PROJECTS.length; i++) {
      if (PROJECTS[i].id === id) return PROJECTS[i];
    }
    return null;
  }

  function wantedId() {
    var param = S.getParam('p');
    if (param) return param;
    return document.body.getAttribute('data-project') || '';
  }

  function techChips(list) {
    return (list || []).map(function (item) {
      return '<span class="chip">' + esc(item) + '</span>';
    }).join('');
  }

  function notFound(host, what) {
    host.innerHTML =
      '<div class="empty-state">' +
        '<p class="empty-state__title">没有找到这个' + esc(what) + '</p>' +
        '<p class="empty-state__text">链接可能不完整，或者项目已经被移除了。</p>' +
        '<a class="btn btn--primary" href="projects.html">回到项目汇集</a>' +
      '</div>';
  }

  function safeFileName(text) {
    return String(text || 'project').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'project';
  }

  /* ---------------------------------------------------------------------
     projects.html —— 卡片列表
     --------------------------------------------------------------------- */

  function initGrid() {
    var grid = document.getElementById('projectGrid');
    if (!grid) return;

    var tools = document.getElementById('projectTools');
    if (tools && canEdit) {
      tools.hidden = false;
      document.getElementById('newProjectBtn').addEventListener('click', function () {
        window.location.href = 'project-edit.html';
      });
    }

    if (!PROJECTS.length) {
      grid.innerHTML = '<p class="empty">还没有收录项目。</p>';
      return;
    }

    grid.innerHTML = PROJECTS.map(function (project) {
      var cover = project.cover
        ? '<img src="' + esc(project.cover) + '" alt="' + esc(project.name) + ' 预览" loading="lazy">'
        : '<span class="project-card__placeholder">' + esc((project.name || '?').slice(0, 1)) + '</span>';
      var fileCount = (project.files || []).length;
      return '' +
        '<a class="project-card reveal" href="project.html?p=' + encodeURIComponent(project.id) + '">' +
          '<span class="project-card__cover">' +
            cover +
            '<span class="project-card__year">' + esc(project.year || '') + '</span>' +
            (project.builtin ? '' : '<span class="project-card__badge">上传</span>') +
          '</span>' +
          '<span class="project-card__body">' +
            '<span class="project-card__name">' + esc(project.name) + '</span>' +
            (project.en ? '<span class="project-card__en">' + esc(project.en) + '</span>' : '') +
            '<span class="project-card__sub">' + esc(project.subtitle || '') + '</span>' +
            '<span class="project-card__line">' + esc(project.tagline || '') + '</span>' +
            '<span class="project-card__tech">' + techChips(project.tech) + '</span>' +
            '<span class="project-card__cta">' +
              (fileCount ? '查看仓库（' + fileCount + ' 个文件）' : '查看项目') +
              ' <i aria-hidden="true">→</i>' +
            '</span>' +
          '</span>' +
        '</a>';
    }).join('');
    if (S.revealNow) S.revealNow(grid);
  }

  /* ---------------------------------------------------------------------
     project.html —— 项目页（介绍 + 仓库）
     --------------------------------------------------------------------- */

  function initDetail() {
    var host = document.getElementById('projectDetail');
    if (!host) return;

    var project = findProject(wantedId());
    if (!project) {
      notFound(host, '项目');
      return;
    }

    document.title = project.name + ' · 项目 · Kairi 的小站';

    var files = project.files || [];
    var hasFiles = files.length > 0;
    var cover = project.cover
      ? '<img src="' + esc(project.cover) + '" alt="' + esc(project.name) + ' 预览">'
      : '<span class="project-hero__placeholder">' + esc((project.name || '?').slice(0, 1)) + '</span>';

    var admin = '';
    if (canEdit) {
      admin =
        '<div class="admin-bar">' +
          '<span class="admin-bar__label">开发者操作</span>' +
          '<a class="btn btn--ghost btn--small" href="project-edit.html?p=' + encodeURIComponent(project.id) + '">编辑项目</a>' +
          (hasFiles
            ? '<button class="btn btn--ghost btn--small" type="button" id="regenCoverBtn">重新生成预览图</button>'
            : '') +
          (project.builtin
            ? '<span class="admin-bar__note">内置项目不能删除</span>'
            : '<button class="btn btn--danger btn--small" type="button" id="deleteProjectBtn">删除项目</button>') +
        '</div>';
    }

    var shots = (project.screenshots || []).map(function (shot) {
      return '' +
        '<figure class="shot reveal">' +
          '<button class="shot__button" type="button" data-lightbox="' + esc(shot.src) + '" data-caption="' + esc(shot.caption || '') + '">' +
            '<img src="' + esc(shot.src) + '" alt="' + esc(shot.caption || '') + '" loading="lazy">' +
          '</button>' +
          '<figcaption class="shot__caption">' + esc(shot.caption || '') + '</figcaption>' +
        '</figure>';
    }).join('');

    host.innerHTML =
      '<a class="link-back reveal" href="projects.html">← 项目汇集</a>' +

      '<header class="project-hero reveal">' +
        '<div class="project-hero__cover">' + cover + '</div>' +
        '<div class="project-hero__text">' +
          '<p class="section__kicker">PROJECT</p>' +
          '<h1 class="project-hero__name">' + esc(project.name) + '</h1>' +
          (project.en ? '<p class="project-hero__en">' + esc(project.en) + '</p>' : '') +
          '<p class="project-hero__sub">' + esc(project.subtitle || '') + '</p>' +
          '<p class="project-hero__line">' + esc(project.tagline || '') + '</p>' +
          '<div class="project-hero__tech">' + techChips(project.tech) + '</div>' +
          (hasFiles
            ? '<div class="repo-actions">' +
                '<button class="btn btn--primary btn--small" type="button" id="downloadZip">打包下载 ZIP</button>' +
                '<span class="repo-actions__note" id="zipNote">' + files.length + ' 个文件</span>' +
              '</div>'
            : '') +
        '</div>' +
      '</header>' +

      admin +

      '<div class="intro-grid">' +
        '<div class="intro-grid__main">' +
          ((project.detail && project.detail.length)
            ? project.detail.map(function (paragraph) {
                return '<p class="about__text reveal">' + esc(paragraph) + '</p>';
              }).join('')
            : '<p class="about__text reveal">这个项目还没有写详细介绍。</p>') +
        '</div>' +
        '<aside class="intro-grid__side">' +
          '<div class="panel reveal">' +
            '<h2 class="panel__title">技术栈</h2>' +
            '<div class="panel__chips">' +
              ((project.tech && project.tech.length) ? techChips(project.tech) : '<span class="empty">未标注</span>') +
            '</div>' +
          '</div>' +
          ((project.highlights && project.highlights.length)
            ? '<div class="panel reveal">' +
                '<h2 class="panel__title">亮点</h2>' +
                '<ul class="panel__list">' + project.highlights.map(function (item) {
                  return '<li>' + esc(item) + '</li>';
                }).join('') + '</ul>' +
              '</div>'
            : '') +
        '</aside>' +
      '</div>' +

      (shots
        ? '<section class="shots">' +
            '<h2 class="section__title section__title--small reveal">截图</h2>' +
            '<p class="section__lead reveal">点任意一张可以放大查看。</p>' +
            '<div class="shot-grid">' + shots + '</div>' +
          '</section>'
        : '') +

      '<section class="shots" id="repoSection">' +
        '<h2 class="section__title section__title--small reveal">源代码</h2>' +
        '<p class="section__lead reveal">' +
          (hasFiles
            ? '和 GitHub 仓库一样：左边是文件树，点开看内容；上方按钮可以打包下载整个项目。'
            : '这个项目还没有上传任何文件。' + (canEdit ? '可以在编辑页上传。' : '')) +
        '</p>' +
        '<div id="projectFiles"></div>' +
      '</section>';

    if (S.revealNow) S.revealNow(host);

    if (hasFiles && window.KairiFiles) {
      window.KairiFiles.mount(document.getElementById('projectFiles'), {
        files: files,
        title: '仓库文件',
        projectId: project.id,
        basePrefix: 'projects/' + project.id + '/'
      });
    }

    var regenBtn = document.getElementById('regenCoverBtn');
    if (regenBtn) {
      regenBtn.addEventListener('click', function () {
        regenBtn.disabled = true;
        regenBtn.textContent = '正在截图…';
        P.regenerateCover(project).then(function (cover) {
          S.toast('预览图已更新：' + cover);
          window.setTimeout(function () { window.location.reload(); }, 700);
        }).catch(function (err) {
          regenBtn.disabled = false;
          regenBtn.textContent = '重新生成预览图';
          S.toast((err && err.message) || '截图失败', 'warn');
        });
      });
    }

    var zipBtn = document.getElementById('downloadZip');
    if (zipBtn) {
      zipBtn.addEventListener('click', function () { downloadZip(project, zipBtn); });
    }

    var deleteBtn = document.getElementById('deleteProjectBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        S.confirm({
          title: '删除项目',
          message: '确定删除《' + project.name + '》吗？projects/' + project.id + '/ 里的文件会一并删掉，且不可撤销。',
          okText: '删除',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          P.deleteProject(project).then(function () {
            S.toast('已删除《' + project.name + '》');
            window.setTimeout(function () { window.location.href = 'projects.html'; }, 500);
          }).catch(function (err) {
            S.toast((err && err.message) || '删除失败', 'warn');
          });
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     打包下载
     --------------------------------------------------------------------- */

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
  }

  function downloadZip(project, button) {
    var zip = window.KairiZip;
    var service = window.KairiService;
    if (!zip) {
      S.toast('打包组件没加载成功', 'warn');
      return;
    }

    var files = project.files || [];
    var entries = [];
    var pending = [];

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = '正在打包…';

    var online = service && service.ready ? service.ready() : Promise.resolve(false);

    online.then(function (hasService) {
      files.forEach(function (item) {
        if (typeof item.text === 'string') {
          entries.push({ path: item.path, data: zip.textData(item.text) });
        } else if (hasService) {
          pending.push(item);
        }
      });

      var chain = Promise.resolve();
      pending.forEach(function (item) {
        chain = chain.then(function () {
          return fetch(service.fileUrl(project.id, item.path), { cache: 'no-store' })
            .then(function (res) { return res.ok ? res.arrayBuffer() : null; })
            .then(function (buffer) {
              if (buffer) entries.push({ path: item.path, data: new Uint8Array(buffer) });
            })
            .catch(function () { /* 单个文件读不到就跳过 */ });
        });
      });
      return chain;
    }).then(function () {
      if (!entries.length) {
        S.toast('没有可打包的文件', 'warn');
        return;
      }
      var blob = zip.build(entries);
      saveBlob(blob, safeFileName(project.en || project.name) + '.zip');
      var skipped = files.length - entries.length;
      S.toast('已打包 ' + entries.length + ' 个文件' + (skipped ? '（跳过 ' + skipped + ' 个：需要本地服务才能读取）' : ''));
    }).catch(function (err) {
      S.toast((err && err.message) || '打包失败', 'warn');
    }).then(function () {
      button.disabled = false;
      button.textContent = originalText;
    });
  }

  /* ---------------------------------------------------------------------
     启动
     --------------------------------------------------------------------- */

  function boot() {
    PROJECTS = P.all();
    initGrid();
    initDetail();
  }

  P.ensureReady().then(boot).catch(boot);
})();
