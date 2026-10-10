const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
let globals = {};
const mocks = {};
function configure(options = {}) { globals = options.globals ?? {}; Object.assign(mocks, options.mocks ?? {}); cache.clear(); }
function load(file) {
  file = path.resolve(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file);
  const record = { exports: {} }; cache.set(file, record.exports);
  const localRequire = name => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    let target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
    if (!path.extname(target)) target += fs.existsSync(target + '.ts') ? '.ts' : '.tsx';
    return load(target);
  };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module: record, exports: record.exports, require: localRequire, process, console, Date, Set, Map, URL, Buffer, globalThis, ...globals }, { filename: file });
  cache.set(file, record.exports);
  return record.exports;
}
module.exports = { load, configure };
