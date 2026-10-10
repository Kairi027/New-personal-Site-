/* ==========================================================================
   项目解析：从上传的文件里推断技术栈、简介、亮点、截图、可运行入口
   ========================================================================== */
(function () {
  'use strict';

  var LANG = {
    js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'React',
    ts: 'TypeScript', tsx: 'React',
    py: 'Python', java: 'Java', c: 'C', h: 'C', cpp: 'C++', hpp: 'C++', cs: 'C#',
    go: 'Go', rs: 'Rust', rb: 'Ruby', php: 'PHP', swift: 'Swift', kt: 'Kotlin',
    html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', less: 'Less',
    vue: 'Vue', svelte: 'Svelte', sh: 'Shell', bat: 'Batch', cmd: 'Batch',
    ps1: 'PowerShell', sql: 'SQL'
  };

  var NOISE_LANG = { 'JSON': 1, 'Markdown': 1, 'XML': 1, 'YAML': 1 };

  var IMAGE_EXT = { png: 1, jpg: 1, jpeg: 1, gif: 1, webp: 1, svg: 1, bmp: 1, avif: 1, ico: 1 };

  var TEXT_EXT = {
    js: 1, mjs: 1, cjs: 1, jsx: 1, ts: 1, tsx: 1, py: 1, java: 1, c: 1, h: 1,
    cpp: 1, hpp: 1, cs: 1, go: 1, rs: 1, rb: 1, php: 1, swift: 1, kt: 1,
    html: 1, htm: 1, css: 1, scss: 1, less: 1, json: 1, md: 1, markdown: 1,
    txt: 1, yml: 1, yaml: 1, xml: 1, sh: 1, bat: 1, cmd: 1, ps1: 1, sql: 1,
    vue: 1, svelte: 1, ini: 1, cfg: 1, conf: 1, toml: 1, csv: 1, log: 1,
    gitignore: 1, gitattributes: 1, editorconfig: 1, env: 1
  };

  var TEXT_BASENAME = {
    readme: 1, license: 1, makefile: 1, dockerfile: 1, procfile: 1,
    '.gitignore': 1, '.gitattributes': 1, '.editorconfig': 1
  };

  /* 这些目录整段跳过：传上来只会把仓库撑爆（虚拟环境、依赖、构建产物……） */
  var JUNK_DIRS = {
    '.venv': 1, venv: 1, virtualenv: 1, env: 1, node_modules: 1, '.git': 1,
    '__pycache__': 1, '.idea': 1, '.vscode': 1, dist: 1, build: 1, target: 1,
    '.next': 1, '.cache': 1, '.pytest_cache': 1, '.mypy_cache': 1,
    'site-packages': 1, '.gradle': 1, out: 1
  };

  /* 只看目录段，不看文件名 */
  function hasJunkDir(path) {
    var parts = String(path).split('/').filter(Boolean);
    for (var i = 0; i < parts.length - 1; i++) {
      if (JUNK_DIRS[parts[i]]) return true;
    }
    return false;
  }

  function baseOf(path) {
    return String(path).split('/').pop();
  }

  function extOf(path) {
    var name = baseOf(path);
    var dot = name.lastIndexOf('.');
    if (dot <= 0) return '';
    return name.slice(dot + 1).toLowerCase();
  }

  function depthOf(path) {
    return String(path).split('/').length;
  }

  function isImage(path) {
    return !!IMAGE_EXT[extOf(path)];
  }

  function isText(path) {
    var ext = extOf(path);
    if (ext && TEXT_EXT[ext]) return true;
    var base = baseOf(path).toLowerCase();
    if (TEXT_BASENAME[base]) return true;
    if (base.indexOf('readme') === 0 || base.indexOf('license') === 0) return true;
    return false;
  }

  function kindOf(path) {
    if (isImage(path)) return 'image';
    if (isText(path)) return 'text';
    return 'binary';
  }

  function formatSize(bytes) {
    var value = Number(bytes) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* ---------------------------------------------------------------------
     读取清单：判断类型 + 读取文本内容（受大小限制）
     --------------------------------------------------------------------- */

  function readManifest(fileList, limits) {
    var textLimit = (limits && limits.textLimit) || 256 * 1024;
    var totalLimit = (limits && limits.totalLimit) || 2 * 1024 * 1024;
    var used = 0;
    var skipped = 0;
    var items = [];

    for (var i = 0; i < fileList.length; i++) {
      var file = fileList[i];
      var path = file.webkitRelativePath || file.relativePath || file.name;
      path = String(path).replace(/\\/g, '/');
      var parts = path.split('/');
      // 如果用户是"选择整个文件夹"，路径里会带上项目文件夹名，去掉最外层
      if (parts.length > 2) path = parts.slice(1).join('/');

      if (hasJunkDir(path)) {
        skipped++;
        continue;
      }

      var item = { path: path, file: file, size: file.size, kind: kindOf(path) };
      // 关键：内联额度必须在这里（同步阶段）就扣掉。
      // 之前是在异步 then 里累加 used，同步判断时 used 恒为 0，上限形同虚设。
      if (item.kind === 'text' && item.size <= textLimit && used + item.size <= totalLimit) {
        item.inline = true;
        used += item.size;
      }
      items.push(item);
    }

    var chain = Promise.resolve();
    items.forEach(function (item) {
      if (!item.inline) return;
      chain = chain.then(function () {
        return item.file.text().then(function (text) {
          item.text = text;
        }).catch(function () { item.text = ''; });
      });
    });

    return chain.then(function () {
      items.forEach(function (item) { delete item.inline; });
      items.skipped = skipped;
      return items;
    });
  }

  /* ---------------------------------------------------------------------
     解析
     --------------------------------------------------------------------- */

  function stripMarkdown(text) {
    return String(text || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/^\s*>\s?/, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  function findReadme(items) {
    var best = null;
    items.forEach(function (item) {
      if (item.kind !== 'text' || typeof item.text !== 'string' || !item.text) return;
      var base = baseOf(item.path).toLowerCase();
      if (base.indexOf('readme') !== 0) return;
      if (!best || depthOf(item.path) < depthOf(best.path)) best = item;
    });
    return best;
  }

  function parseReadme(text) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var summary = '';
    var highlights = [];
    var i;

    for (i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (/^#{1,6}\s/.test(line)) continue;
      if (/^[-*+]\s+/.test(line)) continue;
      if (/^[=~-]{3,}$/.test(line)) continue;
      if (/^!\[/.test(line)) continue;
      summary = stripMarkdown(line);
      break;
    }

    for (i = 0; i < lines.length && highlights.length < 5; i++) {
      var m = /^(?:[-*+]|\d+[.)])\s+(.+)$/.exec(lines[i].trim());
      if (!m) continue;
      var text2 = stripMarkdown(m[1]);
      if (text2 && text2.length > 3 && text2.length < 120) highlights.push(text2);
    }

    return { summary: summary, highlights: highlights };
  }

  function collectTech(items) {
    var counts = {};
    var tech = [];
    var hasHtml = false;

    items.forEach(function (item) {
      var ext = extOf(item.path);
      var name = LANG[ext];
      if (name) counts[name] = (counts[name] || 0) + 1;
      if (ext === 'html' || ext === 'htm') hasHtml = true;
    });

    Object.keys(counts)
      .filter(function (name) { return !NOISE_LANG[name]; })
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 6)
      .forEach(function (name) { tech.push(name); });

    items.forEach(function (item) {
      var base = baseOf(item.path).toLowerCase();

      if (base === 'package.json' && item.text) {
        try {
          var pkg = JSON.parse(item.text);
          var deps = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}));
          ['react', 'vue', 'svelte', 'express', 'next', 'vite', 'webpack', 'three', 'electron']
            .forEach(function (key) {
              if (deps.indexOf(key) === -1) return;
              var label = key.charAt(0).toUpperCase() + key.slice(1);
              if (tech.indexOf(label) === -1) tech.push(label);
            });
        } catch (err) { /* JSON 坏了就跳过 */ }
        if (tech.indexOf('Node.js') === -1) tech.push('Node.js');
      }

      if (base === 'requirements.txt' && tech.indexOf('Python') === -1) tech.push('Python');

      if (base === 'project.config.json' && item.text) {
        try {
          var cfg = JSON.parse(item.text);
          if (cfg.compileType === 'game') {
            if (tech.indexOf('微信小游戏') === -1) tech.push('微信小游戏');
          } else if (tech.indexOf('微信小程序') === -1) {
            tech.push('微信小程序');
          }
        } catch (err) { /* 忽略 */ }
      }

      if (base === 'dockerfile' && tech.indexOf('Docker') === -1) tech.push('Docker');
    });

    if (hasHtml && tech.indexOf('HTML') === -1) tech.unshift('HTML');
    return tech.slice(0, 8);
  }

  function findEntry(items) {
    var best = null;
    items.forEach(function (item) {
      var base = baseOf(item.path).toLowerCase();
      if (base !== 'index.html' && base !== 'index.htm') return;
      if (!best || depthOf(item.path) < depthOf(best.path)) best = item;
    });
    return best ? best.path : '';
  }

  function guessDevice(items) {
    var mobile = false;
    items.forEach(function (item) {
      var base = baseOf(item.path).toLowerCase();
      if (base === 'game.json') mobile = true;
      if (base === 'project.config.json' && item.text && /"compileType"\s*:\s*"game"/.test(item.text)) {
        mobile = true;
      }
    });
    return mobile ? 'mobile' : 'desktop';
  }

  function pickScreenshots(items) {
    var images = items.filter(function (item) { return item.kind === 'image'; });
    if (!images.length) return [];

    function score(item) {
      var path = item.path.toLowerCase();
      var s = 0;
      if (path.indexOf('screenshot') !== -1) s -= 100;
      if (path.indexOf('/web/') !== -1) s -= 30;
      if (/(cover|preview|banner|shot|title|封面)/.test(path)) s -= 20;
      s += depthOf(item.path) * 5;
      s += Math.min(item.size, 2 * 1024 * 1024) / (1024 * 1024);
      return s;
    }

    var seen = {};
    var picked = [];
    images.slice().sort(function (a, b) { return score(a) - score(b); }).forEach(function (item) {
      var base = baseOf(item.path);
      if (seen[base]) return;
      seen[base] = true;
      picked.push(item);
    });
    return picked.slice(0, 8);
  }

  function analyze(items) {
    var totalBytes = 0;
    var langCount = {};
    items.forEach(function (item) {
      totalBytes += item.size || 0;
      var name = LANG[extOf(item.path)];
      if (name) langCount[name] = (langCount[name] || 0) + 1;
    });

    var readme = findReadme(items);
    var readmeInfo = readme ? parseReadme(readme.text) : { summary: '', highlights: [] };
    var sortedLangs = Object.keys(langCount).sort(function (a, b) { return langCount[b] - langCount[a]; });

    return {
      tech: collectTech(items),
      summary: readmeInfo.summary,
      highlights: readmeInfo.highlights,
      screenshots: pickScreenshots(items).map(function (item) {
        return { path: item.path, caption: baseOf(item.path) };
      }),
      entry: findEntry(items),
      device: guessDevice(items),
      readmePath: readme ? readme.path : '',
      stats: {
        count: items.length,
        bytes: totalBytes,
        sizeText: formatSize(totalBytes),
        languages: sortedLangs.slice(0, 6).map(function (name) {
          return { name: name, count: langCount[name] };
        })
      }
    };
  }
  /* ---------------------------------------------------------------------
     启动方式推断：从仓库文件里猜「这个项目怎么跑起来」
     --------------------------------------------------------------------- */

  /* 桌面 GUI 框架的特征（命中第一个就算） */
  var GUI_HINTS = [
    { re: /(?:^|[^\w.])(?:import\s+pygame|from\s+pygame)\b/, label: 'pygame 桌面程序' },
    { re: /(?:^|[^\w.])(?:import\s+tkinter|from\s+tkinter)\b/, label: 'tkinter 桌面程序' },
    { re: /(?:from|import)\s+PyQt[56]\b/, label: 'PyQt 桌面程序' },
    { re: /(?:from|import)\s+PySide[26]\b/, label: 'PySide 桌面程序' },
    { re: /(?:from|import)\s+pyglet\b/, label: 'pyglet 桌面程序' },
    { re: /(?:from|import)\s+kivy\b/, label: 'Kivy 桌面程序' },
    { re: /(?:from|import)\s+turtle\b/, label: 'turtle 桌面程序' }
  ];

  /* 需要起服务的 Python Web 框架 */
  var PY_WEB_HINTS = [
    { re: /(?:from|import)\s+flask\b/, label: 'Flask 服务' },
    { re: /(?:from|import)\s+fastapi\b/, label: 'FastAPI 服务' },
    { re: /(?:from|import)\s+uvicorn\b/, label: 'Uvicorn 服务' }
  ];

  var PY_WEB_URL = 'http://127.0.0.1:8000/';

  function hasText(item) {
    return !!item && typeof item.text === 'string';
  }

  function dirOf(path) {
    var parts = String(path).split('/');
    parts.pop();
    return parts.join('/');
  }

  /* 清单里是否存在某个目录（用「有文件以 该目录/ 开头」判断） */
  function dirExists(items, dir) {
    if (!dir) return true;
    var prefix = dir + '/';
    for (var i = 0; i < items.length; i++) {
      var path = items[i].path;
      if (path.length > prefix.length && path.indexOf(prefix) === 0) return true;
    }
    return false;
  }

  var PATH_LITERAL = /['"]([^'"\r\n]+)['"]/g;

  /* 脚本里引用的相对路径字面量，取它们的顶层目录名 */
  function referencedDirs(text) {
    var found = {};
    var match;
    PATH_LITERAL.lastIndex = 0;
    while ((match = PATH_LITERAL.exec(String(text || '')))) {
      var value = match[1].replace(/\\/g, '/').trim();
      if (!value) continue;
      if (value.indexOf('://') !== -1) continue;      // 网址
      if (/^[A-Za-z]:/.test(value)) continue;         // C:\Windows\Fonts\...
      if (value.charAt(0) === '/') continue;          // 绝对路径
      while (value.indexOf('./') === 0) value = value.slice(2);
      if (value.indexOf('..') === 0) continue;        // 往上走的不算
      if (value.indexOf('/') === -1) continue;        // 只认带目录的路径，滤掉普通字符串
      var pieces = value.split('/');
      var seg = pieces[0];
      var leaf = pieces[pieces.length - 1];
      var looksLikePath = value.charAt(value.length - 1) === '/' || /\.[A-Za-z0-9]{1,8}$/.test(leaf);
      if (!looksLikePath) continue;
      if (!seg || seg === '.') continue;
      if (seg.indexOf('{') !== -1 || seg.indexOf('}') !== -1) continue;   // f-string 占位
      if (leaf.indexOf('{') !== -1 || leaf.indexOf('}') !== -1) continue;
      if (seg.length > 40) continue;
      found[seg] = true;
    }
    return Object.keys(found);
  }

  /* 猜「在哪个目录里跑」：脚本引用的资源目录在哪一层最齐，就在哪一层跑。
     例：东方复刻/main.py 里写的是 img/、bgm/、sound/，它们都在项目根目录，
         所以工作目录应该是项目根，而不是脚本所在的 东方复刻/。 */
  function resolveRunDir(items, scriptPath, text) {
    var scriptDir = dirOf(scriptPath);
    var wanted = referencedDirs(text);
    if (!wanted.length) return scriptDir;

    var parts = scriptDir ? scriptDir.split('/') : [];
    var best = scriptDir;
    var bestScore = -1;
    // 从脚本所在目录一路往上找到项目根，命中最多的一层胜出（并列取更靠近脚本的）
    for (var i = parts.length; i >= 0; i--) {
      var candidate = parts.slice(0, i).join('/');
      var score = 0;
      for (var j = 0; j < wanted.length; j++) {
        if (dirExists(items, candidate ? candidate + '/' + wanted[j] : wanted[j])) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return bestScore > 0 ? best : scriptDir;
  }

  /* 名字就是项目名的 exe，才算「这个项目打包好的成品」；
     仓库里随手带的内网穿透、命令行小工具之类不在此列。 */
  function nameMatchesProject(path, projectName) {
    var name = String(projectName || '').trim().toLowerCase();
    if (!name) return false;
    return baseOf(path).toLowerCase().indexOf(name) !== -1;
  }

  function findExe(items, projectName) {
    var matched = null;
    var other = null;
    items.forEach(function (item) {
      if (!/\.exe$/i.test(item.path) || hasJunkDir(item.path)) return;
      if (nameMatchesProject(item.path, projectName)) {
        if (!matched || depthOf(item.path) < depthOf(matched.path)) matched = item;
      } else if (!other || depthOf(item.path) < depthOf(other.path)) {
        other = item;
      }
    });
    return matched || other;
  }

  /* 常见的程序入口文件名 */
  var ENTRY_BASENAMES = {
    'main.py': 1, 'main.pyw': 1, 'app.py': 1, 'app.pyw': 1, 'game.py': 1, 'run.py': 1,
    'start.py': 1, '__main__.py': 1, 'server.py': 1, 'serve.py': 1, 'manage.py': 1,
    'wsgi.py': 1, 'asgi.py': 1, 'gui.py': 1, 'demo.py': 1
  };

  /* 越像入口的脚本排越前：叫 main.py / app.py 的、或者放在根目录的 */
  function entryScore(path) {
    var base = baseOf(path).toLowerCase();
    var score = 0;
    if (base === '__init__.py') score += 100;          // 包的 __init__ 基本不是入口
    if (!ENTRY_BASENAMES[base]) score += 10;
    score += depthOf(path);                            // 越浅越像入口
    return score;
  }

  /* 从一堆脚本里挑最像入口的那个 */
  function pickEntryFile(candidates) {
    var best = null;
    candidates.forEach(function (item) {
      if (!best || entryScore(item.path) < entryScore(best.path)) best = item;
    });
    return best;
  }

  /* exe 旁边如果有同名的（或 main.py）源码，用它的资源引用猜工作目录 */
  function siblingScript(items, exePath) {
    var wanted = baseOf(exePath).replace(/\.exe$/i, '').toLowerCase();
    var same = null;
    var main = null;
    items.forEach(function (item) {
      if (!/\.pyw?$/i.test(item.path) || !hasText(item)) return;
      if (dirOf(item.path) !== dirOf(exePath)) return;
      var base = baseOf(item.path).replace(/\.pyw?$/i, '').toLowerCase();
      if (base === wanted) same = item;
      if (base === 'main') main = item;
    });
    return same || main;
  }

  /* 把清单变成「可以一键填入」的启动建议，按可信度排序 */
  function detectLaunch(items, projectName) {
    var list = items || [];
    var paths = {};
    list.forEach(function (item) { paths[item.path] = item; });

    /* 可信度分档，数字越小越可信 */
    var RANK = {
      gui: 1,          // Python 桌面程序：特征最明确
      namedExe: 2,     // 名字就是项目名的 exe：这个项目打包好的成品
      pyWeb: 3,        // Streamlit / Python 服务
      node: 4,         // 浏览器预览服务 / npm run dev
      script: 5,       // 现成的启动脚本
      otherExe: 6,     // 仓库里顺带的小工具 exe，可信度低
      static: 7        // 纯静态页面
    };
    var tips = [];

    function add(rank, tip) {
      tip.rank = rank;
      tips.push(tip);
    }

    /* 1. Python 桌面程序（pygame / tkinter / Qt ...）—— 真正「进入主程序」的那种 */
    var guiFiles = [];
    list.forEach(function (item) {
      if (!/\.pyw?$/i.test(item.path) || !hasText(item)) return;
      for (var i = 0; i < GUI_HINTS.length; i++) {
        if (GUI_HINTS[i].re.test(item.text)) {
          guiFiles.push({ item: item, label: GUI_HINTS[i].label });
          return;
        }
      }
    });
    var gui = guiFiles.length ? guiFiles.slice().sort(function (a, b) {
      return entryScore(a.item.path) - entryScore(b.item.path);
    })[0] : null;
    if (gui) {
      add(RANK.gui, {
        kind: 'desktop',
        label: gui.label + '（' + gui.item.path + '）',
        command: 'python "' + gui.item.path + '"',
        cwd: resolveRunDir(list, gui.item.path, gui.item.text),
        url: '',
        waitMs: 20000
      });
    }

    /* 2 / 6. exe：名字对得上的当成品放前面，其余（工具、依赖）放最后 */
    var exe = findExe(list, projectName);
    if (exe) {
      var sibling = siblingScript(list, exe.path);
      add(nameMatchesProject(exe.path, projectName) ? RANK.namedExe : RANK.otherExe, {
        kind: 'desktop',
        label: '可执行程序（' + exe.path + '）',
        command: '"' + exe.path + '"',
        cwd: sibling ? resolveRunDir(list, sibling.path, sibling.text) : dirOf(exe.path),
        url: '',
        waitMs: 60000
      });
    }

    /* 3. Python Web：server/app.py → streamlit → flask/fastapi/uvicorn */
    if (paths['server/app.py']) {
      add(RANK.pyWeb, {
        kind: 'web',
        label: 'Python 服务（server/app.py）',
        command: 'python server/app.py --no-auth --host 127.0.0.1 --port 8792',
        cwd: '',
        url: 'http://127.0.0.1:8792/',
        waitMs: 15000
      });
    }

    var streamlitFiles = [];
    var webPyFiles = [];
    list.forEach(function (item) {
      if (!/\.py$/i.test(item.path) || !hasText(item)) return;
      if (item.text.indexOf('import streamlit') !== -1) {
        streamlitFiles.push(item);
        return;
      }
      for (var i = 0; i < PY_WEB_HINTS.length; i++) {
        if (PY_WEB_HINTS[i].re.test(item.text)) {
          webPyFiles.push({ item: item, label: PY_WEB_HINTS[i].label });
          return;
        }
      }
    });

    streamlitFiles.slice().sort(function (a, b) {
      return entryScore(a.path) - entryScore(b.path);
    }).forEach(function (item) {
      var parts = item.path.split('/');
      var file = parts.pop();
      add(RANK.pyWeb, {
        kind: 'web',
        label: 'Streamlit（' + item.path + '）',
        command: 'python -m streamlit run ' + file +
          ' --server.port 8793 --server.headless true --browser.gatherUsageStats false --server.fileWatcherType none',
        // Streamlit 脚本里的相对路径是相对「脚本所在目录」的，必须切进去
        cwd: parts.join('/'),
        url: 'http://127.0.0.1:8793/',
        waitMs: 90000
      });
    });

    if (!streamlitFiles.length && webPyFiles.length) {
      // 深层的 __init__.py 之类不算入口，挑最像入口的那个
      var webPy = webPyFiles.slice().sort(function (a, b) {
        return entryScore(a.item.path) - entryScore(b.item.path);
      })[0];
      if (webPy) {
        add(RANK.pyWeb, {
          kind: 'web',
          label: webPy.label + '（' + webPy.item.path + '）',
          command: 'python "' + webPy.item.path + '"',
          cwd: resolveRunDir(list, webPy.item.path, webPy.item.text),
          url: PY_WEB_URL,
          waitMs: 20000
        });
      }
    }

    /* 4. Node：内置的浏览器预览服务器 / package.json 的 dev、start */
    if (paths['tools/browser-preview/server.js']) {
      add(RANK.node, {
        kind: 'web',
        label: '浏览器预览服务器（node）',
        command: 'node tools/browser-preview/server.js 8791',
        cwd: '',
        url: 'http://127.0.0.1:8791/',
        waitMs: 15000
      });
    }

    var pkg = null;
    list.forEach(function (item) {
      if (baseOf(item.path) !== 'package.json' || !hasText(item)) return;
      if (!pkg || depthOf(item.path) < depthOf(pkg.path)) pkg = item;
    });
    if (pkg) {
      var scripts = {};
      try { scripts = (JSON.parse(pkg.text).scripts) || {}; } catch (err) { scripts = {}; }
      var script = scripts.dev ? 'dev' : (scripts.start ? 'start' : '');
      if (script) {
        add(RANK.node, {
          kind: 'web',
          label: 'npm run ' + script + '（' + pkg.path + '）',
          command: 'npm install && npm run ' + script + ' -- --port 8794 --host 127.0.0.1',
          cwd: dirOf(pkg.path),
          url: 'http://127.0.0.1:8794/',
          waitMs: 90000
        });
      }
    }

    /* 5. 现成的启动脚本 */
    list.forEach(function (item) {
      var base = baseOf(item.path).toLowerCase();
      if (base === 'preview.ps1') {
        add(RANK.script, {
          kind: 'web',
          label: 'preview.ps1',
          command: 'powershell -ExecutionPolicy Bypass -File "' + item.path + '"',
          cwd: '',
          url: 'http://127.0.0.1:5173/',
          waitMs: 30000
        });
      } else if (base === 'start.ps1' || base === 'start.bat') {
        add(RANK.script, {
          kind: 'web',
          label: base,
          command: /\.bat$/.test(base)
            ? '"' + item.path + '"'
            : 'powershell -ExecutionPolicy Bypass -File "' + item.path + '"',
          cwd: '',
          url: '',
          waitMs: 30000
        });
      }
    });

    /* 6. 纯静态页面：没有命令，直接把 index.html 当入口 */
    var entry = findEntry(list);
    if (entry) {
      add(RANK.static, {
        kind: 'static',
        label: '静态页面（' + entry + '）',
        command: '',
        cwd: '',
        url: '',
        waitMs: 15000,
        entry: entry
      });
    }

    // 稳定排序：同一档里保持上面的先后顺序
    tips.sort(function (a, b) { return a.rank - b.rank; });
    tips.forEach(function (tip) { delete tip.rank; });
    return tips;
  }

  window.KairiAnalyze = {
    readManifest: readManifest,
    analyze: analyze,
    detectLaunch: detectLaunch,
    resolveRunDir: resolveRunDir,
    referencedDirs: referencedDirs,
    kindOf: kindOf,
    isText: isText,
    isImage: isImage,
    formatSize: formatSize,
    extOf: extOf,
    baseOf: baseOf
  };
})();
