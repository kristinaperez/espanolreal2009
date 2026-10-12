/* Recording lifecycle tests; use ARABIC_QA_JSDOM as for interaction-checks.cjs. */
const assert = require('node:assert/strict');
const { JSDOM } = require(process.env.ARABIC_QA_JSDOM || 'jsdom');
const dom = new JSDOM('<div id="root"></div>', { url: 'https://espanolreal.es/ar', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(window, 'isSecureContext', { value: true });
const React = require('react'); const { act } = React;
const { createRoot } = require('react-dom/client');
const { configure, load } = require('./load-module.cjs');
let lastRecorder, stopped = 0, requests = 0, created = 0;
const revoked = [];
const audioStream = () => ({ getTracks: () => [{ stop: () => stopped++ }] });
let acquire = async () => audioStream();
Object.defineProperty(window.navigator, 'mediaDevices', { value: { getUserMedia: async options => { requests++; assert.deepEqual(JSON.parse(JSON.stringify(options)), { audio: true, video: false }); return acquire(); } } });
let limitCallback;
class Recorder {
  static isTypeSupported(type) { return type === 'audio/mp4'; }
  constructor(stream, options) { this.state = 'inactive'; this.mimeType = options.mimeType; lastRecorder = this; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) }); this.onstop?.(); }
}
configure({ globals: { window, document, navigator: window.navigator, MediaRecorder: Recorder, Blob,
  URL: { createObjectURL: () => 'blob:voice-' + ++created, revokeObjectURL: url => revoked.push(url) },
  setInterval: () => 1, clearInterval() {}, setTimeout: callback => { limitCallback = callback; return 2; }, clearTimeout() {},
}, mocks: { './audio-button': { AudioButton: () => React.createElement('button', null, 'sample') } } });
const { PronunciationPractice } = load('src/components/arabic/pronunciation-practice.tsx');
let root;
async function mount() { root = createRoot(document.getElementById('root')); await act(async () => root.render(React.createElement(PronunciationPractice, { lessonId: 'housing', phrases: ['Hola', 'Gracias'] }))); }
function button(text) { const node = [...document.querySelectorAll('button')].find(b => b.textContent === text); assert(node, 'missing button ' + text); return node; }
async function click(text) { await act(async () => button(text).click()); }
(async () => {
  await mount(); assert.equal(requests, 0, 'permission must only be requested after click');
  acquire = async () => { const error = new Error(); error.name = 'NotAllowedError'; throw error; };
  await click('سجّل صوتك'); assert(document.querySelector('[role="alert"]'), 'denied permission must be explained');
  acquire = async () => audioStream();
  await click('سجّل صوتك'); assert.equal(lastRecorder.state, 'recording'); assert.equal(document.querySelector('select').disabled, true);
  assert(![...document.querySelectorAll('button')].some(b => b.textContent === 'sample'), 'sample must not play during recording');
  await act(async () => limitCallback()); assert.equal(lastRecorder.state, 'inactive'); assert.equal(stopped, 1, '15 second limit must release microphone');
  assert(document.querySelector('audio').src.startsWith('blob:voice-')); assert(document.body.textContent.includes('لا توجد درجة'));
  await click('احذف التسجيل'); assert.equal(revoked.length, 1); assert.equal(document.querySelector('audio'), null);
  await click('سجّل صوتك'); await act(async () => root.unmount()); assert.equal(stopped, 2, 'leaving exercise must stop capture');
  await mount(); let resolvePermission;
  acquire = () => new Promise(resolve => { resolvePermission = resolve; });
  await click('سجّل صوتك'); await act(async () => root.unmount());
  await act(async () => resolvePermission(audioStream())); assert.equal(stopped, 3, 'late permission response must release microphone');
  console.log('PASS: permission denial, explicit recording, format selection, auto-stop, local playback, deletion, unmount and late-permission cleanup; no fabricated score. Real device recording still pending.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => dom.window.close());
