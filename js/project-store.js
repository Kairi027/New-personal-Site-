/* ==========================================================================
   项目仓库：内置项目 + 上传项目 + 内置项目覆盖

   数据来自三个"生成文件"全局（用 <script src> 读取，file:// 下唯一可行）：
     window.KAIRI_PROJECTS            —— 内置项目（写在 js/posts.js）
     window.KAIRI_PROJECT_OVERRIDES   —— 内置项目的简介改动
     window.KAIRI_UPLOADED_PROJECTS   —— 上传的项目
     window.KAIRI_BUILTIN_FILES       —— 内置项目的仓库文件清单

   写入一律通过本地服务（js/blog-service.js）；服务没启动就只能读不能写。
   ========================================================================== */
(function () {
  'use strict';

  var TEXT_LIMIT = 256 * 1024;          // 单个文本文件内联上限
  var TOTAL_TEXT_LIMIT = 2 * 1024 * 1024;

  var cached = null;
  var readyPromise = null;
  var serviceUp = false;

  function builtins() {
    return Array.isArray(window.KAIRI_PROJECTS) ? window.KAIRI_PROJECTS : [];
  }

  function uploadedList() {
    return Array.isArray(window.KAIRI_UPLOADED_PROJECTS) ? window.KAIRI_UPLOADED_PROJECTS.slice() : [];
  }

  function overridesMap() {
    var value = window.KAIRI_PROJECT_OVERRIDES;
    return value && typeof value === 'object' ? value : {};
  }

  function builtinFilesMap() {
    var value = window.KAIRI_BUILTIN_FILES;
    return value && typeof value === 'object' ? value : {};
  }

  function ensureReady() {
    if (readyPromise) return readyPromise;
    cached = { uploaded: uploadedList(), overrides: overridesMap() };
    readyPromise = (window.KairiService
      ? window.KairiService.ready()
      : Promise.resolve(false)
    ).then(function (ok) {
      serviceUp = !!ok;
      return cached;
    });
    return readyPromise;
  }

  function all() {
    var data = cached || { uploaded: uploadedList(), overrides: overridesMap() };
    var files = builtinFilesMap();

    var list = builtins().map(function (project) {
      var merged = Object.assign({}, project, data.overrides[project.id] || {});
      merged.builtin = true;
      merged.source = 'builtin';
      merged.files = files[project.id] || project.files || [];
      return merged;
    });

    data.uploaded.forEach(function (project) {
      var copy = Object.assign({}, project);
      copy.builtin = false;
      copy.source = 'uploaded';
      list.push(copy);
    });

    return list;
  }

  function get(id) {
    var list = all();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function isUploaded(project) {
    return !!(project && project.source === 'uploaded');
  }

  function newId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------------------------------------------------------------------
     生成 projects-data.js
     --------------------------------------------------------------------- */

  var EDITABLE_FIELDS = ['name', 'en', 'subtitle', 'year', 'tagline', 'tech', 'highlights', 'detail', 'launch'];

  function pickEditable(project) {
    var out = {};
    EDITABLE_FIELDS.forEach(function (key) { out[key] = project[key]; });
    return out;
  }

  function dataFileText(uploaded, overrides, builtinFiles) {
    return '/* 由「开发者模式 · 项目管理」自动生成，请勿手改 */\n\n' +
      'window.KAIRI_UPLOADED_PROJECTS = ' + JSON.stringify(uploaded, null, 2) + ';\n\n' +
      'window.KAIRI_PROJECT_OVERRIDES = ' + JSON.stringify(overrides, null, 2) + ';\n\n' +
      'window.KAIRI_BUILTIN_FILES = ' + JSON.stringify(builtinFiles, null, 2) + ';\n';
  }

  /* ---------------------------------------------------------------------
     写入
     --------------------------------------------------------------------- */

  function requireService() {
    if (!serviceUp) {
      throw new Error('本地服务未启动，无法保存。请双击《启动博客服务.bat》。');
    }
  }

  function cleanFiles(files) {
    return (files || []).map(function (item) {
      var out = { path: item.path, size: item.size, kind: item.kind };
      if (typeof item.text === 'string') out.text = item.text;
      return out;
    });
  }

  /* ---------------------------------------------------------------------
     自动预览图
     --------------------------------------------------------------------- */

  /* 仓库里最浅层的 index.html */
  function findEntry(files) {
    var best = null;
    (files || []).forEach(function (item) {
      var base = String(item.path).split('/').pop().toLowerCase();
      if (base !== 'index.html' && base !== 'index.htm') return;
      var depth = String(item.path).split('/').length;
      if (!best || depth < best.depth) best = { path: item.path, depth: depth };
    });
    return best ? best.path : '';
  }

  function applyCover(project, coverPath) {
    var shots = (project.screenshots || []).filter(function (item) {
      return item && item.src !== coverPath;
    });
    shots.unshift({ src: coverPath, caption: '自动生成的预览图' });
    project.screenshots = shots.slice(0, 8);
    project.cover = coverPath;
  }

  /* 运行方式：有启动命令 + 有预览地址 = 网页应用；有命令没地址 = 本机桌面程序 */
  function launchMode(launch) {
    var value = launch || {};
    if (value.url) return 'web';
    if (value.command) return 'desktop';
    return 'static';
  }

  function takeScreenshot(project, launchOverride) {
    var service = window.KairiService;
    if (!service || !serviceUp) return Promise.resolve(null);
    var launch = launchOverride || project.launch || {};
    var entry = launch.entry || findEntry(project.files);
    // 没有启动命令、没有地址、也没有页面，就没法截
    if (!launch.command && !launch.url && !entry) return Promise.resolve(null);
    return service.screenshot({
      projectId: project.id,
      name: project.name,
      mode: launchMode(launch),
      entry: entry || 'index.html',
      command: launch.command,
      cwd: launch.cwd,
      url: launch.url,
      waitMs: launch.waitMs
    }).then(function (res) {
      return (res && res.ok) ? res.path : null;
    }).catch(function () { return null; });
  }

  /* 手动"重新生成预览图"：截完顺便写回清单 */
  function regenerateCover(project, launchOverride) {
    return ensureReady().then(function (data) {
      requireService();
      var launch = launchOverride || project.launch || {};
      var target = launch.entry || findEntry(project.files);
      if (!launch.command && !launch.url && !target) {
        throw new Error('这个项目没有 index.html，也没有配置「运行方式」，没法截图。请在编辑页填上启动命令和预览地址。');
      }
      return window.KairiService.screenshot({
        projectId: project.id,
        name: project.name,
        mode: launchMode(launch),
        entry: target || 'index.html',
        command: launch.command,
        cwd: launch.cwd,
        url: launch.url,
        waitMs: launch.waitMs
      }).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.message) || '截图失败');
        var cover = res.path;
        if (project.builtin) return cover;

        var uploaded = data.uploaded.slice();
        var index = -1;
        for (var i = 0; i < uploaded.length; i++) {
          if (uploaded[i].id === project.id) { index = i; break; }
        }
        if (index >= 0) {
          // 表单里的运行方式也一并写回，省得"识别到了但没保存"
          var updated = Object.assign({}, uploaded[index], { launch: launch });
          applyCover(updated, cover);
          uploaded[index] = updated;
        }
        return window.KairiService
          .writeDataFile('projects', dataFileText(uploaded, data.overrides, builtinFilesMap()))
          .then(function () {
            cached = { uploaded: uploaded, overrides: data.overrides };
            window.KAIRI_UPLOADED_PROJECTS = uploaded;
            return cover;
          });
      });
    });
  }

  /* project: 元数据；files: [{path, file?, ...}]（带 file 的会被上传）；removed: 要删的路径 */
  function saveProject(project, files, removed, options) {
    var opts = options || {};
    return ensureReady().then(function (data) {
      var uploaded = data.uploaded.slice();
      var overrides = Object.assign({}, data.overrides);
      var builtinFiles = Object.assign({}, builtinFilesMap());
      var isBuiltin = !!project.builtin;

      if (isBuiltin) {
        overrides[project.id] = pickEditable(project);
        if (files && files.length) builtinFiles[project.id] = cleanFiles(files);
      } else {
        project.files = cleanFiles(project.files || files);
        project.storage = 'files';
        var index = -1;
        for (var i = 0; i < uploaded.length; i++) {
          if (uploaded[i].id === project.id) { index = i; break; }
        }
        if (index >= 0) uploaded[index] = project;
        else uploaded.push(project);
      }

      var chain = Promise.resolve();
      var service = window.KairiService;

      (files || []).forEach(function (item) {
        chain = chain.then(function () {
          if (!item.file) return null;
          return service.putFile(project.id, item.path, item.file);
        });
      });

      (removed || []).forEach(function (path) {
        chain = chain.then(function () { return service.deleteFile(project.id, path); });
      });

      return chain
        .then(function () {
          if (isBuiltin) return null;
          // 用户选了「不运行程序」就跳过截图，保留原来的封面
          if (opts.skipScreenshot) return null;
          // 先截图（有 index.html 才截），再写清单，保证清单里的封面路径是对的
          return takeScreenshot(project).then(function (cover) {
            if (!cover) return null;
            applyCover(project, cover);
            var idx = -1;
            for (var k = 0; k < uploaded.length; k++) {
              if (uploaded[k].id === project.id) idx = k;
            }
            if (idx >= 0) uploaded[idx] = project;
            return null;
          });
        })
        .then(function () {
          return service.writeDataFile('projects', dataFileText(uploaded, overrides, builtinFiles));
        })
        .then(function () {
          cached = { uploaded: uploaded, overrides: overrides };
          window.KAIRI_UPLOADED_PROJECTS = uploaded;
          window.KAIRI_PROJECT_OVERRIDES = overrides;
          window.KAIRI_BUILTIN_FILES = builtinFiles;
        });
    });
  }

  function deleteProject(project) {
    if (!project || project.builtin) {
      return Promise.reject(new Error('内置项目不能删除'));
    }
    return ensureReady().then(function (data) {
      requireService();
      var uploaded = data.uploaded.filter(function (item) { return item.id !== project.id; });
      var overrides = Object.assign({}, data.overrides);
      delete overrides[project.id];

      return window.KairiService.deleteProject(project.id)
        .then(function () {
          return window.KairiService.writeDataFile('projects', dataFileText(uploaded, overrides, builtinFilesMap()));
        })
        .then(function () {
          cached = { uploaded: uploaded, overrides: overrides };
          window.KAIRI_UPLOADED_PROJECTS = uploaded;
        });
    });
  }

  function status() {
    return {
      service: serviceUp,
      port: window.KairiService ? window.KairiService.PORT : 0
    };
  }

  window.KairiProjects = {
    ensureReady: ensureReady,
    all: all,
    get: get,
    builtins: builtins,
    isUploaded: isUploaded,
    newId: newId,
    saveProject: saveProject,
    deleteProject: deleteProject,
    regenerateCover: regenerateCover,
    findEntry: findEntry,
    status: status,
    cleanFiles: cleanFiles,
    requireService: requireService,
    TEXT_LIMIT: TEXT_LIMIT,
    TOTAL_TEXT_LIMIT: TOTAL_TEXT_LIMIT,
    DATA_FILE: 'projects/projects-data.js'
  };
})();
