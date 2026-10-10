/* ==========================================================================
   本地服务客户端

   服务只监听 127.0.0.1:8765，负责写/读项目文件、写数据文件、存点赞评论。
   服务没启动时全部优雅降级（浏览照常，写入与互动受限）。
   ========================================================================== */
(function () {
  'use strict';

  var PORT = 8765;
  var BASE = 'http://127.0.0.1:' + PORT;

  var readyPromise = null;
  var availableNow = false;

  function url(path) {
    return BASE + path;
  }

  function ping() {
    if (typeof fetch !== 'function') return Promise.resolve(false);
    return fetch(url('/api/ping'), { cache: 'no-store' })
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  /* 只探测一次，避免每个页面都打一遍 */
  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = ping().then(function (ok) {
      availableNow = ok;
      return ok;
    });
    return readyPromise;
  }

  function available() {
    return availableNow;
  }

  function jsonFetch(path, options) {
    var opts = options || {};
    return fetch(url(path), {
      method: opts.method || 'GET',
      cache: 'no-store',
      headers: opts.body ? { 'Content-Type': 'application/json; charset=utf-8' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (err) { data = null; }
        if (!res.ok) {
          throw new Error((data && data.message) || ('服务返回 ' + res.status));
        }
        return data;
      });
    });
  }

  function encodePath(projectId, filePath) {
    var parts = String(filePath).split('/').filter(Boolean).map(function (part) {
      return encodeURIComponent(part);
    });
    return encodeURIComponent(projectId) + '/' + parts.join('/');
  }

  function putFile(projectId, filePath, data) {
    return fetch(url('/api/file/' + encodePath(projectId, filePath)), {
      method: 'PUT',
      cache: 'no-store',
      body: data
    }).then(function (res) {
      if (!res.ok) throw new Error('写入 ' + filePath + ' 失败（' + res.status + '）');
      return res.json();
    });
  }

  function fileUrl(projectId, filePath) {
    return url('/api/file/' + encodePath(projectId, filePath));
  }

  function deleteFile(projectId, filePath) {
    return fetch(url('/api/file/' + encodePath(projectId, filePath)), { method: 'DELETE' })
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  function deleteProject(projectId) {
    return fetch(url('/api/project/' + encodeURIComponent(projectId)), { method: 'DELETE' })
      .then(function (res) {
        if (!res.ok) throw new Error('删除项目失败（' + res.status + '）');
        return res.json();
      });
  }

  function writeDataFile(kind, text) {
    var target = kind === 'articles' ? '/api/data/articles' : '/api/data/projects';
    return fetch(url(target), {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: text
    }).then(function (res) {
      if (!res.ok) throw new Error('写入数据文件失败（' + res.status + '）');
      return res.json();
    });
  }

  function getSocial() {
    return jsonFetch('/api/social');
  }

  function like(articleId, delta) {
    return jsonFetch('/api/social/like', { method: 'POST', body: { articleId: articleId, delta: delta } });
  }

  function comment(articleId, author, text) {
    return jsonFetch('/api/social/comment', {
      method: 'POST',
      body: { articleId: articleId, author: author, text: text }
    });
  }

  function deleteComment(articleId, commentId) {
    return jsonFetch('/api/social/delete-comment', {
      method: 'POST',
      body: { articleId: articleId, commentId: commentId }
    });
  }

  function reply(articleId, commentId, text) {
    return jsonFetch('/api/social/reply', {
      method: 'POST',
      body: { articleId: articleId, commentId: commentId, text: text }
    });
  }

  /* 让服务把项目跑起来（可选）再截图，作为封面
     options: { projectId, name, mode, entry, command, cwd, url, waitMs }
     mode: web（起服务 + 浏览器截图）/ static（直接打开页面）/ desktop（跑起来抓程序窗口） */
  function screenshot(options) {
    var opts = options || {};
    return jsonFetch('/api/screenshot', {
      method: 'POST',
      body: {
        projectId: opts.projectId,
        name: opts.name || '',
        mode: opts.mode || '',
        entry: opts.entry || 'index.html',
        command: opts.command || '',
        cwd: opts.cwd || '',
        url: opts.url || '',
        waitMs: opts.waitMs || 15000
      }
    });
  }

  window.KairiService = {
    PORT: PORT,
    base: function () { return BASE; },
    ready: ready,
    available: available,
    ping: ping,
    putFile: putFile,
    fileUrl: fileUrl,
    deleteFile: deleteFile,
    deleteProject: deleteProject,
    writeDataFile: writeDataFile,
    getSocial: getSocial,
    like: like,
    comment: comment,
    deleteComment: deleteComment,
    reply: reply,
    screenshot: screenshot
  };
})();
