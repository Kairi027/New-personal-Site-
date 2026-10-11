/* ==========================================================================
   收录：资料数据读写 + study.html 的列表 / 新建 / 编辑 / 删除 / 上传

   数据存在 js/materials-data.js（由本地服务写入，随文件夹传播），
   服务没启动时退回浏览器 localStorage。
   阅读器（material.html）也加载本文件，共用同一套数据层。
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  if (!S) return;

  var esc = S.escapeHtml;
  var STORE_KEY = 'kairi_materials_v1';
  var current = null;

  /* ---------------------------------------------------------------------
     数据层
     --------------------------------------------------------------------- */

  function splitTags(value) {
    if (Array.isArray(value)) {
      return value.map(function (t) { return String(t).trim(); }).filter(Boolean);
    }
    return String(value || '').split(/[,，、]/)
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  /* 统一成 Study/xxx.pdf 这种相对博客根目录的路径 */
  function normalizeFile(value) {
    var file = String(value || '').trim().replace(/\\/g, '/').replace(/^\.?\//, '');
    if (!file) return '';
    if (!/^study\//i.test(file)) file = 'Study/' + file;
    return file.replace(/^study\//i, 'Study/');
  }

  function normalize(raw) {
    raw = raw || {};
    return {
      id: String(raw.id || 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      title: String(raw.title || '').trim() || '未命名资料',
      file: normalizeFile(raw.file),
      source: String(raw.source || '').trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date || '')) ? String(raw.date) : S.todayISO(),
      tags: splitTags(raw.tags),
      summary: String(raw.summary || '').trim()
    };
  }

  function materialsFileText(list) {
    return '/* 由「收录 · 开发者模式」自动生成，请勿手改 */\n\n' +
      'window.KAIRI_MATERIALS = ' + JSON.stringify(list, null, 2) + ';\n';
  }

  function saveList(list) {
    current = (list || []).slice();
    S.writeJSON(STORE_KEY, current);
    var service = window.KairiService;
    if (service && service.ready) {
      return service.ready().then(function (ok) {
        if (!ok) return false;
        return service.writeDataFile('materials', materialsFileText(current))
          .catch(function () { return false; });
      });
    }
    return Promise.resolve(false);
  }

  function loadList() {
    if (current) return current;

    /* js/materials-data.js 是权威来源（空数组也算数：那是"开发者把资料删光了"）。
       只有它整个没加载出来（文件缺失 / 语法坏了）才退回 localStorage，
       而且**不回写**——免得在文件出问题时反过来把清单写成空的。 */
    if (Array.isArray(window.KAIRI_MATERIALS)) {
      current = window.KAIRI_MATERIALS.map(normalize);
      return current;
    }

    var stored = S.readJSON(STORE_KEY, null);
    current = Array.isArray(stored) ? stored.map(normalize) : [];
    return current;
  }

  function sortedList() {
    return loadList().slice().sort(function (a, b) {
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

  function upsert(item) {
    var list = loadList();
    var index = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === item.id) { index = i; break; }
    }
    if (index >= 0) list[index] = item;
    else list.push(item);
    return saveList(list);
  }

  function remove(id) {
    return saveList(loadList().filter(function (item) { return item.id !== id; }));
  }

  window.KairiMaterials = {
    STATUS_KEY: STORE_KEY,
    normalize: normalize,
    normalizeFile: normalizeFile,
    splitTags: splitTags,
    load: loadList,
    sorted: sortedList,
    find: findById,
    upsert: upsert,
    remove: remove,
    save: saveList,
    fileText: materialsFileText
  };

  /* ---------------------------------------------------------------------
     study.html：列表 + 编辑器
     --------------------------------------------------------------------- */

  var listHost = document.getElementById('materialList');
  if (!listHost) return;

  var canEdit = !!(window.KairiAuth && window.KairiAuth.canEdit());
  var service = window.KairiService;

  var tools = document.getElementById('materialTools');
  if (tools && canEdit) tools.hidden = false;

  var modal = document.getElementById('materialModal');
  var form = document.getElementById('materialForm');
  var heading = document.getElementById('materialHeading');
  var fieldTitle = document.getElementById('materialTitle');
  var fieldSource = document.getElementById('materialSource');
  var fieldDate = document.getElementById('materialDate');
  var fieldTags = document.getElementById('materialTags');
  var fieldSummary = document.getElementById('materialSummary');
  var fieldFile = document.getElementById('materialFile');
  var uploadInput = document.getElementById('materialUpload');
  var editingId = null;

  function metaLine(item) {
    var parts = ['<time datetime="' + esc(item.date) + '">' + esc(S.formatDate(item.date)) + '</time>'];
    parts.push('<span class="card__sep">·</span><span class="row__badge">PDF</span>');
    if (item.source) {
      parts.push('<span class="card__sep">·</span><span>' + esc(item.source) + '</span>');
    }
    item.tags.forEach(function (tag) {
      parts.push('<span class="card__sep">·</span><span class="chip">' + esc(tag) + '</span>');
    });
    return parts.join('');
  }

  function renderList() {
    var list = sortedList();
    var countHost = document.getElementById('materialCount');
    if (countHost) countHost.textContent = String(list.length);

    if (!list.length) {
      listHost.innerHTML = '<p class="empty">' +
        (canEdit
          ? '还没有收录任何资料。点下面的「新建收录」，把 Study 文件夹里的 PDF 收进来。'
          : '还没有收录任何资料。') +
        '</p>';
      return;
    }

    listHost.innerHTML = list.map(function (item) {
      return '' +
        '<article class="row reveal" data-id="' + esc(item.id) + '">' +
          '<div class="row__main">' +
            '<h3 class="row__title">' +
              '<a href="material.html?id=' + encodeURIComponent(item.id) + '">' + esc(item.title) + '</a>' +
            '</h3>' +
            (item.summary ? '<p class="row__summary">' + esc(item.summary) + '</p>' : '') +
            '<div class="row__meta">' + metaLine(item) + '</div>' +
          '</div>' +
          '<div class="row__actions">' +
            '<a class="btn btn--tiny" href="material.html?id=' + encodeURIComponent(item.id) + '">查看</a>' +
            (canEdit
              ? '<button class="btn btn--tiny" type="button" data-action="edit">编辑</button>' +
                '<button class="btn btn--tiny btn--danger" type="button" data-action="delete">删除</button>'
              : '') +
          '</div>' +
        '</article>';
    }).join('');
    if (S.revealNow) S.revealNow(listHost);
  }

  function openEditor(item) {
    if (!canEdit) return;
    editingId = item ? item.id : null;
    heading.textContent = item ? '编辑收录' : '新建收录';
    fieldTitle.value = item ? item.title : '';
    fieldSource.value = item ? item.source : '';
    fieldDate.value = item ? item.date : S.todayISO();
    fieldTags.value = item ? item.tags.join(', ') : '';
    fieldSummary.value = item ? item.summary : '';
    fieldFile.value = item ? item.file : '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    window.setTimeout(function () { fieldTitle.focus(); }, 60);
  }

  function closeEditor() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    editingId = null;
  }

  document.getElementById('newMaterialBtn').addEventListener('click', function () {
    openEditor(null);
  });

  document.getElementById('materialCancel').addEventListener('click', closeEditor);

  modal.addEventListener('click', function (event) {
    if (event.target === modal) closeEditor();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeEditor();
  });

  listHost.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-action]') : null;
    if (!button) return;
    var row = button.closest('.row');
    if (!row) return;
    var item = findById(row.getAttribute('data-id'));
    if (!item) return;

    if (button.getAttribute('data-action') === 'edit') {
      openEditor(item);
      return;
    }

    S.confirm({
      title: '删除收录',
      message: '确定把《' + item.title + '》从收录里删掉吗？只删除这条记录，Study 文件夹里的 PDF 会保留。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      remove(item.id);
      renderList();
      S.toast('已删除《' + item.title + '》');
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var title = fieldTitle.value.trim();
    if (!title) {
      S.toast('标题不能为空', 'warn');
      fieldTitle.focus();
      return;
    }
    var file = window.KairiMaterials.normalizeFile(fieldFile.value);
    if (!file) {
      S.toast('还没有指定 PDF：可以上传一个，或直接填 Study/ 下的文件名', 'warn');
      fieldFile.focus();
      return;
    }
    if (!/\.pdf$/i.test(file)) {
      S.toast('只支持 PDF 文件', 'warn');
      fieldFile.focus();
      return;
    }

    var isNew = !editingId;
    var item = normalize({
      id: editingId || undefined,
      title: title,
      file: file,
      source: fieldSource.value.trim(),
      date: fieldDate.value || S.todayISO(),
      tags: fieldTags.value,
      summary: fieldSummary.value.trim()
    });
    upsert(item);
    closeEditor();
    renderList();
    S.toast(isNew ? '已收录《' + title + '》' : '已保存《' + title + '》');
  });

  /* ---- 上传 PDF 到 Study/ ---- */

  function safeFileName(name) {
    return String(name || '')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/^\.+/, '')
      .trim() || ('material-' + Date.now() + '.pdf');
  }

  document.getElementById('materialUploadBtn').addEventListener('click', function () {
    if (!service) {
      S.toast('没有加载本地服务客户端，请手动把 PDF 放进 Study 文件夹', 'warn');
      return;
    }
    uploadInput.click();
  });

  uploadInput.addEventListener('change', function () {
    var picked = uploadInput.files && uploadInput.files[0];
    if (!picked) return;
    if (!/\.pdf$/i.test(picked.name)) {
      S.toast('只支持 PDF 文件', 'warn');
      uploadInput.value = '';
      return;
    }
    var name = safeFileName(picked.name);
    var rel = 'Study/' + name;
    S.toast('正在把 ' + name + ' 放进 Study/ …');
    service.ready().then(function (ok) {
      if (!ok) {
        S.toast('本地服务没启动：请先运行「启动博客服务.bat」，或手动把 PDF 拷进 Study 文件夹再填路径', 'warn');
        return;
      }
      return service.putStudyFile(rel, picked).then(function () {
        fieldFile.value = rel;
        S.toast('已放入 ' + rel + '（' + Math.round(picked.size / 1024) + ' KB）');
      });
    }).catch(function (err) {
      S.toast('上传失败：' + (err.message || err), 'warn');
    }).then(function () {
      uploadInput.value = '';
    });
  });

  /* ---- 从 Study 文件夹里挑一个已有的 PDF ---- */

  var picker = document.getElementById('studyPicker');
  var pickerList = document.getElementById('studyPickerList');

  function closePicker() {
    picker.classList.remove('is-open');
    picker.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('materialPickBtn').addEventListener('click', function () {
    if (!service) {
      S.toast('没有加载本地服务客户端，请手动填写 Study/ 下的文件名', 'warn');
      return;
    }
    pickerList.innerHTML = '<p class="empty">正在读取 Study 文件夹…</p>';
    picker.classList.add('is-open');
    picker.setAttribute('aria-hidden', 'false');
    service.ready().then(function (ok) {
      if (!ok) {
        pickerList.innerHTML = '<p class="empty">本地服务没启动，读不到 Study 文件夹。' +
          '手动把 PDF 拷进 Study/，然后在「PDF 文件」里填 Study/文件名.pdf 也可以。</p>';
        return;
      }
      return service.studyList().then(function (data) {
        var files = (data && data.files) || [];
        if (!files.length) {
          pickerList.innerHTML = '<p class="empty">Study 文件夹里还没有 PDF。' +
            '把文件放进去，或用上面的「上传 PDF」。</p>';
          return;
        }
        pickerList.innerHTML = files.map(function (item) {
          return '<li class="filelist__item" data-path="' + esc(item.path) + '">' +
            '<span class="filelist__path">' + esc(item.name) + '</span>' +
            '<span class="filelist__size">' + Math.max(1, Math.round(item.size / 1024)) + ' KB</span>' +
          '</li>';
        }).join('');
      });
    }).catch(function (err) {
      pickerList.innerHTML = '<p class="empty">读取失败：' + esc(err.message || String(err)) + '</p>';
    });
  });

  pickerList.addEventListener('click', function (event) {
    var row = event.target.closest ? event.target.closest('[data-path]') : null;
    if (!row) return;
    fieldFile.value = row.getAttribute('data-path');
    closePicker();
    S.toast('已选中 ' + row.getAttribute('data-path'));
  });

  document.getElementById('studyPickerClose').addEventListener('click', closePicker);
  picker.addEventListener('click', function (event) {
    if (event.target === picker) closePicker();
  });

  renderList();

  /* 从阅读器「编辑资料」跳过来时直接开编辑器 */
  var editParam = S.getParam('edit');
  if (canEdit && editParam) {
    var target = findById(editParam);
    if (target) openEditor(target);
  }
})();
