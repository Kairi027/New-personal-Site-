/* ==========================================================================
   登录门面：会话 / 角色 / 守卫 / 改密码

   ⚠️ 这是纯前端门面，不是安全边界：密码哈希和会话都在本地，任何人查看
   源码或改 localStorage 都能绕过。它防的是"误入"，不是防"有心人"。

   必须在所有其它脚本之前加载（放在 <head> 里），未登录时在渲染前就跳转。
   ========================================================================== */
(function () {
  'use strict';

  var SESSION_KEY = 'kairi_session_v1';
  var CRED_KEY = 'kairi_devcred_v1';
  var PENDING_NOTICE_KEY = 'kairi_dev_notice_pending';
  var LOGIN_PAGE = 'login.html';

  var DEFAULT_ACCOUNT = 'kairi001176';
  var DEFAULT_PASSWORD = 'wtjzxh1979';

  /* ---------------------------------------------------------------------
     本地读写（本文件不依赖 KairiSite，因为它加载得更早）
     --------------------------------------------------------------------- */

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

  function removeKey(key) {
    try { window.localStorage.removeItem(key); } catch (err) { /* 忽略 */ }
  }

  /* ---------------------------------------------------------------------
     会话
     --------------------------------------------------------------------- */

  function session() {
    var s = readJSON(SESSION_KEY, null);
    if (!s || (s.role !== 'dev' && s.role !== 'guest')) return null;
    return s;
  }

  function role() {
    var s = session();
    return s ? s.role : null;
  }

  /* ---------------------------------------------------------------------
     密码哈希：优先 WebCrypto SHA-256，不可用时退回简单哈希
     --------------------------------------------------------------------- */

  function weakHash(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) {
      h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    }
    return 'djb2:' + h.toString(16) + ':' + text.length;
  }

  function hashPassword(account, password) {
    var text = 'kairi|' + account + '|' + password;
    var subtle = window.crypto && window.crypto.subtle;
    if (subtle && typeof window.TextEncoder !== 'undefined') {
      try {
        return subtle.digest('SHA-256', new window.TextEncoder().encode(text))
          .then(function (buf) {
            var bytes = new Uint8Array(buf);
            var out = '';
            for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
            return 'sha256:' + out;
          })
          .catch(function () { return weakHash(text); });
      } catch (err) {
        /* 落到下面的弱哈希 */
      }
    }
    return Promise.resolve(weakHash(text));
  }

  function ensureCredential() {
    var cred = readJSON(CRED_KEY, null);
    if (cred && cred.account && cred.hash) return Promise.resolve(cred);
    return hashPassword(DEFAULT_ACCOUNT, DEFAULT_PASSWORD).then(function (hash) {
      var fresh = { account: DEFAULT_ACCOUNT, hash: hash, weak: hash.indexOf('sha256:') !== 0 };
      writeJSON(CRED_KEY, fresh);
      return fresh;
    });
  }

  function isWeakHashing() {
    var cred = readJSON(CRED_KEY, null);
    return !!(cred && cred.weak);
  }

  /* ---------------------------------------------------------------------
     登录 / 登出
     --------------------------------------------------------------------- */

  function loginDev(account, password) {
    var name = String(account == null ? '' : account).trim();
    return ensureCredential().then(function (cred) {
      return hashPassword(name, String(password == null ? '' : password)).then(function (hash) {
        if (name !== cred.account || hash !== cred.hash) return false;
        writeJSON(SESSION_KEY, { role: 'dev', since: Date.now() });
        try { window.localStorage.setItem(PENDING_NOTICE_KEY, '1'); } catch (err) { /* 忽略 */ }
        return true;
      });
    });
  }

  function loginGuest() {
    writeJSON(SESSION_KEY, { role: 'guest', since: Date.now() });
    removeKey(PENDING_NOTICE_KEY);
    return true;
  }

  function logout() {
    removeKey(SESSION_KEY);
    removeKey(PENDING_NOTICE_KEY);
    if (document.documentElement.getAttribute('data-login-inline') === '1') {
      // 主页是就地登录的，退出后刷回来重新弹登录卡片即可
      window.location.reload();
      return;
    }
    window.location.replace(LOGIN_PAGE);
  }

  function changePassword(oldPassword, newPassword) {
    if (role() !== 'dev') {
      return Promise.resolve({ ok: false, message: '只有开发者可以修改密码' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return Promise.resolve({ ok: false, message: '新密码至少 6 位' });
    }
    return ensureCredential().then(function (cred) {
      return hashPassword(cred.account, String(oldPassword == null ? '' : oldPassword)).then(function (oldHash) {
        if (oldHash !== cred.hash) return { ok: false, message: '当前密码不正确' };
        return hashPassword(cred.account, String(newPassword)).then(function (hash) {
          writeJSON(CRED_KEY, { account: cred.account, hash: hash, weak: hash.indexOf('sha256:') !== 0 });
          return { ok: true };
        });
      });
    });
  }

  /* 开发者登录后的一次性提示 */
  function takePendingNotice() {
    var pending = false;
    try { pending = window.localStorage.getItem(PENDING_NOTICE_KEY) === '1'; } catch (err) { pending = false; }
    if (pending) removeKey(PENDING_NOTICE_KEY);
    return pending;
  }

  /* ---------------------------------------------------------------------
     对外暴露
     --------------------------------------------------------------------- */

  window.KairiAuth = {
    role: role,
    isDev: function () { return role() === 'dev'; },
    canEdit: function () { return role() === 'dev'; },
    session: session,
    loginDev: loginDev,
    loginGuest: loginGuest,
    logout: logout,
    changePassword: changePassword,
    isWeakHashing: isWeakHashing,
    takePendingNotice: takePendingNotice,
    DEFAULT_ACCOUNT: DEFAULT_ACCOUNT
  };

  /* ---------------------------------------------------------------------
     主页内嵌登录（<html data-login-inline="1">）

     为什么主页不跳去 login.html：浏览器判断"能不能自动出声"看的是**当前
     这个文档**有没有被用户点过（sticky user activation）。跳到另一个页面
     等于把这次点击丢掉，所以主页改成就地弹登录卡片——登录完紧接着播放音乐，
     整个过程不需要再点一下。
     --------------------------------------------------------------------- */

  function inlineGateHtml() {
    return '' +
      '<div class="login__glow" aria-hidden="true"></div>' +
      '<div class="login__inner">' +
        '<header class="login__head">' +
          '<div class="login__sigil">' +
            '<span class="login__halo" aria-hidden="true"></span>' +
            '<span class="login__letter">K</span>' +
          '</div>' +
          '<h1 class="login__title">Kairi 的小站</h1>' +
          '<p class="login__lead">请选择登入方式</p>' +
        '</header>' +
        '<div class="login__cards">' +
          '<section class="login-card login-card--dev">' +
            '<p class="login-card__kicker">DEVELOPER</p>' +
            '<h2 class="login-card__title">开发者登入</h2>' +
            '<p class="login-card__text">可以新建、编辑、删除文章、项目与收录资料，上传项目文件，并用解析结果生成项目介绍与体验。</p>' +
            '<form class="login-form" id="gateDevForm" autocomplete="off">' +
              '<label class="field">' +
                '<span class="field__label">账号</span>' +
                '<input class="field__input" id="gateDevAccount" type="text" autocomplete="username" placeholder="开发者账号" />' +
              '</label>' +
              '<label class="field">' +
                '<span class="field__label">密码</span>' +
                '<input class="field__input" id="gateDevPassword" type="password" autocomplete="current-password" placeholder="开发者密码" />' +
              '</label>' +
              '<p class="login-form__error" id="gateDevError" hidden></p>' +
              '<button class="btn btn--primary" type="submit" id="gateDevSubmit">进入开发者模式</button>' +
            '</form>' +
          '</section>' +
          '<section class="login-card login-card--guest">' +
            '<p class="login-card__kicker">GUEST</p>' +
            '<h2 class="login-card__title">访客登入</h2>' +
            '<p class="login-card__text">浏览全部文章、项目介绍、项目体验、收录的资料，以及项目里的文件与代码（只读）。不需要密码。</p>' +
            '<ul class="login-card__list">' +
              '<li>看文章与项目介绍</li>' +
              '<li>在站内体验项目</li>' +
              '<li>翻阅收录的资料</li>' +
              '<li>翻阅项目文件与代码</li>' +
            '</ul>' +
            '<button class="btn btn--ghost" type="button" id="gateGuestBtn">以访客身份进入</button>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  function finishInlineLogin(roleName) {
    var gate = document.querySelector('[data-login-gate]');
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    document.documentElement.classList.remove('is-gate-locked');

    /* 导航栏的身份徽章是页面刚加载时渲染的，这里按新身份重建一次 */
    if (window.KairiSite && window.KairiSite.refreshIdentity) {
      window.KairiSite.refreshIdentity();
    }

    /* 通知背景音乐：现在是"用户刚点过"的同一个文档，可以立刻带声播放 */
    try {
      window.dispatchEvent(new CustomEvent('kairi:authed', { detail: { role: roleName } }));
    } catch (err) { /* 环境不支持就忽略，音乐走原来的兜底流程 */ }
  }

  function mountInlineGate() {
    var gate = document.createElement('div');
    gate.className = 'login login--inline';
    gate.setAttribute('data-login-gate', '');
    gate.innerHTML = inlineGateHtml();
    document.body.appendChild(gate);
    document.documentElement.classList.remove('is-gate-locked');

    var accountInput = gate.querySelector('#gateDevAccount');
    var passwordInput = gate.querySelector('#gateDevPassword');
    var errorBox = gate.querySelector('#gateDevError');
    var submitBtn = gate.querySelector('#gateDevSubmit');

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    gate.querySelector('#gateDevForm').addEventListener('submit', function (event) {
      event.preventDefault();
      errorBox.hidden = true;
      var account = accountInput.value.trim();
      var password = passwordInput.value;
      if (!account || !password) {
        showError('请填写账号和密码');
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = '正在验证…';
      loginDev(account, password).then(function (ok) {
        if (ok) {
          finishInlineLogin('dev');
          return;
        }
        submitBtn.disabled = false;
        submitBtn.textContent = '进入开发者模式';
        showError('账号或密码不正确，请重试');
        passwordInput.select();
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = '进入开发者模式';
        showError('验证出错了，请刷新页面重试');
      });
    });

    gate.querySelector('#gateGuestBtn').addEventListener('click', function () {
      loginGuest();
      finishInlineLogin('guest');
    });

    window.setTimeout(function () { accountInput.focus(); }, 80);
  }

  /* ---------------------------------------------------------------------
     守卫：非登录页没有会话就立刻跳走（此时还没渲染，不会有闪烁）
     --------------------------------------------------------------------- */

  var root = document.documentElement;
  if (root.getAttribute('data-skip-guard') === '1') return;

  if (!session()) {
    if (root.getAttribute('data-login-inline') === '1') {
      /* 先藏住页面，等登录卡片挂上来再显示，避免闪一下内容 */
      root.classList.add('is-gate-locked');
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountInlineGate);
      } else {
        mountInlineGate();
      }
      return;
    }
    var file = window.location.pathname.split('/').pop() || 'index.html';
    var next = file + window.location.search + window.location.hash;
    window.location.replace(LOGIN_PAGE + '?next=' + encodeURIComponent(next));
  }
})();
