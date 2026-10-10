const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'bundle.js');

function collectJs(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      result.push(...collectJs(full));
    } else if (entry.endsWith('.js')) {
      result.push(full);
    }
  }
  return result;
}

const files = ['game.js', ...collectJs(path.join(ROOT, 'src'))];
const modules = [];

for (const file of files) {
  const id = path.relative(ROOT, file).split(path.sep).join('/');
  const code = fs.readFileSync(file, 'utf8');
  modules.push({ id, code });
}

const wrapped = modules
  .map((module) => {
    return `  register(${JSON.stringify(module.id)}, function (module, exports, require) {\n${module.code}\n  });`;
  })
  .join('\n');

const bundle = `(function () {
  const modules = {};
  const cache = {};

  function register(id, factory) {
    modules[id] = factory;
  }

  function resolve(from, request) {
    if (!request.startsWith('.')) return request;
    const base = from.split('/').slice(0, -1);
    const parts = request.split('/');
    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        base.pop();
      } else {
        base.push(part);
      }
    }
    return base.join('/');
  }

  function makeRequire(from) {
    return function (request) {
      const id = resolve(from, request);
      if (cache[id]) return cache[id].exports;
      const factory = modules[id];
      if (!factory) throw new Error('Cannot find module: ' + id);
      const module = { exports: {} };
      cache[id] = module;
      factory(module, module.exports, makeRequire(id));
      return module.exports;
    };
  }

${wrapped}

  makeRequire('game.js')('game.js');
})();
`;

fs.writeFileSync(OUT, bundle, 'utf8');
console.log('Wrote ' + path.relative(ROOT, OUT));
