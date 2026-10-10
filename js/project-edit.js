/* ==========================================================================
   开发者 · 项目管理页（写入通过本地服务，不需要任何目录授权）
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  var P = window.KairiProjects;
  var A = window.KairiAnalyze;

  if (!window.KairiAuth.canEdit()) {
    window.location.replace('projects.html');
    return;
  }

  var els = {
    title: document.getElementById('editTitle'),
    storageBar: document.getElementById('storageBar'),
    id: document.getElementById('fieldId'),
    name: document.getElementById('fieldName'),
    en: document.getElementById('fieldEn'),
    subtitle: document.getElementById('fieldSubtitle'),
    year: document.getElementById('fieldYear'),
    tagline: document.getElementById('fieldTagline'),
    tech: document.getElementById('fieldTech'),
    highlights: document.getElementById('fieldHighlights'),
    detail: document.getElementById('fieldDetail'),
    launchCommand: document.getElementById('fieldLaunchCommand'),
    launchCwd: document.getElementById('fieldLaunchCwd'),
    launchUrl: document.getElementById('fieldLaunchUrl'),
    launchWait: document.getElementById('fieldLaunchWait'),
    launchHint: document.getElementById('launchHint'),
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    dirInput: document.getElementById('dirInput'),
    pickFiles: document.getElementById('pickFilesBtn'),
    pickDir: document.getElementById('pickDirBtn'),
    uploadHint: document.getElementById('uploadHint'),
    parsePanel: document.getElementById('parsePanel'),
    parseBody: document.getElementById('parseBody'),
    applyParse: document.getElementById('applyParseBtn'),
    fileList: document.getElementById('fileList'),
    fileCount: document.getElementById('fileCount'),
    saveBtn: document.getElementById('saveBtn'),
    regenCover: document.getElementById('regenCoverBtn'),
    deleteBtn: document.getElementById('deleteBtn')
  };

  var state = {
    project: null,
    draftId: '',
    files: [],        // [{path, file?, size, kind, text?}]
    removed: [],
    parsed: null,
    busy: false
  };

  function splitList(text) {
    return String(text || '').split(/[,，、]/).map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function splitLines(text) {
    return String(text || '').split('\n').map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  /* ---------------------------------------------------------------------
     服务状态
     --------------------------------------------------------------------- */

  function renderStorageBar() {
    var status = P.status();
    if (status.service) {
      els.storageBar.className = 'notice notice--ok';
      els.storageBar.innerHTML =
        '<span class="dot dot--ok"></span>' +
        '<span>本地服务已连接（127.0.0.1:' + status.port + '）。保存后文件会直接写进 <b>projects\\&lt;项目ID&gt;\\</b>，访客拷贝这个文件夹也能看到。</span>';
      els.saveBtn.disabled = false;
      return;
    }
    els.storageBar.className = 'notice notice--warn';
    els.storageBar.innerHTML =
      '<span class="dot dot--unknown"></span>' +
      '<span>本地服务没有启动，暂时无法保存。请双击博客根目录下的 <code>启动博客服务.bat</code>，然后刷新本页。</span>';
    els.saveBtn.disabled = true;
  }

  /* ---------------------------------------------------------------------
     文件
     --------------------------------------------------------------------- */

  function mergeFiles(items) {
    var map = {};
    state.files.forEach(function (item) { map[item.path] = item; });
    items.forEach(function (item) {
      map[item.path] = item;
      var index = state.removed.indexOf(item.path);
      if (index !== -1) state.removed.splice(index, 1);
    });
    state.files = Object.keys(map).map(function (key) { return map[key]; });
    state.files.sort(function (a, b) { return a.path.localeCompare(b.path); });
  }

  function renderFiles() {
    els.fileCount.textContent = String(state.files.length);

    if (!state.files.length) {
      els.fileList.innerHTML = '<p class="empty">还没有文件。</p>';
      return;
    }

    els.fileList.innerHTML =
      '<ul class="filelist">' +
        state.files.map(function (item) {
          return '<li class="filelist__item">' +
            '<span class="filelist__path" title="' + S.escapeHtml(item.path) + '">' + S.escapeHtml(item.path) + '</span>' +
            '<span class="filelist__size">' + A.formatSize(item.size) + '</span>' +
            '<button class="filelist__del" type="button" data-path="' + S.escapeHtml(item.path) + '" aria-label="移除">×</button>' +
          '</li>';
        }).join('') +
      '</ul>';
  }

  els.fileList.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('.filelist__del') : null;
    if (!btn) return;
    var path = btn.getAttribute('data-path');
    state.removed.push(path);
    state.files = state.files.filter(function (item) { return item.path !== path; });
    renderFiles();
    runAnalyze();
    suggestLaunch();
  });

  /* ---------------------------------------------------------------------
     上传
     --------------------------------------------------------------------- */

  function acceptFiles(list) {
    var arr = Array.prototype.slice.call(list || []);
    if (!arr.length) return;
    els.uploadHint.textContent = '正在读取 ' + arr.length + ' 个文件…';
    A.readManifest(arr, { textLimit: P.TEXT_LIMIT, totalLimit: P.TOTAL_TEXT_LIMIT })
      .then(function (items) {
        mergeFiles(items);
        renderFiles();
        runAnalyze();
        suggestLaunch();
        var textCount = items.filter(function (item) { return typeof item.text === 'string'; }).length;
        var skipped = items.skipped || 0;
        S.toast('已加入 ' + items.length + ' 个文件（可查看内容 ' + textCount + ' 个）' +
          (skipped ? '，已跳过 ' + skipped + ' 个依赖/缓存文件' : ''));
        els.uploadHint.textContent = skipped
          ? '已自动跳过 ' + skipped + ' 个 .venv / node_modules / .git 之类的文件'
          : '';
      })
      .catch(function () {
        els.uploadHint.textContent = '';
        S.toast('读取文件失败', 'warn');
      });
  }

  els.pickFiles.addEventListener('click', function () { els.fileInput.click(); });
  els.pickDir.addEventListener('click', function () { els.dirInput.click(); });
  els.fileInput.addEventListener('change', function () {
    acceptFiles(els.fileInput.files);
    els.fileInput.value = '';
  });
  els.dirInput.addEventListener('change', function () {
    acceptFiles(els.dirInput.files);
    els.dirInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(function (type) {
    els.dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      els.dropzone.classList.add('is-over');
    });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    els.dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      els.dropzone.classList.remove('is-over');
    });
  });
  els.dropzone.addEventListener('drop', function (event) {
    var dt = event.dataTransfer;
    if (!dt) return;
    acceptFiles(dt.files);
  });

  /* ---------------------------------------------------------------------
     解析
     --------------------------------------------------------------------- */

  function runAnalyze() {
    if (!state.files.length) {
      state.parsed = null;
      els.parsePanel.hidden = true;
      return;
    }
    state.parsed = A.analyze(state.files);
    renderParse(state.parsed);
  }

  function chip(text) {
    return '<span class="chip">' + S.escapeHtml(text) + '</span>';
  }

  function renderParse(parsed) {
    var rows = [];
    rows.push('<div class="parse__row"><span class="parse__label">文件</span><span>' +
      parsed.stats.count + ' 个 · ' + S.escapeHtml(parsed.stats.sizeText) + '</span></div>');

    if (parsed.tech.length) {
      rows.push('<div class="parse__row"><span class="parse__label">技术栈</span><span>' +
        parsed.tech.map(chip).join('') + '</span></div>');
    }
    if (parsed.stats.languages.length) {
      rows.push('<div class="parse__row"><span class="parse__label">语言分布</span><span>' +
        parsed.stats.languages.map(function (item) { return chip(item.name + ' ' + item.count); }).join('') +
        '</span></div>');
    }
    rows.push('<div class="parse__row"><span class="parse__label">截图</span><span>' +
      (parsed.screenshots.length
        ? parsed.screenshots.length + ' 张（' + parsed.screenshots.slice(0, 3).map(function (item) {
            return S.escapeHtml(item.path);
          }).join('、') + (parsed.screenshots.length > 3 ? ' 等' : '') + '）'
        : '没有找到图片') + '</span></div>');

    if (parsed.summary) {
      rows.push('<div class="parse__row"><span class="parse__label">简介草稿</span><span>' +
        S.escapeHtml(parsed.summary) + '</span></div>');
    } else {
      rows.push('<div class="parse__row"><span class="parse__label">简介草稿</span><span>没找到 README，可以自己写</span></div>');
    }
    if (parsed.highlights.length) {
      rows.push('<div class="parse__row"><span class="parse__label">亮点</span><span>' +
        parsed.highlights.map(function (item) { return '<div>· ' + S.escapeHtml(item) + '</div>'; }).join('') +
        '</span></div>');
    }

    els.parseBody.innerHTML = rows.join('');
    els.parsePanel.hidden = false;
  }

  /* 当前表单里配置的运行方式：desktop = 会在本机弹出程序窗口的那种 */
  function launchKind() {
    if (els.launchUrl.value.trim()) return 'web';
    if (els.launchCommand.value.trim()) return 'desktop';
    return 'static';
  }

  function isDesktopLaunch() {
    return launchKind() === 'desktop';
  }

  function fillLaunch(tip) {
    els.launchCommand.value = tip.command || '';
    els.launchCwd.value = tip.cwd || '';
    els.launchUrl.value = tip.url || '';
    if (tip.waitMs) els.launchWait.value = String(Math.round(tip.waitMs / 1000));
  }

  var autoFilled = false;

  /* 从仓库文件里认一下"怎么把它跑起来"：列出建议，并在没填过时自动用第一个 */
  function suggestLaunch() {
    var tips = A.detectLaunch(state.files || [], els.name.value.trim() ||
      (state.project && state.project.name) || '');

    els.launchHint.innerHTML = '';
    if (!tips.length) {
      els.launchHint.textContent = state.files.length
        ? '没认出可运行的入口，可以自己填启动命令和预览地址（纯静态页面留空即可）。'
        : '';
    } else {
      els.launchHint.appendChild(document.createTextNode('仓库里看起来可以这样跑（点一下自动填）：'));
      tips.slice(0, 4).forEach(function (tip) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'launch-tip';
        btn.textContent = tip.label;
        btn.addEventListener('click', function () {
          fillLaunch(tip);
          S.toast('已填入「' + tip.label + '」，你可以再改');
        });
        els.launchHint.appendChild(btn);
      });
    }

    /* 上传完 / 打开老项目后，没配过启动方式就自动补上识别到的第一个 */
    if (autoFilled || !tips.length || !tips[0].command) return;
    if (els.launchCommand.value.trim() || els.launchUrl.value.trim()) return;
    autoFilled = true;
    fillLaunch(tips[0]);
    S.toast('已自动识别启动方式：' + tips[0].label + '（可手动修改）');
  }

  els.applyParse.addEventListener('click', function () {
    var parsed = state.parsed;
    if (!parsed) return;

    function fillIfEmpty(input, value) {
      if (!value) return;
      if (String(input.value || '').trim()) return;
      input.value = value;
    }

    fillIfEmpty(els.tagline, parsed.summary);
    fillIfEmpty(els.tech, parsed.tech.join(', '));
    fillIfEmpty(els.highlights, parsed.highlights.join('\n'));
    fillIfEmpty(els.detail, parsed.summary);

    S.toast('已填入解析结果（不会覆盖你已经写过的字段）');
  });

  /* ---------------------------------------------------------------------
     载入 / 保存 / 删除
     --------------------------------------------------------------------- */

  function fillForm(project) {
    els.id.value = project.id || '';
    els.name.value = project.name || '';
    els.en.value = project.en || '';
    els.subtitle.value = project.subtitle || '';
    els.year.value = project.year || '';
    els.tagline.value = project.tagline || '';
    els.tech.value = (project.tech || []).join(', ');
    els.highlights.value = (project.highlights || []).join('\n');
    els.detail.value = (project.detail || []).join('\n');
    var launch = project.launch || {};
    els.launchCommand.value = launch.command || '';
    els.launchCwd.value = launch.cwd || '';
    els.launchUrl.value = launch.url || '';
    els.launchWait.value = launch.waitMs ? String(Math.round(launch.waitMs / 1000)) : '';
  }

  function buildProject() {
    var base = state.project || {};
    var id = base.id || state.draftId || P.newId();
    var files = P.cleanFiles(state.files);

    var screenshots = (state.parsed && state.parsed.screenshots.length
      ? state.parsed.screenshots
      : files.filter(function (item) { return item.kind === 'image'; })
          .slice(0, 6)
          .map(function (item) { return { path: item.path, caption: item.path.split('/').pop() }; })
    ).map(function (item) {
      return { src: 'projects/' + id + '/' + item.path, caption: item.caption || item.path };
    });

    return {
      id: id,
      name: els.name.value.trim(),
      en: els.en.value.trim(),
      subtitle: els.subtitle.value.trim(),
      year: els.year.value.trim(),
      tagline: els.tagline.value.trim(),
      tech: splitList(els.tech.value),
      highlights: splitLines(els.highlights.value),
      detail: splitLines(els.detail.value),
      launch: {
        command: els.launchCommand.value.trim(),
        cwd: els.launchCwd.value.trim(),
        url: els.launchUrl.value.trim(),
        waitMs: Math.max(1000, (parseInt(els.launchWait.value, 10) || 15) * 1000)
      },
      cover: screenshots.length ? screenshots[0].src : '',
      screenshots: screenshots,
      files: files,
      source: 'uploaded',
      builtin: !!base.builtin
    };
  }

  function doSave(project, skipScreenshot) {
    state.busy = true;
    els.saveBtn.disabled = true;
    els.saveBtn.textContent = '正在保存…';

    P.saveProject(project, state.files, state.removed, { skipScreenshot: skipScreenshot }).then(function () {
      S.toast(skipScreenshot ? '已保存（这次没跑程序、没动封面）' : '已保存，正在刷新…');
      window.setTimeout(function () {
        window.location.href = 'project.html?p=' + encodeURIComponent(project.id);
      }, 600);
    }).catch(function (err) {
      state.busy = false;
      els.saveBtn.disabled = false;
      els.saveBtn.textContent = '保存项目';
      S.toast((err && err.message) || '保存失败', 'warn');
    });
  }

  els.saveBtn.addEventListener('click', function () {
    if (state.busy) return;
    if (!P.status().service) {
      S.toast('本地服务没启动，先双击《启动博客服务.bat》', 'warn');
      return;
    }

    var project = buildProject();
    if (!project.name) {
      S.toast('请先填写项目名称', 'warn');
      els.name.focus();
      return;
    }

    /* 桌面程序（有启动命令、没有预览地址）要真的在电脑上跑起来才能截图，先问一句 */
    if (isDesktopLaunch()) {
      S.confirm({
        title: '要在你电脑上运行它吗？',
        message: '会短暂启动《' + project.name + '》，等窗口出现后自动截图（可能会出声），截完自动关掉。' +
          '选「取消」就只保存资料、不动封面。',
        okText: '运行并截图'
      }).then(function (ok) {
        doSave(project, !ok);
      });
      return;
    }

    doSave(project, false);
  });

  els.deleteBtn.addEventListener('click', function () {
    var project = state.project;
    if (!project) {
      S.toast('这是一个还没保存的新项目', 'warn');
      return;
    }
    if (project.builtin) {
      S.toast('内置项目不能删除，只能编辑介绍', 'warn');
      return;
    }
    if (!P.status().service) {
      S.toast('本地服务没启动，无法删除', 'warn');
      return;
    }
    S.confirm({
      title: '删除项目',
      message: '确定删除《' + project.name + '》吗？它在 projects/' + project.id + '/ 里的文件也会一并删掉，且不可撤销。',
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

  els.regenCover.addEventListener('click', function () {
    var project = state.project;
    if (!project) return;
    els.regenCover.disabled = true;
    els.regenCover.textContent = '正在截图…';
    /* 用表单里的当前值截图：自动识别出来的启动方式不必先保存也能重截 */
    var launch = {
      command: els.launchCommand.value.trim(),
      cwd: els.launchCwd.value.trim(),
      url: els.launchUrl.value.trim(),
      waitMs: Math.max(1000, (parseInt(els.launchWait.value, 10) || 15) * 1000)
    };
    P.regenerateCover(project, launch).then(function (cover) {
      S.toast('预览图已更新：' + cover);
      window.setTimeout(function () { window.location.reload(); }, 700);
    }).catch(function (err) {
      els.regenCover.disabled = false;
      els.regenCover.textContent = '重新生成预览图';
      S.toast((err && err.message) || '截图失败', 'warn');
    });
  });

  /* ---------------------------------------------------------------------
     启动
     --------------------------------------------------------------------- */

  P.ensureReady().then(function () {
    renderStorageBar();
    var id = S.getParam('p');

    if (!id) {
      els.title.textContent = '新建项目';
      els.deleteBtn.hidden = true;
      els.year.value = String(new Date().getFullYear());
      state.draftId = P.newId();
      els.id.value = state.draftId;
      renderFiles();
      return;
    }

    var project = P.get(id);
    if (!project) {
      S.toast('没有找到这个项目', 'warn');
      window.location.replace('projects.html');
      return;
    }

    state.project = project;
    els.title.textContent = project.builtin ? '编辑内置项目' : '编辑项目';
    fillForm(project);
    els.regenCover.hidden = !(project.files && project.files.length);

    if (project.builtin) {
      els.deleteBtn.hidden = true;
      document.querySelector('.editor__side .panel:first-child .dropzone').style.display = '';
      els.uploadHint.textContent = '内置项目也可以上传/补充仓库文件，保存后会写进 projects/' + project.id + '/。';
    }

    state.files = (project.files || []).map(function (item) {
      return { path: item.path, size: item.size, kind: item.kind, text: item.text };
    });
    renderFiles();
    runAnalyze();
    suggestLaunch();
  }).catch(function () {
    S.toast('项目数据读取失败', 'warn');
  });
})();
