/* ==========================================================================
   项目文件：文件树 + 代码查看器（零依赖，不做语法高亮）
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  var esc = S ? S.escapeHtml : function (v) { return String(v == null ? '' : v); };

  function buildTree(files) {
    var root = { name: '', dirs: {}, files: [] };
    (files || []).forEach(function (item) {
      var parts = String(item.path).split('/').filter(Boolean);
      var node = root;
      for (var i = 0; i < parts.length - 1; i++) {
        var name = parts[i];
        if (!node.dirs[name]) node.dirs[name] = { name: name, dirs: {}, files: [] };
        node = node.dirs[name];
      }
      node.files.push({ name: parts[parts.length - 1], path: item.path, meta: item });
    });
    return root;
  }

  function treeHtml(node, depth) {
    var out = '';

    Object.keys(node.dirs).sort().forEach(function (name) {
      out += '<li class="tree__dir">' +
        '<details' + (depth < 1 ? ' open' : '') + '>' +
          '<summary class="tree__summary">' +
            '<span class="tree__icon" aria-hidden="true">▸</span>' +
            '<span class="tree__name">' + esc(name) + '</span>' +
          '</summary>' +
          '<ul class="tree__list">' + treeHtml(node.dirs[name], depth + 1) + '</ul>' +
        '</details>' +
      '</li>';
    });

    node.files.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh-Hans-CN'); })
      .forEach(function (file) {
        var size = file.meta && typeof file.meta.size === 'number' ? file.meta.size : 0;
        var sizeText = window.KairiAnalyze ? window.KairiAnalyze.formatSize(size) : size + ' B';
        out += '<li class="tree__file">' +
          '<button class="tree__button" type="button" data-path="' + esc(file.path) + '">' +
            '<span class="tree__name">' + esc(file.name) + '</span>' +
            '<span class="tree__size">' + esc(sizeText) + '</span>' +
          '</button>' +
        '</li>';
      });

    return out;
  }

  function codeHtml(text) {
    var lines = String(text).split('\n');
    var width = String(lines.length).length;
    return '<pre class="code"><code>' + lines.map(function (line, index) {
      var no = String(index + 1).padStart(width, ' ');
      return '<span class="code__line"><span class="code__no">' + no + '</span>' + esc(line) + '</span>';
    }).join('') + '</code></pre>';
  }

  /**
   * 挂载「文件树 + 查看器」
   * options.files        [{path, size, kind, text}]
   * options.basePrefix   图片相对路径前缀（上传项目用 projects/<id>/）
   */
  function mount(host, options) {
    if (!host) return;
    var opts = options || {};
    var files = opts.files || [];

    if (!files.length) {
      host.innerHTML = '<p class="empty">这个项目还没有文件记录。</p>';
      return;
    }

    host.innerHTML =
      '<div class="explorer">' +
        '<aside class="explorer__tree">' +
          '<p class="explorer__title">' +
            '<span>' + esc(opts.title || '项目文件') + '</span>' +
            '<span class="explorer__count">' + files.length + ' 个文件</span>' +
          '</p>' +
          '<ul class="tree__list tree__list--root">' + treeHtml(buildTree(files), 0) + '</ul>' +
        '</aside>' +
        '<section class="explorer__view">' +
          '<div class="explorer__bar">' +
            '<span class="explorer__path" id="explorerPath">选择一个文件查看内容</span>' +
            '<button class="btn btn--ghost btn--tiny" type="button" id="explorerCopy" hidden>复制代码</button>' +
          '</div>' +
          '<div class="explorer__code" id="explorerCode">' +
            '<p class="empty">左侧点开任意文件即可查看内容。</p>' +
          '</div>' +
        '</section>' +
      '</div>';

    var pathEl = host.querySelector('#explorerPath');
    var codeEl = host.querySelector('#explorerCode');
    var copyBtn = host.querySelector('#explorerCopy');
    var byPath = {};
    files.forEach(function (item) { byPath[item.path] = item; });
    var current = null;
    var currentText = null;

    function selectButton(path) {
      var buttons = host.querySelectorAll('.tree__button');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('is-active', buttons[i].getAttribute('data-path') === path);
      }
    }

    function show(path) {
      var item = byPath[path];
      if (!item) return;
      current = item;
      pathEl.textContent = item.path;
      selectButton(path);

      if (item.kind === 'image') {
        codeEl.innerHTML = '<figure class="explorer__image">' +
          '<img src="' + esc((opts.basePrefix || '') + item.path) + '" alt="' + esc(item.path) + '" loading="lazy">' +
          '<figcaption>' + esc(item.path) + '</figcaption></figure>';
        copyBtn.hidden = true;
        return;
      }

      currentText = typeof item.text === 'string' ? item.text : null;

      if (typeof item.text !== 'string') {
        var service = window.KairiService;
        if (opts.projectId && service && service.available()) {
          codeEl.innerHTML = '<p class="empty">正在从本地服务读取…</p>';
          copyBtn.hidden = true;
          fetch(service.fileUrl(opts.projectId, item.path), { cache: 'no-store' })
            .then(function (res) { return res.ok ? res.text() : null; })
            .then(function (text) {
              if (current !== item) return;
              if (text == null) {
                codeEl.innerHTML = '<p class="empty">读取失败（可能是二进制文件）。</p>';
                return;
              }
              currentText = text;
              codeEl.innerHTML = codeHtml(text);
              copyBtn.hidden = false;
            })
            .catch(function () {
              codeEl.innerHTML = '<p class="empty">读取失败。</p>';
            });
          return;
        }
        codeEl.innerHTML = '<p class="empty">' +
          (item.kind === 'binary'
            ? '这个文件是二进制，没有可显示的内容。'
            : '这个文件没有内联内容（超出内联预算）。启动本地服务后可以直接读取。') +
          '</p>';
        copyBtn.hidden = true;
        return;
      }

      codeEl.innerHTML = codeHtml(item.text);
      copyBtn.hidden = false;
    }

    host.querySelector('.explorer__tree').addEventListener('click', function (event) {
      var btn = event.target.closest ? event.target.closest('.tree__button') : null;
      if (!btn) return;
      show(btn.getAttribute('data-path'));
    });

    copyBtn.addEventListener('click', function () {
      if (currentText == null) return;
      S.copyText(currentText, '代码已复制');
    });
  }

  window.KairiFiles = {
    mount: mount,
    buildTree: buildTree,
    codeHtml: codeHtml
  };
})();
