/* ==========================================================================
   Kairi 的小站 · 站点外壳
   导航 / 页脚注入、开场渐变、星空粒子、滚动进场、打字机、通用工具
   所有页面都会引入本文件。
   ========================================================================== */
(function () {
  'use strict';

  var body = document.body;
  var PAGE = body.getAttribute('data-page') || 'home';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     通用工具
     --------------------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getParam(name) {
    var match = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    if (!match) return '';
    try {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    } catch (err) {
      return match[1];
    }
  }

  function formatDate(iso) {
    var text = String(iso || '').trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (m) return m[1] + '.' + m[2] + '.' + m[3];
    return text || '未标注日期';
  }

  function todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function toast(message, kind) {
    var host = document.querySelector('[data-toast-host]');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('data-toast-host', '');
      body.appendChild(host);
    }
    var item = document.createElement('div');
    item.className = 'toast' + (kind ? ' toast--' + kind : '');
    item.textContent = message;
    host.appendChild(item);
    window.setTimeout(function () {
      item.classList.add('is-out');
      window.setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 420);
    }, 2600);
  }

  function copyText(text, okMessage) {
    function fallbackCopy() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      body.removeChild(area);
      return ok;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(okMessage || '已复制到剪贴板');
      }).catch(function () {
        toast(fallbackCopy() ? (okMessage || '已复制到剪贴板') : '复制失败，请手动选中复制', fallbackCopy() ? '' : 'warn');
      });
      return;
    }
    toast(fallbackCopy() ? (okMessage || '已复制到剪贴板') : '复制失败，请手动选中复制');
  }

  /* ---------------------------------------------------------------------
     导航与页脚
     --------------------------------------------------------------------- */

  var NAV_LINKS = [
    { key: 'home', label: '首页', href: 'index.html' },
    { key: 'articles', label: '文章', href: 'articles.html' },
    { key: 'projects', label: '项目', href: 'projects.html' },
    { key: 'about', label: '关于', href: 'index.html#about' }
  ];

  function activeKey() {
    if (PAGE === 'article' || PAGE === 'articles') return 'articles';
    if (PAGE === 'projects' || PAGE === 'project' || PAGE === 'project-intro' || PAGE === 'project-play') return 'projects';
    if (PAGE === 'about') return 'about';
    return 'home';
  }

  function buildNav() {
    var current = activeKey();
    var links = NAV_LINKS.map(function (item) {
      var cls = item.key === current ? ' class="is-active"' : '';
      return '<a href="' + item.href + '" data-nav="' + item.key + '"' + cls + '>' + item.label + '</a>';
    }).join('');

    var music = PAGE === 'home'
      ? '<button class="nav__music" id="navMusic" type="button" aria-label="播放背景音乐" aria-pressed="false" title="点一下播放背景音乐">' +
          '<span class="nav__music-icon">♪</span><span class="nav__music-text">音乐</span>' +
        '</button>'
      : '';

    var auth = window.KairiAuth;
    var currentRole = auth && auth.role ? auth.role() : null;
    var badge = '';
    if (currentRole) {
      badge = '<button class="nav__id nav__id--' + (currentRole === 'dev' ? 'dev' : 'guest') + '" ' +
        'id="identityBtn" type="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="nav__id-dot" aria-hidden="true"></span>' +
        (currentRole === 'dev' ? '开发者模式' : '访客') +
      '</button>';
    }

    return '' +
      '<header class="nav" id="nav">' +
        '<a class="nav__brand" href="index.html">' +
          '<span class="nav__mark"><span class="nav__halo"></span></span>' +
          '<span class="nav__text">Kairi<span class="nav__dot">·</span>小站</span>' +
        '</a>' +
        '<nav class="nav__links" aria-label="主导航">' + links + '</nav>' +
        '<div class="nav__side">' + music + badge + '</div>' +
      '</header>';
  }

  function buildFooter() {
    return '' +
      '<footer class="footer">' +
        '<div class="wrap footer__inner">' +
          '<div class="footer__brand">' +
            '<span class="nav__mark"><span class="nav__halo"></span></span>' +
            '<div>' +
              '<p class="footer__name">Kairi 的小站</p>' +
              '<p class="footer__motto">记录代码、星空与安静的时刻。</p>' +
            '</div>' +
          '</div>' +
          '<nav class="footer__links" aria-label="页脚导航">' +
            '<a href="index.html">首页</a>' +
            '<a href="articles.html">文章</a>' +
            '<a href="projects.html">项目</a>' +
            '<a href="index.html#about">关于</a>' +
            '<a href="#" class="footer__top js-top">回到顶部 ↑</a>' +
          '</nav>' +
          '<p class="footer__copy">© 2026 Kairi 的小站 · 用星空与音乐搭建</p>' +
        '</div>' +
      '</footer>';
  }

  function mountLayout() {
    /* 登录页不要导航和页脚，但需要星空等通用能力 */
    if (body.getAttribute('data-no-layout') === '1') return;

    var navHost = document.querySelector('[data-site-nav]');
    if (navHost) {
      navHost.outerHTML = buildNav();
    } else if (document.getElementById('nav')) {
      // 已经挂过一次（就内嵌登录后按新身份重建）：直接把旧的换掉，别插第二份
      document.getElementById('nav').outerHTML = buildNav();
    } else {
      body.insertAdjacentHTML('afterbegin', buildNav());
    }

    var footHost = document.querySelector('[data-site-footer]');
    if (footHost) {
      footHost.outerHTML = buildFooter();
    } else if (!document.querySelector('.footer')) {
      body.insertAdjacentHTML('beforeend', buildFooter());
    }
  }

  mountLayout();

  var nav = document.getElementById('nav');

  function syncNav() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  if (nav) {
    syncNav();
    window.addEventListener('scroll', syncNav, { passive: true });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('.js-top') : null;
    if (!link) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------------------
     身份徽章 + 账号面板
     --------------------------------------------------------------------- */

  var identityPanel = null;

  function closeIdentityPanel() {
    if (!identityPanel) return;
    var node = identityPanel;
    identityPanel = null;
    node.classList.remove('is-open');
    var badge = document.getElementById('identityBtn');
    if (badge) badge.setAttribute('aria-expanded', 'false');
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 240);
  }

  /* 这两个只听一次，身份面板重绑时不会越挂越多 */
  document.addEventListener('click', function (event) {
    if (!identityPanel) return;
    if (identityPanel.contains(event.target)) return;
    closeIdentityPanel();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeIdentityPanel();
  });

  /* 可重复调用：就地登录后按新身份重建徽章，这里再绑一次即可 */
  function initIdentity() {
    var auth = window.KairiAuth;
    var badge = document.getElementById('identityBtn');
    if (!auth || !badge) return;

    var isDev = auth.role() === 'dev';

    function passwordFormHtml() {
      return '' +
        '<form class="idpanel__form" id="pwForm" autocomplete="off">' +
          '<p class="idpanel__title">修改密码</p>' +
          '<input class="field__input" id="pwOld" type="password" placeholder="当前密码" />' +
          '<input class="field__input" id="pwNew" type="password" placeholder="新密码（至少 6 位）" />' +
          '<input class="field__input" id="pwNew2" type="password" placeholder="再输一次新密码" />' +
          '<button class="btn btn--primary btn--tiny" type="submit">保存新密码</button>' +
        '</form>';
    }

    function bindPasswordForm() {
      var form = panel.querySelector('#pwForm');
      if (!form) return;
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var oldPassword = form.querySelector('#pwOld').value;
        var newPassword = form.querySelector('#pwNew').value;
        var again = form.querySelector('#pwNew2').value;
        if (newPassword !== again) {
          toast('两次输入的新密码不一致', 'warn');
          return;
        }
        auth.changePassword(oldPassword, newPassword).then(function (result) {
          if (!result.ok) {
            toast(result.message || '修改失败', 'warn');
            return;
          }
          form.reset();
          toast('密码已更新，下次请用新密码登录');
          closeIdentityPanel();
        });
      });
    }

    function openPanel() {
      var panel = document.createElement('div');
      panel.className = 'idpanel';
      panel.innerHTML =
        '<p class="idpanel__role">当前身份：<b>' + (isDev ? '开发者' : '访客') + '</b></p>' +
        '<p class="idpanel__hint">' +
          (isDev
            ? '可以新建 / 编辑 / 删除文章与项目，也可以上传项目文件。'
            : '访客只能浏览：文章、项目介绍、项目体验、项目文件（只读）。') +
        '</p>' +
        (isDev ? passwordFormHtml() : '') +
        '<button class="btn btn--ghost btn--small" type="button" id="logoutBtn">退出登录</button>';
      body.appendChild(panel);
      identityPanel = panel;
      window.requestAnimationFrame(function () {
        if (identityPanel === panel) panel.classList.add('is-open');
      });
      badge.setAttribute('aria-expanded', 'true');

      panel.querySelector('#logoutBtn').addEventListener('click', function () { auth.logout(); });
      if (isDev) bindPasswordForm();
    }

    badge.addEventListener('click', function (event) {
      event.stopPropagation();
      if (identityPanel) closeIdentityPanel();
      else openPanel();
    });
  }

  initIdentity();

  /* 就地登录（主页不跳页）之后：按新身份重建导航，并补上开发者提示 */
  function refreshIdentity() {
    mountLayout();
    nav = document.getElementById('nav');
    if (nav) syncNav();
    initIdentity();
    var auth = window.KairiAuth;
    if (auth && auth.role() === 'dev' && auth.takePendingNotice()) {
      toast('当前为开发者模式：可以新建 / 编辑 / 删除文章与项目，也可以上传项目文件。');
    }
  }

  if (window.KairiAuth && window.KairiAuth.role() === 'dev' && window.KairiAuth.takePendingNotice()) {
    toast('当前为开发者模式：可以新建 / 编辑 / 删除文章与项目，也可以上传项目文件。');
  }

  /* ---------------------------------------------------------------------
     开场渐变
     --------------------------------------------------------------------- */

  var hasIntro = !!document.querySelector('.intro');
  var revealed = false;

  function revealSite() {
    if (revealed) return;
    revealed = true;
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
  }

  function startIntroSequence() {
    if (!hasIntro) {
      // 内页：不做遮罩，直接触发入场动画
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(revealSite);
      });
      return;
    }
    var introMin = reducedMotion ? 120 : 900;
    var started = (window.performance && performance.now) ? performance.now() : Date.now();

    function afterLoad() {
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      window.setTimeout(revealSite, Math.max(0, introMin - (now - started)));
    }

    if (document.readyState === 'complete') afterLoad();
    else {
      window.addEventListener('load', afterLoad);
      window.setTimeout(revealSite, 3600);
    }
  }

  /* 首页是就地登录的：登录卡片挡在前面时先不放开场渐变（否则动画在卡片背后自己走完，
     等真正进站就什么都看不到了）。等登录成功那一下再放，正好是"进入主界面"的特效。 */
  var gateUpFront = document.documentElement.classList.contains('is-gate-locked') ||
    !!document.querySelector('[data-login-gate]');

  if (gateUpFront) {
    body.classList.add('is-gated');
    window.addEventListener('kairi:authed', function () {
      body.classList.remove('is-gated');
      startIntroSequence();
    }, { once: true });
  } else {
    startIntroSequence();
  }

  /* ---------------------------------------------------------------------
     星空粒子
     --------------------------------------------------------------------- */

  function initStarfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas || reducedMotion) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var host = canvas.parentElement || canvas;
    var width = 0;
    var height = 0;
    var stars = [];
    var meteors = [];
    var rafId = 0;
    var active = true;
    var startTime = (window.performance && performance.now) ? performance.now() : Date.now();

    function buildStars() {
      var count = Math.min(190, Math.max(40, Math.round((width * height) / 9000)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.88,
          r: Math.random() * 1.5 + 0.35,
          base: Math.random() * 0.45 + 0.22,
          amp: Math.random() * 0.42 + 0.14,
          speed: Math.random() * 0.0016 + 0.0004,
          phase: Math.random() * Math.PI * 2,
          pink: Math.random() < 0.16
        });
      }
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function drawStars(now) {
      var t = now - startTime;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = s.base + Math.sin(s.phase + t * s.speed) * s.amp;
        alpha = Math.max(0.04, Math.min(1, alpha));
        var rgb = s.pink ? '255,150,205' : '214,230,255';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
        ctx.fill();
        if (s.r > 1.15) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * 0.08).toFixed(3) + ')';
          ctx.fill();
        }
      }
    }

    function drawMeteors() {
      if (Math.random() < 0.004 && meteors.length < 2) {
        meteors.push({
          x: width * 0.35 + Math.random() * width * 0.6,
          y: Math.random() * height * 0.36,
          vx: -(Math.random() * 3.4 + 4.4),
          vy: Math.random() * 2 + 1.5,
          tail: Math.random() * 120 + 96,
          life: 0,
          maxLife: Math.random() * 55 + 60
        });
      }

      for (var i = meteors.length - 1; i >= 0; i--) {
        var m = meteors[i];
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        var p = m.life / m.maxLife;
        var alpha = Math.sin(Math.PI * Math.min(1, p)) * 0.85;
        var tailX = m.x - m.vx * (m.tail / 6);
        var tailY = m.y - m.vy * (m.tail / 6);
        var grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
        grad.addColorStop(0.35, 'rgba(255,170,214,' + (alpha * 0.5).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(150,190,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (p >= 1) meteors.splice(i, 1);
      }
    }

    function frame(now) {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);
      drawStars(now);
      drawMeteors();
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (active && !rafId) rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else {
        active = true;
        start();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        active = visible;
        if (visible) start();
        else stop();
      }, { threshold: 0 }).observe(host);
    }

    resize();
    start();
  }

  initStarfield();

  /* ---------------------------------------------------------------------
     滚动进场
     --------------------------------------------------------------------- */

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) {
      var parent = el.parentElement;
      var siblings = parent
        ? Array.prototype.filter.call(parent.children, function (c) {
            return c.classList && c.classList.contains('reveal');
          })
        : [];
      var index = siblings.indexOf(el);
      el.style.transitionDelay = (index > 0 ? Math.min(index, 8) * 80 : 0) + 'ms';
      observer.observe(el);
    });
  }

  initReveal();

  /* 动态插入的内容（文章卡片等）稍后需要补一次进场 */
  function revealNow(root) {
    var scope = root || document;
    var items = Array.prototype.slice.call(scope.querySelectorAll('.reveal:not(.is-in)'));
    if (!items.length) return;
    if (reducedMotion) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    items.forEach(function (el, index) {
      el.style.transitionDelay = (Math.min(index, 8) * 70) + 'ms';
    });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        items.forEach(function (el) { el.classList.add('is-in'); });
      });
    });
  }

  /* ---------------------------------------------------------------------
     打字机（仅首页）
     --------------------------------------------------------------------- */

  function initTypewriter() {
    var target = document.getElementById('typewriter');
    if (!target) return;

    var phrases = [
      '记录代码、星空与安静的时刻。',
      '把喜欢的一切，慢慢写进这里。',
      '在喧嚣世界的角落里，留一盏灯。'
    ];

    if (reducedMotion) {
      target.textContent = phrases[0];
      return;
    }

    var phraseIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var phrase = phrases[phraseIndex];
      var delay;
      if (!deleting) {
        charIndex++;
        target.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          deleting = true;
          delay = 2100;
        } else {
          delay = 105 + Math.random() * 70;
        }
      } else {
        charIndex--;
        target.textContent = phrase.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          delay = 480;
        } else {
          delay = 46;
        }
      }
      window.setTimeout(tick, delay);
    }

    window.setTimeout(tick, 1400);
  }

  initTypewriter();

  /* ---------------------------------------------------------------------
    图片灯箱（项目截图等共用）
     --------------------------------------------------------------------- */

  /* 站内确认框（比 window.confirm 更统一，也不会被浏览器拦） */
  function confirmDialog(options) {
    var opts = options || {};
    return new Promise(function (resolve) {
      var box = document.createElement('div');
      box.className = 'modal';
      box.innerHTML =
        '<div class="modal__panel modal__panel--small" role="dialog" aria-modal="true">' +
          '<div class="modal__head">' +
            '<h2 class="modal__title">' + escapeHtml(opts.title || '请确认') + '</h2>' +
          '</div>' +
          '<div class="modal__body">' +
            '<p class="modal__hint">' + escapeHtml(opts.message || '') + '</p>' +
          '</div>' +
          '<div class="modal__foot">' +
            '<span></span>' +
            '<div class="modal__buttons">' +
              '<button class="btn btn--ghost btn--small" type="button" data-confirm="cancel">取消</button>' +
              '<button class="btn btn--primary btn--small' +
                (opts.danger ? ' btn--danger-solid' : '') +
                '" type="button" data-confirm="ok">' + escapeHtml(opts.okText || '确定') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      body.appendChild(box);
      window.requestAnimationFrame(function () { box.classList.add('is-open'); });

      function done(value) {
        box.classList.remove('is-open');
        document.removeEventListener('keydown', onKey);
        window.setTimeout(function () {
          if (box.parentNode) box.parentNode.removeChild(box);
        }, 340);
        resolve(value);
      }

      function onKey(event) {
        if (event.key === 'Escape') done(false);
      }

      box.addEventListener('click', function (event) {
        var button = event.target.closest ? event.target.closest('[data-confirm]') : null;
        if (button) {
          done(button.getAttribute('data-confirm') === 'ok');
          return;
        }
        if (event.target === box) done(false);
      });
      document.addEventListener('keydown', onKey);
      window.setTimeout(function () {
        var ok = box.querySelector('[data-confirm="ok"]');
        if (ok) ok.focus();
      }, 90);
    });
  }

  function closeLightbox() {
    var box = document.querySelector('.lightbox');
    if (!box) return;
    box.classList.remove('is-open');
    var timer = window.setTimeout(function () {
      if (box.parentNode) box.parentNode.removeChild(box);
    }, 300);
    box.dataset.timer = String(timer);
  }

  function openLightbox(src, caption) {
    var existing = document.querySelector('.lightbox');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" alt="' + escapeHtml(caption || '') + '" src="' + escapeHtml(src) + '">' +
        (caption ? '<figcaption class="lightbox__caption">' + escapeHtml(caption) + '</figcaption>' : '') +
      '</figure>' +
      '<button class="lightbox__close" type="button" aria-label="关闭">×</button>';
    body.appendChild(box);
    window.requestAnimationFrame(function () { box.classList.add('is-open'); });

    box.addEventListener('click', function (event) {
      if (event.target === box || (event.target.classList && event.target.classList.contains('lightbox__close'))) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('[data-lightbox]') : null;
    if (!trigger) return;
    event.preventDefault();
    openLightbox(trigger.getAttribute('data-lightbox'), trigger.getAttribute('data-caption') || '');
  });

  /* ---------------------------------------------------------------------
     对外暴露
     --------------------------------------------------------------------- */

  window.KairiSite = {
    page: PAGE,
    reducedMotion: reducedMotion,
    escapeHtml: escapeHtml,
    getParam: getParam,
    formatDate: formatDate,
    todayISO: todayISO,
    readJSON: readJSON,
    writeJSON: writeJSON,
    toast: toast,
    copyText: copyText,
    confirm: confirmDialog,
    openLightbox: openLightbox,
    revealNow: revealNow,
    refreshIdentity: refreshIdentity
  };
})();
