/* ==========================================================================
   首页背景音乐
   只有右上角那一个按钮（#navMusic）能控制它。

   ── 为什么"登录后会响，刷新后不响"（2026-10 用真实 Chrome 154 实测） ──
   浏览器只认"这个文档被用户点过"（sticky user activation）：
     · 登录是就地登录，点「进入」那一下给了当前文档权限 → 音乐立刻带声播放；
     · 刷新（F5）会换成一个全新的文档，点击记录清零 → Chrome 直接拒绝
       <audio>.play()，抛 NotAllowedError。实测把音量设成 0 再淡入同样被拒
       （Chrome 只看 muted，不看 volume），所以页面脚本无法绕过这条硬规则。
   零点击自动播放的唯一办法是让浏览器本身就允许：用
   「启动博客-自动播放.bat」打开本站（它带 --autoplay-policy=no-user-gesture-required，
   file:// 与 http://127.0.0.1:8765 都实测有效）。

   所以本文件做两件事：
     1. 能自动播放时（上面那种浏览器），进页面立刻带声播放，一点不用点；
     2. 被浏览器拦下时，亮出右下角提示，并在"用户在这份文档里的第一次
        点击 / 按键 / 触摸"时立刻把音乐接上——不需要去找那个 ♪ 按钮。
   另外：如果 play() 表面上成功了、浏览器随后又把播放掐掉（静音自动播放的
   老问题），这里会复查一次真实出声状态，不会留下"看起来在放、其实没声"的假状态。
   ========================================================================== */
(function () {
  'use strict';

  var audio = document.getElementById('bgm');
  if (!audio) return;

  var hint = document.getElementById('musicHint');
  var hintText = hint ? hint.querySelector('.music-hint__text') : null;
  var hintSub = hint ? hint.querySelector('.music-hint__sub') : null;

  var STORE_KEY = 'kairi_bgm';
  var TARGET_VOLUME = 0.55;
  var LAUNCHER_TIP = '想刷新后也免点击？用「启动博客-自动播放.bat」打开本站';

  /* ── 线上音源 ────────────────────────────────────────────────────────
     GitHub Pages 的 CDN 在国内实测只有 40 KB/s 上下，而原来那份音乐是
     4.2MB / 258kbps，这条通道喂不动它，于是"有的时候加载失败"。
     现在音乐已压成 ~1.3MB / 80kbps 单声道，40 KB/s 也够它连续播放；
     线上仍然优先走更快的 jsDelivr（实测 200 KB/s 上下），顺序是：
        jsDelivr cdn 节点 → jsDelivr gcore 节点 → 同源文件
     哪条先能用就用哪条，用成功的会被记住，下次先试它；某条十几秒还取不到
     数据就自动换下一条；全都失败才提示音乐加载失败。
     本机（file:// 与 127.0.0.1）直接读本地文件，不走网络。
     这里固定 commit SHA 是有意的：@分支 的 jsDelivr 缓存会滞后，偶尔还会
     解析失败；以后换掉 music/Home BGM.m4a，把 MUSIC_PIN 改成新的提交号即可。 */
  var MUSIC_PIN = '24a88afa9b69b803d43f671ce9b803147f5be818';
  var MUSIC_PATH = '/music/Home%20BGM.m4a';
  var LOCAL_AUDIO = audio.getAttribute('src') || '';
  var SOURCE_KEY = 'kairi_bgm_src';

  var sources = (function () {
    var list = [];
    var remote = /^https?:$/i.test(window.location.protocol) &&
      !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
    if (remote) {
      list.push('https://cdn.jsdelivr.net/gh/Kairi027/New-personal-Site-@' + MUSIC_PIN + MUSIC_PATH);
      list.push('https://gcore.jsdelivr.net/gh/Kairi027/New-personal-Site-@' + MUSIC_PIN + MUSIC_PATH);
    }
    if (LOCAL_AUDIO) list.push(LOCAL_AUDIO);
    return list;
  })();

  var sourceIndex = 0;
  var sourceTimer = 0;

  function rememberSource(url) {
    try { window.localStorage.setItem(SOURCE_KEY, url); } catch (err) { /* 忽略：无痕模式等 */ }
  }

  function startSourceIndex() {
    try {
      var index = sources.indexOf(window.localStorage.getItem(SOURCE_KEY));
      if (index >= 0) return index;
    } catch (err) { /* 忽略 */ }
    return 0;
  }

  function applySource(index, resumeAt) {
    window.clearTimeout(sourceTimer);
    if (index < 0 || index >= sources.length) return;
    sourceIndex = index;
    if (audio.getAttribute('src') !== sources[index]) {
      audio.setAttribute('src', sources[index]);
      if (resumeAt) {
        /* 换源等于从头加载，把播放位置挪回去，别让音乐莫名重头开始 */
        var seek = function () {
          audio.removeEventListener('loadedmetadata', seek);
          try { audio.currentTime = resumeAt; } catch (err) { /* 忽略 */ }
        };
        audio.addEventListener('loadedmetadata', seek);
      }
      audio.load();
    }
    /* 这条源十几秒还没取到数据（被墙 / 卡住）就换下一条，别一直干等 */
    sourceTimer = window.setTimeout(function () {
      if (audio.readyState >= 2 || isAudible()) return;
      nextSource();
    }, 12000);
  }

  function nextSource() {
    if (sourceIndex + 1 >= sources.length) return false;
    applySource(sourceIndex + 1, audio.currentTime);
    if (!userPaused) tryPlay();
    return true;
  }

  function setupSources() {
    if (sources.length > 1) applySource(startSourceIndex());
  }

  var userPaused = false;          // 用户在这一份文档里主动按过暂停
  var audible = false;             // 真的在出声（不是"play() 没报错"）
  var playedOnce = false;          // 这一份文档里成功出声过
  var recoveryTries = 0;           // 播放被掐掉后的自动重试次数（有限次，免得空转）
  var fadeTimer = 0;
  var hintTimer = 0;
  var watchdogTimer = 0;
  var gestureBound = false;
  var lastAttemptWithActivation = false;

  audio.loop = true;

  /* 右上角那一个音乐按钮。每次现取：登录成功时导航栏会整体重建，
     缓存的节点会变成"已经扔掉的那个"，点了自然没反应。 */
  function navButton() {
    return document.getElementById('navMusic');
  }

  /* 旧版本把「暂停」写进过 localStorage / sessionStorage，会让之后每次打开
     首页都悄悄不再自动播放，这里一次性清干净。 */
  try {
    window.localStorage.removeItem(STORE_KEY);
    window.sessionStorage.removeItem(STORE_KEY);
  } catch (err) { /* 忽略：无痕模式等 */ }

  /* 主页的登录卡片还挂着的时候先不试：那会儿必然被拦，等用户点「进入」再放。
     （is-gate-locked 是 auth.js 在 <head> 里就先加上的，用来挡住加载瞬间的闪烁） */
  function loginGateIsUp() {
    return !!document.querySelector('[data-login-gate]') ||
      document.documentElement.classList.contains('is-gate-locked');
  }

  function hasActivation() {
    return !!(window.navigator && navigator.userActivation && navigator.userActivation.hasBeenActive);
  }

  /* 真实出声状态：没暂停、没静音、音量不为 0 */
  function isAudible() {
    return !audio.paused && !audio.muted && audio.volume > 0 && !audio.ended;
  }

  function fadeVolume(to, duration) {
    window.clearInterval(fadeTimer);
    var from = audio.volume;
    var steps = 26;
    var step = 0;
    fadeTimer = window.setInterval(function () {
      step++;
      var value = from + (to - from) * (step / steps);
      try {
        audio.volume = Math.max(0, Math.min(1, value));
      } catch (err) {
        window.clearInterval(fadeTimer);
      }
      if (step >= steps) window.clearInterval(fadeTimer);
    }, Math.max(16, duration / steps));
  }

  function hideHint() {
    window.clearTimeout(hintTimer);
    if (hint) hint.classList.remove('is-show');
  }

  function showHint(delay, text, sub) {
    if (!hint) return;
    if (text && hintText) hintText.textContent = text;
    if (hintSub) hintSub.textContent = sub || LAUNCHER_TIP;
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(function () {
      hint.classList.add('is-show');
    }, delay || 0);
  }

  function syncUI() {
    var sounding = isAudible();
    var button = navButton();

    if (button) {
      button.classList.toggle('is-playing', sounding);
      button.setAttribute('aria-pressed', sounding ? 'true' : 'false');
      button.setAttribute('aria-label', sounding ? '暂停背景音乐' : '播放背景音乐');
      var label = button.querySelector('.nav__music-text');
      if (label) label.textContent = sounding ? '播放中' : '音乐';
      button.title = sounding ? '点一下暂停背景音乐' : '点一下播放背景音乐';
    }

    if (sounding) {
      audible = true;
      playedOnce = true;
      recoveryTries = 0;
      if (sources[sourceIndex]) rememberSource(sources[sourceIndex]);
      hideHint();
      unbindGesture();
    }
  }

  /* 淡入之后再复查一次：play() 成功不等于真的在响（浏览器可能在淡入时把它掐掉） */
  function verifyAudible(delay) {
    window.setTimeout(function () {
      if (isAudible()) {
        audible = true;
        syncUI();
        return;
      }
      if (!userPaused) blocked(null);
    }, delay);
  }

  /* 带声播放。只能在"有用户激活"或"浏览器本身就允许自动播放"时成功 */
  function tryPlay() {
    if (userPaused) return;
    /* 登录界面固定不播音乐：等用户点「进入」（kairi:authed）那一下再带声播放。
       在这一道统一拦住，watchdog / 焦点变化 / 首次手势都不会在登录卡片上
       偷偷把音乐播起来；换上没登录卡片的页面（例如已登录后刷新）则照常自动播。 */
    if (loginGateIsUp()) return;
    lastAttemptWithActivation = hasActivation();
    audio.muted = false;

    /* 已经在播（只是被静音或音量还压着）：把它推回正常音量即可 */
    if (!audio.paused) {
      if (audio.volume < TARGET_VOLUME) fadeVolume(TARGET_VOLUME, 600);
      verifyAudible(700);
      return;
    }

    audio.volume = 0;
    var promise = null;
    try {
      promise = audio.play();
    } catch (err) {
      blocked(err);
      return;
    }
    if (!promise || typeof promise.then !== 'function') {
      fadeVolume(TARGET_VOLUME, 1600);
      verifyAudible(1700);
      return;
    }
    promise.then(function () {
      fadeVolume(TARGET_VOLUME, 1600);
      verifyAudible(1700);
    }).catch(function (err) {
      blocked(err);
    });
  }

  /* 被浏览器拦下、或者文件本身有问题：分辨清楚，别给出"点了也没用"的提示 */
  function blocked(err) {
    audible = false;
    var name = err && err.name;
    var policyBlocked = !name || name === 'NotAllowedError';

    audio.muted = true;      // 静音态浏览器不拦，也不会留下"看着在放其实没声"

    if (policyBlocked) {
      /* 登录卡片还挡着时先别弹提示：那一下「进入」本身就是浏览器认的
         用户点击，音乐紧接着就会响，用不着再找地方点。 */
      if (loginGateIsUp()) hideHint();
      else showHint(300, '点一下这里，音乐就会响起', LAUNCHER_TIP);
    } else {
      showHint(0, '音乐加载失败：' + (err.message || name), '请确认 music/Home BGM.m4a 存在且格式可用');
    }

    syncUI();
    bindGesture();
    startWatchdog();
  }

  /* 用户已经点过了：这一刻浏览器是放行的，直接带声播 */
  function playByUser() {
    userPaused = false;
    tryPlay();
  }

  function pauseByUser() {
    userPaused = true;
    audible = false;
    window.clearInterval(fadeTimer);
    try { audio.pause(); } catch (err) { /* 忽略 */ }
    hideHint();
    unbindGesture();
    syncUI();
  }

  function toggle() {
    if (loginGateIsUp()) return;    // 登录界面固定不播放
    if (isAudible()) pauseByUser();
    else playByUser();
  }

  function onFirstGesture(event) {
    var target = event.target;
    if (target && target.closest && target.closest('#navMusic')) return;
    if (userPaused) {
      unbindGesture();
      return;
    }
    playByUser();
    if (audible) unbindGesture();
  }

  /* pointerdown / keydown / touchend 才是浏览器的"激活触发事件"，
     其余几个只是不同浏览器/输入方式下的同类事件，多绑几个不亏 */
  var GESTURE_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'keydown', 'touchstart', 'touchend'];

  function bindGesture() {
    if (gestureBound) return;
    gestureBound = true;
    GESTURE_EVENTS.forEach(function (name) {
      document.addEventListener(name, onFirstGesture, { capture: true, passive: true });
    });
  }

  function unbindGesture() {
    if (!gestureBound) return;
    gestureBound = false;
    GESTURE_EVENTS.forEach(function (name) {
      document.removeEventListener(name, onFirstGesture, { capture: true });
    });
  }

  /* 没有激活时 play() 必然被拒，别白试；下面两种情况值得自动补一次：
       · 用户这次文档里第一次拿到激活（比如在别处点了一下）；
       · 之前明明播响过，却被浏览器中途掐掉（静音自动播放的老毛病），补两次。 */
  function startWatchdog() {
    if (watchdogTimer) return;
    watchdogTimer = window.setInterval(function () {
      if (userPaused) return;
      if (isAudible()) { audible = true; return; }

      var activationAppeared = hasActivation() && !lastAttemptWithActivation;
      var lostPlayback = playedOnce && recoveryTries < 2;

      if (activationAppeared || lostPlayback) {
        recoveryTries += 1;
        tryPlay();
        return;
      }
      if (audio.paused) bindGesture();
    }, 2500);
  }

  /* 事件委托：导航栏（含音乐按钮）在登录成功后会整体重建，
     把监听直接绑在节点上会跟着旧节点一起失效 */
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (!target.closest('#navMusic')) return;
    toggle();
  });

  if (hint) {
    /* 提示本身也能点：比"点空白处"更直白 */
    hint.addEventListener('click', function () {
      if (!isAudible()) playByUser();
    });
  }

  /* 主页是就地登录的：这声「点进入」就发生在当前文档里，
     浏览器此时是放行的，所以紧接着就把音乐带声播起来，不需要再点播放。 */
  window.addEventListener('kairi:authed', function () {
    userPaused = false;
    playByUser();
    bindGesture();      // 万一这次没放成功，之后的任意点击也能补上
  });

  audio.addEventListener('play', function () { syncUI(); });
  audio.addEventListener('pause', function () {
    /* 不是用户按的暂停，却停下来了：当"需要点一下"处理，别让音乐悄悄没了 */
    if (!userPaused && audible && !audio.ended) {
      audible = false;
      blocked(null);
    }
    syncUI();
  });
  audio.addEventListener('volumechange', function () { syncUI(); });
  audio.addEventListener('error', function () {
    /* 这条源不行就换下一条（jsDelivr 两个节点 → 同源文件），全都失败才算真失败 */
    if (nextSource()) return;
    var detail = audio.error ? ('code ' + audio.error.code) : '';
    showHint(0, '音乐加载失败（' + detail + '）', '请确认 music/Home BGM.m4a 存在且格式可用');
  });

  /* 回到这个页面时再试一次。bfcache 后退回来会带着"已经点过"的激活，
     所以那一路直接试，不看这次有没有试过。 */
  function retry() {
    if (userPaused || isAudible()) return;
    if (hasActivation() && !lastAttemptWithActivation) tryPlay();
  }
  window.addEventListener('pageshow', function (event) {
    if (userPaused || isAudible()) return;
    if (event && event.persisted) tryPlay();
    else retry();
  });
  window.addEventListener('focus', retry);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) retry();
  });

  if ('mediaSession' in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: 'Home BGM',
        artist: 'Kairi 的小站',
        album: 'Home'
      });
      navigator.mediaSession.setActionHandler('play', function () { playByUser(); });
      navigator.mediaSession.setActionHandler('pause', function () { pauseByUser(); });
    } catch (err) { /* 环境不支持，忽略 */ }
  }

  /* 方便自检：控制台里 KairiBgm.state() 看状态，KairiBgm.retry() 手动再试 */
  window.KairiBgm = {
    state: function () {
      return {
        paused: audio.paused,
        muted: audio.muted,
        volume: Number(audio.volume.toFixed(3)),
        audible: isAudible(),
        userPaused: userPaused,
        hasActivation: hasActivation(),
        gateUp: loginGateIsUp()
      };
    },
    retry: function () { userPaused = false; tryPlay(); }
  };

  syncUI();
  startWatchdog();

  /* 一进主界面就播，不等任何点击：这两种情形能直接成功——
       · 浏览器本身就允许出声音（用「启动博客-自动播放.bat」打开，
         或这个站点在 Chrome 里已经攒够媒体参与度 MEI）；
       · 用户点「进入」那一下（kairi:authed）之后，音乐紧接着带声播起来。
     登录卡片还挡着的时候不播（tryPlay 里统一拦着），卡片一撤就走上面两条。 */
  bindGesture();
  setupSources();
  tryPlay();
  window.setTimeout(function () {
    if (userPaused || isAudible()) return;
    tryPlay();
  }, 420);
})();
