/* ==========================================================================
   收录 · 资料阅读器（material.html）

   · 用 pdf.js 把每一页画成 canvas，一页一页竖着排下来 —— 向下滚动就能翻完整份资料
     （浏览器自带的 PDF 阅读器把滚动锁在 iframe 里，所以这里自己画）
   · 开发者可以在页面上用笔批注：笔画按「页内归一化坐标」保存，缩放 / 换设备都不会错位
   · 批注存在 Study/annotations/<资料id>.json，由本地服务写入；服务没启动时只存在本机

   ⚠️ file:// 下不能直接读同目录文件（浏览器拦截 XHR），所以 PDF、cmaps 与批注
   在 file:// 下一律走本地服务（127.0.0.1:8765，已验证跨源可用）；
   服务没启动时退回浏览器自带的 PDF 阅读器（iframe），此时批注不可用。
   ========================================================================== */
(function () {
  'use strict';

  var S = window.KairiSite;
  var stage = document.getElementById('readerStage');
  if (!S || !stage) return;

  var esc = S.escapeHtml;
  var service = window.KairiService;
  var M = window.KairiMaterials;
  var material = M ? M.find(S.getParam('id')) : null;
  var head = document.getElementById('readerHead');
  var bar = document.getElementById('readerBar');
  var noticeBox = document.getElementById('readerNotice');
  var canEdit = !!(window.KairiAuth && window.KairiAuth.canEdit());

  var ANNOTATION_DIR = 'Study/annotations/';
  var PENS = ['#FF2E63', '#FF9F1C', '#32D583', '#4D9DFF', '#A06BFF', '#1F2937'];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  /* 一张画布最多留多少像素：20 页 A4 在高分屏下如果全都按 2 倍存，
     总共上亿像素，浏览器会把画布丢掉（页面就白了），所以按页压住上限 */
  var MAX_PAGE_PIXELS = 4.5e6;
  /* 同时最多保留几张"已渲染"的页面；离得远的先腾出来，滚回去再画 */
  var MAX_LIVE_PAGES = 6;

  var state = {
    doc: null,
    pages: [],
    strokes: [],
    scale: 1,
    fit: true,
    tool: 'off',
    color: PENS[0],
    size: 3,
    dirty: false,
    current: 1,
    /* 每次重新排版（缩放 / 改窗口）都 +1，用来丢弃"上一版布局"里还在跑的渲染 */
    gen: 0
  };

  /* ---------------------------------------------------------------------
     小工具
     --------------------------------------------------------------------- */

  /* 根目录下的相对路径 → 浏览器能取的地址（file:// 下换成走本地服务的地址） */
  function asset(rel) {
    if (service && service.assetUrl) return service.assetUrl(rel);
    return String(rel).split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function plainAsset(rel) {
    return String(rel).split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function safeId(value) {
    return String(value || '').replace(/[^A-Za-z0-9_-]/g, '') || 'material';
  }

  function annotationRel() {
    return ANNOTATION_DIR + safeId(material.id) + '.json';
  }

  var noticeTimer = 0;
  function notice(text, kind) {
    if (!noticeBox) return;
    window.clearTimeout(noticeTimer);
    if (!text) {
      noticeBox.hidden = true;
      noticeBox.textContent = '';
      return;
    }
    noticeBox.textContent = text;
    noticeBox.className = 'reader__notice' + (kind === 'ok' ? ' reader__notice--ok' : '');
    noticeBox.hidden = false;
    if (kind === 'ok') {
      noticeTimer = window.setTimeout(function () { noticeBox.hidden = true; }, 3600);
    }
  }

  /* ---------------------------------------------------------------------
     资料头部
     --------------------------------------------------------------------- */

  function renderHead() {
    document.title = material.title + ' · 收录 · Kairi 的小站';

    var meta = [
      '<span>' + esc(material.file || '未指定文件') + '</span>'
    ];
    material.tags.forEach(function (tag) {
      meta.push('<span class="card__sep">·</span><span class="chip">' + esc(tag) + '</span>');
    });

    var actions = [
      '<a class="btn btn--ghost btn--small" href="' + esc(plainAsset(material.file)) + '" target="_blank" rel="noopener">在新窗口打开 PDF</a>'
    ];
    if (canEdit) {
      actions.push('<a class="btn btn--ghost btn--small" href="study.html?edit=' + encodeURIComponent(material.id) + '">编辑资料</a>');
      actions.push('<button class="btn btn--ghost btn--small btn--danger" type="button" id="materialDelete">删除收录</button>');
    }

    head.innerHTML =
      '<p class="reader__kicker"><a href="study.html">收录</a> / ' +
        esc(S.formatDate(material.date)) + '</p>' +
      '<h1 class="reader__title">' + esc(material.title) + '</h1>' +
      (material.source ? '<p class="reader__source">' + esc(material.source) + '</p>' : '') +
      '<p class="reader__meta">' + meta.join('') + '</p>' +
      (material.summary ? '<p class="reader__hint">' + esc(material.summary) + '</p>' : '') +
      '<div class="reader__actions">' + actions.join('') + '</div>';

    var del = document.getElementById('materialDelete');
    if (del) {
      del.addEventListener('click', function () {
        S.confirm({
          title: '删除收录',
          message: '确定把《' + material.title + '》从收录里删掉吗？只删除这条记录，Study 文件夹里的 PDF 会保留。',
          okText: '删除',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          M.remove(material.id);
          window.location.href = 'study.html';
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     批注：读 / 写
     --------------------------------------------------------------------- */

  function clamp01(value) {
    if (!isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function tidyStrokes(list, pageCount) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (raw) {
      if (!raw || typeof raw !== 'object') return;
      var page = Math.round(Number(raw.page));
      if (!(page >= 1) || (pageCount && page > pageCount)) return;
      if (!Array.isArray(raw.points) || !raw.points.length) return;
      var width = Number(raw.width);
      var points = [];
      raw.points.slice(0, 6000).forEach(function (pt) {
        if (!Array.isArray(pt) || pt.length < 2) return;
        points.push([clamp01(Number(pt[0])), clamp01(Number(pt[1]))]);
      });
      if (!points.length) return;
      out.push({
        page: page,
        color: typeof raw.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(raw.color) ? raw.color : PENS[0],
        width: isFinite(width) && width > 0.0001 && width < 0.3 ? width : 0.004,
        points: points
      });
    });
    return out;
  }

  function localAnnotations() {
    var all = S.readJSON('kairi_annotations_v1', null) || {};
    return all[safeId(material.id)] || null;
  }

  function saveLocalAnnotations(payload) {
    var all = S.readJSON('kairi_annotations_v1', null) || {};
    all[safeId(material.id)] = payload;
    S.writeJSON('kairi_annotations_v1', all);
  }

  function loadAnnotations(pageCount) {
    /* 批注只有开发者能看到：访客连读都不读（Study/annotations/ 也不进版本库） */
    if (!canEdit) return Promise.resolve([]);

    var url = asset(annotationRel());
    var fetched = (typeof fetch === 'function')
      ? fetch(url, { cache: 'no-store' }).then(function (res) {
          return res.ok ? res.json() : null;
        }).catch(function () { return null; })
      : Promise.resolve(null);

    return fetched.then(function (data) {
      var local = localAnnotations();
      var pick = null;
      if (data && Array.isArray(data.strokes)) {
        pick = (local && (local.updatedAt || 0) > (data.updatedAt || 0)) ? local : data;
      } else {
        pick = local;
      }
      return tidyStrokes(pick && pick.strokes, pageCount);
    });
  }

  function saveAnnotations() {
    var payload = {
      version: 1,
      materialId: safeId(material.id),
      title: material.title,
      file: material.file,
      updatedAt: Date.now(),
      strokes: state.strokes
    };
    var text = JSON.stringify(payload);

    function storeLocal() {
      saveLocalAnnotations(payload);
      state.dirty = false;
      syncSaveButton();
    }

    if (!service) {
      storeLocal();
      notice('没有加载本地服务客户端：批注只保存在这台浏览器里。', 'warn');
      return;
    }

    return service.ready().then(function (ok) {
      if (!ok) {
        storeLocal();
        notice('本地服务没启动：批注只保存在这台浏览器里；运行「启动博客服务.bat」后可存进 Study/annotations/。', 'warn');
        return null;
      }
      return service.putStudyFile(annotationRel(), text).then(function () {
        storeLocal();
        notice('批注已保存到 ' + annotationRel(), 'ok');
      }).catch(function (err) {
        storeLocal();
        notice('批注没能写进文件（' + (err.message || err) + '），已暂存在本机。', 'warn');
      });
    });
  }

  function syncSaveButton() {
    var button = document.getElementById('penSave');
    if (!button) return;
    button.textContent = state.dirty ? '保存批注 •' : '保存批注';
    button.classList.toggle('is-active', state.dirty);
  }

  /* ---------------------------------------------------------------------
     页面渲染
     --------------------------------------------------------------------- */

  function buildBar() {
    var penTools = canEdit
      ? '<div class="reader__group reader__group--pen" id="penTools" hidden>' +
          '<button class="toolbtn" type="button" data-tool="pen" title="按住页面就能画">批注</button>' +
          '<button class="toolbtn" type="button" data-tool="eraser" title="擦掉笔画">橡皮</button>' +
          '<button class="toolbtn" type="button" id="penUndo">撤销</button>' +
          '<button class="toolbtn" type="button" id="penClear">清空本页</button>' +
          '<span class="pen-swatches" id="penColors"></span>' +
          '<span class="pen-size"><input type="range" id="penSize" min="1" max="8" step="1" value="3" title="笔尖粗细" /></span>' +
          '<button class="btn btn--tiny" type="button" id="penSave">保存批注</button>' +
        '</div>'
      : '';

    bar.innerHTML =
      '<div class="reader__group reader__group--zoom">' +
        '<button class="toolbtn" type="button" data-zoom="out" title="缩小">−</button>' +
        '<span class="reader__zoom" id="zoomLabel">100%</span>' +
        '<button class="toolbtn" type="button" data-zoom="in" title="放大">＋</button>' +
      '</div>' +
      '<button class="toolbtn reader__wide" type="button" data-zoom="fit">适合宽度</button>' +
      '<span class="reader__page" id="pageIndicator">– / –</span>' +
      penTools;
  }

  function buildSwatches() {
    var host = document.getElementById('penColors');
    if (!host) return;
    host.innerHTML = PENS.map(function (color, index) {
      return '<button class="pen-swatch' + (index === 0 ? ' is-active' : '') +
        '" type="button" data-color="' + color + '" style="background:' + color +
        '" aria-label="笔色 ' + color + '"></button>';
    }).join('');
  }

  function collectSizes(doc) {
    var jobs = [];
    for (var n = 1; n <= doc.numPages; n++) jobs.push(doc.getPage(n));
    return Promise.all(jobs).then(function (pages) {
      return pages.map(function (page) {
        var viewport = page.getViewport({ scale: 1 });
        return { w: viewport.width, h: viewport.height };
      });
    });
  }

  function fitScale(sizes) {
    var widest = 0;
    (sizes || state.pages).forEach(function (p) { if (p.w > widest) widest = p.w; });
    if (!widest) return 1;
    var available = Math.max(240, stage.clientWidth - 2);
    return Math.max(0.3, Math.min(2.4, available / widest));
  }

  function buildPages(sizes) {
    stage.innerHTML = '';
    state.pages = sizes.map(function (size, index) {
      var wrap = document.createElement('div');
      wrap.className = 'rpage';
      wrap.setAttribute('data-page', String(index + 1));

      var canvas = document.createElement('canvas');
      canvas.className = 'rpage__canvas';
      var ink = document.createElement('canvas');
      ink.className = 'rpage__ink';
      var num = document.createElement('span');
      num.className = 'rpage__num';
      num.textContent = (index + 1) + ' / ' + sizes.length;
      var skeleton = document.createElement('div');
      skeleton.className = 'rpage__skeleton';
      skeleton.textContent = '第 ' + (index + 1) + ' 页';

      wrap.appendChild(canvas);
      wrap.appendChild(ink);
      wrap.appendChild(num);
      wrap.appendChild(skeleton);
      stage.appendChild(wrap);

      return {
        n: index + 1,
        w: size.w,
        h: size.h,
        wrap: wrap,
        canvas: canvas,
        ink: ink,
        skeleton: skeleton,
        drawn: false,
        busy: false,
        task: null,
        failed: 0
      };
    });
    layoutPages();
  }

  function sizeCanvas(canvas, width, height) {
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
  }

  /* 这一页该用多大的像素密度画：CSS 尺寸太大时按上限压回来 */
  function pageDpr(p) {
    var cssPixels = Math.max(1, p.w * state.scale) * Math.max(1, p.h * state.scale);
    var allowed = Math.sqrt(MAX_PAGE_PIXELS / cssPixels);
    return Math.max(0.6, Math.min(dpr, allowed));
  }

  function layoutPages() {
    state.gen++;
    state.pages.forEach(function (p) {
      if (p.task) {
        try { p.task.cancel(); } catch (err) { /* 忽略 */ }
        p.task = null;
      }
      p.busy = false;
      var cssW = Math.max(40, Math.round(p.w * state.scale));
      var cssH = Math.max(40, Math.round(p.h * state.scale));
      p.cssW = cssW;
      p.cssH = cssH;
      p.wrap.style.width = cssW + 'px';
      p.wrap.style.height = cssH + 'px';
      var scaleToPixels = pageDpr(p);
      sizeCanvas(p.canvas, cssW * scaleToPixels, cssH * scaleToPixels);
      sizeCanvas(p.ink, cssW * scaleToPixels, cssH * scaleToPixels);
      p.drawn = false;
      if (p.skeleton) p.skeleton.hidden = false;
    });
    var label = document.getElementById('zoomLabel');
    if (label) label.textContent = Math.round(state.scale * 100) + '%';
    drawAllInk();
    renderVisible();
  }

  function renderPage(p) {
    if (p.drawn || p.busy || !state.doc) return;
    p.busy = true;
    var gen = state.gen;
    var scale = state.scale;
    var scaleToPixels = pageDpr(p);
    state.doc.getPage(p.n).then(function (page) {
      if (gen !== state.gen) return null;      /* 布局已经变了，这次结果作废 */
      var viewport = page.getViewport({ scale: scale });
      sizeCanvas(p.canvas, viewport.width * scaleToPixels, viewport.height * scaleToPixels);
      sizeCanvas(p.ink, viewport.width * scaleToPixels, viewport.height * scaleToPixels);
      var ctx = p.canvas.getContext('2d');
      var task = page.render({
        canvasContext: ctx,
        viewport: viewport,
        transform: scaleToPixels !== 1 ? [scaleToPixels, 0, 0, scaleToPixels, 0, 0] : null
      });
      p.task = task;
      return task.promise;
    }).then(function () {
      p.task = null;
      if (gen !== state.gen || p.drawn) {
        p.busy = false;                        /* 有更新的一次排版接手了 */
        return;
      }
      p.busy = false;
      p.drawn = true;
      p.failed = 0;
      if (p.skeleton) p.skeleton.hidden = true;
      drawPageInk(p);
      evictFarPages();
    }).catch(function () {
      p.task = null;
      p.busy = false;
      p.failed++;
      if (p.failed === 3 && p.skeleton) p.skeleton.textContent = '第 ' + p.n + ' 页（重试中…）';
    });
  }

  /* 只保留离视口最近的几张已渲染页面，其余把画布腾空——否则页面一多，
     浏览器会把画布丢掉，滚回去就变成白页 */
  function evictFarPages() {
    var live = state.pages.filter(function (p) { return p.drawn; });
    var top = window.scrollY;
    var bottom = top + window.innerHeight;
    /* 缩得很小时一屏可能有好几页，那"保留几张"就得跟着涨，
       否则会被反复腾掉又重画（闪个不停） */
    var onScreen = 0;
    state.pages.forEach(function (p) {
      var rect = p.wrap.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) onScreen++;
    });
    var keep = Math.max(MAX_LIVE_PAGES, onScreen + 2);
    if (live.length <= keep) return;
    live.sort(function (a, b) { return distanceToView(a, top, bottom) - distanceToView(b, top, bottom); });
    live.slice(keep).forEach(function (p) {
      p.canvas.width = 1;
      p.canvas.height = 1;
      p.ink.width = 1;
      p.ink.height = 1;
      p.drawn = false;
      if (p.skeleton) p.skeleton.hidden = false;
    });
  }

  function distanceToView(p, top, bottom) {
    var rect = p.wrap.getBoundingClientRect();
    var pageTop = rect.top + window.scrollY;
    var pageBottom = pageTop + rect.height;
    if (pageBottom < top) return top - pageBottom;
    if (pageTop > bottom) return pageTop - bottom;
    return 0;
  }

  function renderVisible() {
    var top = -window.innerHeight * 0.9;
    var bottom = window.innerHeight * 1.9;
    state.pages.forEach(function (p) {
      if (p.drawn || p.busy) return;
      var rect = p.wrap.getBoundingClientRect();
      if (rect.bottom < top || rect.top > bottom) return;
      renderPage(p);
    });
  }

  /* 改缩放 / 改窗口大小时，让"当前这一页"停在原来的位置，别把阅读位置甩丢 */
  function relayoutKeepingPosition() {
    var page = state.pages[state.current - 1];
    var before = page ? page.wrap.getBoundingClientRect().top : 0;
    layoutPages();
    if (page) {
      var after = page.wrap.getBoundingClientRect().top;
      if (after !== before) window.scrollBy(0, after - before);
    }
    updateIndicator();
  }

  /* ---------------------------------------------------------------------
     批注绘制
     --------------------------------------------------------------------- */

  function paintStroke(ctx, stroke, W, H, from, to) {
    var points = stroke.points;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = Math.max(1, stroke.width * W);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 1) {
      ctx.arc(points[0][0] * W, points[0][1] * H, Math.max(0.6, stroke.width * W / 2), 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    var start = from == null ? 0 : from;
    var end = to == null ? points.length - 1 : to;
    ctx.moveTo(points[start][0] * W, points[start][1] * H);
    for (var i = start + 1; i <= end; i++) {
      ctx.lineTo(points[i][0] * W, points[i][1] * H);
    }
    ctx.stroke();
  }

  function clearInk(p) {
    var ctx = p.ink.getContext('2d');
    ctx.clearRect(0, 0, p.ink.width, p.ink.height);
  }

  function drawPageInk(p) {
    clearInk(p);
    var ctx = p.ink.getContext('2d');
    state.strokes.forEach(function (stroke) {
      if (stroke.page !== p.n) return;
      paintStroke(ctx, stroke, p.ink.width, p.ink.height);
    });
  }

  function drawAllInk() {
    state.pages.forEach(drawPageInk);
  }

  function pageOfTarget(target) {
    var wrap = target && target.closest ? target.closest('.rpage') : null;
    if (!wrap) return null;
    var index = Number(wrap.getAttribute('data-page')) - 1;
    return state.pages[index] || null;
  }

  function localPoint(event, p) {
    var rect = p.ink.getBoundingClientRect();
    return [
      clamp01((event.clientX - rect.left) / rect.width),
      clamp01((event.clientY - rect.top) / rect.height)
    ];
  }

  function penWidthFor(p) {
    return state.size / Math.max(1, p.cssW || p.w);
  }

  function eraseAt(p, point) {
    var rx = 14 / Math.max(1, p.cssW || p.w);
    var ry = 14 / Math.max(1, p.cssH || p.h);
    var before = state.strokes.length;
    state.strokes = state.strokes.filter(function (stroke) {
      if (stroke.page !== p.n) return true;
      for (var i = 0; i < stroke.points.length; i++) {
        if (Math.abs(stroke.points[i][0] - point[0]) <= rx && Math.abs(stroke.points[i][1] - point[1]) <= ry) {
          return false;
        }
      }
      return true;
    });
    if (state.strokes.length !== before) {
      markDirty();
      drawPageInk(p);
    }
  }

  function markDirty() {
    state.dirty = true;
    syncSaveButton();
  }

  var active = null;

  function beginStroke(event, p) {
    if (state.tool === 'eraser') {
      active = { page: p, erasing: true };
      eraseAt(p, localPoint(event, p));
      return;
    }
    var stroke = {
      page: p.n,
      color: state.color,
      width: penWidthFor(p),
      points: [localPoint(event, p)]
    };
    state.strokes.push(stroke);
    active = { page: p, stroke: stroke };
    drawPageInk(p);
  }

  function extendStroke(event, p) {
    if (!active) return;
    if (active.erasing) {
      eraseAt(p, localPoint(event, p));
      return;
    }
    var stroke = active.stroke;
    if (!stroke || stroke.page !== p.n) return;
    var point = localPoint(event, p);
    var last = stroke.points[stroke.points.length - 1];
    if (Math.abs(point[0] - last[0]) < 0.0012 && Math.abs(point[1] - last[1]) < 0.0012) return;
    if (stroke.points.length >= 6000) return;
    stroke.points.push(point);
    var ctx = p.ink.getContext('2d');
    paintStroke(ctx, stroke, p.ink.width, p.ink.height, stroke.points.length - 2, stroke.points.length - 1);
  }

  function endStroke() {
    if (active && active.stroke) {
      active.stroke.points = active.stroke.points.map(function (pt) {
        return [Number(pt[0].toFixed(4)), Number(pt[1].toFixed(4))];
      });
      markDirty();
    }
    active = null;
  }

  function bindPen() {
    if (!canEdit) return;
    stage.addEventListener('pointerdown', function (event) {
      if (state.tool !== 'pen' && state.tool !== 'eraser') return;
      var p = pageOfTarget(event.target);
      if (!p) return;
      event.preventDefault();
      state.current = p.n;
      try { stage.setPointerCapture(event.pointerId); } catch (err) { /* 忽略 */ }
      beginStroke(event, p);
    });

    stage.addEventListener('pointermove', function (event) {
      if (!active) return;
      var p = pageOfTarget(event.target) || active.page;
      if (!p) return;
      event.preventDefault();
      extendStroke(event, p);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (name) {
      stage.addEventListener(name, function () { endStroke(); });
    });
  }

  function setTool(tool) {
    state.tool = state.tool === tool ? 'off' : tool;
    stage.classList.toggle('is-ink', state.tool === 'pen');
    stage.classList.toggle('is-erase', state.tool === 'eraser');
    var penBtn = bar.querySelector('[data-tool="pen"]');
    var eraserBtn = bar.querySelector('[data-tool="eraser"]');
    if (penBtn) penBtn.classList.toggle('is-active', state.tool === 'pen');
    if (eraserBtn) eraserBtn.classList.toggle('is-active', state.tool === 'eraser');
  }

  function bindTools() {
    var tools = document.getElementById('penTools');
    if (!tools) return;
    tools.hidden = false;
    buildSwatches();

    tools.addEventListener('click', function (event) {
      var target = event.target.closest ? event.target.closest('[data-tool], [data-color], #penUndo, #penClear, #penSave') : null;
      if (!target) return;

      if (target.hasAttribute('data-tool')) {
        setTool(target.getAttribute('data-tool'));
        return;
      }
      if (target.hasAttribute('data-color')) {
        state.color = target.getAttribute('data-color');
        tools.querySelectorAll('.pen-swatch').forEach(function (swatch) {
          swatch.classList.toggle('is-active', swatch.getAttribute('data-color') === state.color);
        });
        if (state.tool !== 'pen') setTool('pen');
        return;
      }
      if (target.id === 'penUndo') {
        if (!state.strokes.length) return;
        var last = state.strokes.pop();
        markDirty();
        var page = state.pages[last.page - 1];
        if (page) drawPageInk(page);
        return;
      }
      if (target.id === 'penClear') {
        var current = state.pages[state.current - 1];
        if (!current) return;
        var kept = state.strokes.filter(function (stroke) { return stroke.page !== current.n; });
        if (kept.length === state.strokes.length) {
          S.toast('第 ' + current.n + ' 页还没有批注', 'warn');
          return;
        }
        S.confirm({
          title: '清空本页批注',
          message: '把第 ' + current.n + ' 页上的笔画都擦掉？',
          okText: '清空',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          state.strokes = kept;
          markDirty();
          drawPageInk(current);
        });
        return;
      }
      if (target.id === 'penSave') saveAnnotations();
    });

    var size = document.getElementById('penSize');
    size.value = String(state.size);
    size.addEventListener('input', function () {
      state.size = Math.max(1, Math.min(8, Number(size.value) || 3));
    });
  }

  function bindZoom() {
    bar.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('[data-zoom]') : null;
      if (!button) return;
      var mode = button.getAttribute('data-zoom');
      if (mode === 'fit') {
        state.fit = true;
        state.scale = fitScale();
      } else if (mode === 'in') {
        state.fit = false;
        state.scale = Math.min(4, state.scale * 1.25);
      } else {
        state.fit = false;
        state.scale = Math.max(0.3, state.scale / 1.25);
      }
      relayoutKeepingPosition();
    });
  }

  /* ---------------------------------------------------------------------
     滚动：懒加载 + 页码
     --------------------------------------------------------------------- */

  var scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    window.requestAnimationFrame(function () {
      scrollTick = false;
      renderVisible();
      updateIndicator();
      evictFarPages();
    });
  }

  function updateIndicator() {
    var host = document.getElementById('pageIndicator');
    if (!host) return;
    var best = null;
    var bestTop = Infinity;
    state.pages.forEach(function (p) {
      var rect = p.wrap.getBoundingClientRect();
      if (rect.bottom < 90) return;
      if (rect.top < bestTop) {
        bestTop = rect.top;
        best = p;
      }
    });
    var current = best ? best.n : state.pages.length;
    state.current = current;
    host.textContent = current + ' / ' + state.pages.length;
  }

  /* ---------------------------------------------------------------------
     兜底：浏览器自带的 PDF 阅读器（服务没启动 / pdf.js 出错时）
     --------------------------------------------------------------------- */

  function useNativeViewer(reason) {
    var tools = document.getElementById('penTools');
    if (tools) tools.hidden = true;
    stage.className = 'reader__fallback';
    stage.innerHTML = '<iframe src="' + esc(plainAsset(material.file)) + '" title="' + esc(material.title) + '"></iframe>';
    if (bar) bar.hidden = true;
    notice((reason ? reason + ' ' : '') +
      '现在用浏览器自带的 PDF 阅读器打开（在框里滚动就能翻页）。' +
      (canEdit ? '想让整页滚动 + 用笔批注，请运行「启动博客服务.bat」后刷新。' : ''), 'warn');
  }

  /* ---------------------------------------------------------------------
     启动
     --------------------------------------------------------------------- */

  function renderMissing() {
    if (head) {
      head.innerHTML = '<p class="reader__kicker"><a href="study.html">收录</a></p>' +
        '<h1 class="reader__title">没有找到这份资料</h1>';
    }
    stage.innerHTML =
      '<div class="empty-state">' +
        '<p class="empty-state__title">没有找到这份资料</p>' +
        '<p class="empty-state__text">它可能已被删除，或者链接来自另一台设备。</p>' +
        '<a class="btn btn--primary" href="study.html">回到收录列表</a>' +
      '</div>';
    if (bar) bar.hidden = true;
  }

  function failSoft(reason, error) {
    useNativeViewer(reason);
    if (error && window.console && console.warn) console.warn('[收录] ', reason, error);
  }

  function boot() {
    var pdfjs = window.pdfjsLib;
    if (!pdfjs) {
      failSoft('没有加载到 PDF 渲染库，');
      return;
    }
    if (!material.file) {
      failSoft('这条收录还没有指定 PDF 文件，');
      return;
    }

    var workerPromise = fetch(asset('js/vendor/pdfjs/pdf.worker.min.js'), { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('worker ' + res.status);
        return res.text();
      })
      .then(function (text) {
        return new Worker(URL.createObjectURL(new Blob([text], { type: 'text/javascript' })));
      });

    Promise.all([
      workerPromise,
      fetch(asset(material.file), { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('PDF ' + res.status);
        return res.arrayBuffer();
      })
    ]).then(function (results) {
      pdfjs.GlobalWorkerOptions.workerPort = results[0];
      return pdfjs.getDocument({
        data: new Uint8Array(results[1]),
        cMapUrl: asset('js/vendor/pdfjs/cmaps') + '/',
        cMapPacked: true,
        standardFontDataUrl: asset('js/vendor/pdfjs/standard_fonts') + '/'
      }).promise;
    }).then(function (doc) {
      state.doc = doc;
      return collectSizes(doc).then(function (sizes) {
        state.scale = fitScale(sizes);
        buildPages(sizes);
        return loadAnnotations(doc.numPages);
      });
    }).then(function (strokes) {
      state.strokes = strokes;
      drawAllInk();
      syncSaveButton();
      updateIndicator();
      if (strokes.length) {
        notice('这份资料上有 ' + strokes.length + ' 处批注。', 'ok');
      }
    }).catch(function (err) {
      failSoft('没能自己渲染这份 PDF，', err);
    });
  }

  if (!material) {
    renderMissing();
    return;
  }

  renderHead();
  buildBar();
  bindZoom();
  bindPen();
  bindTools();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(function () {
      if (!state.pages.length) return;
      var next = state.fit ? fitScale() : state.scale;
      if (Math.abs(next - state.scale) < 0.001) return;
      state.scale = next;
      relayoutKeepingPosition();
    }, 180);
  });

  window.addEventListener('beforeunload', function (event) {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '批注还没保存，确定离开吗？';
    return event.returnValue;
  });

  notice('');
  boot();
})();
