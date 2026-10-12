const assert = require('node:assert/strict');
const { load, configure } = require('./load-module.cjs');
const { NextRequest } = require('next/server');
let user = null, limited = false, providerCalls = 0;
const fixture = { RecognitionStatus: 'Success', NBest: [{ AccuracyScore: 78, Words: [{ Word: 'Hola', AccuracyScore: 78, ErrorType: 'None' }] }] };
let responseBody = fixture, providerOk = true;
configure({ globals: { AbortSignal, fetch: async (url, options) => {
  providerCalls++;
  assert(url.includes('language=es-ES&format=detailed'));
  const config = JSON.parse(Buffer.from(options.headers['Pronunciation-Assessment'], 'base64').toString());
  assert.equal(config.ReferenceText, reference);
  assert.equal(config.GradingSystem, 'HundredMark');
  assert.equal(options.headers['Content-Type'], 'audio/wav; codecs=audio/pcm; samplerate=16000');
  return { ok: providerOk, json: async () => responseBody };
}, }, mocks: { '@/server/http': {
  currentUser: async () => user,
  jsonResponse: (data, status = 200) => Response.json(data, { status }),
  rateLimit: () => limited ? Response.json({}, { status: 429 }) : null,
} } });
const { encodeWav } = load('src/lib/audio/wav.ts');
const { validateWav, hasSignal, parseAssessment } = load('src/server/pronunciation/azure.ts');
const { pronunciationPhrases } = load('src/lib/arabic/pronunciation-phrases.ts');
const reference = pronunciationPhrases('housing')[0];
const signal = Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 8) * 0.1);
const wav = Buffer.from(encodeWav(signal));
assert(validateWav(wav)); assert(hasSignal(wav));
assert(!hasSignal(Buffer.from(encodeWav(new Float32Array(16000)))));
const corrupt = Buffer.from(wav); corrupt.writeUInt32LE(48000, 24); assert(!validateWav(corrupt));
assert.equal(parseAssessment(fixture).score, 7.8);
assert.equal(parseAssessment({ RecognitionStatus: 'NoMatch' }), null);
assert.equal(parseAssessment({ RecognitionStatus: 'Success', NBest: [{}] }), null);
assert.equal(parseAssessment({ RecognitionStatus: 'Success', NBest: [{ PronunciationAssessment: { AccuracyScore: 101 } }] }), null);
const { POST, GET } = load('src/app/api/pronunciation/route.ts');
const request = (audio = wav, suffix = '?lesson=housing&phrase=0', origin = 'https://espanolreal.es') => new NextRequest('https://espanolreal.es/api/pronunciation' + suffix, { method: 'POST', headers: { origin, host: 'espanolreal.es', 'content-type': 'audio/wav' }, body: audio });
(async () => {
  process.env.AZURE_SPEECH_ENABLED = 'false';
  assert.equal((await GET().json()).enabled, false);
  assert.equal((await POST(request())).status, 503);
  process.env.AZURE_SPEECH_ENABLED = 'true'; process.env.AZURE_SPEECH_KEY = 'test-key'; process.env.AZURE_SPEECH_REGION = 'westeurope';
  assert.equal((await POST(request(wav, undefined, 'https://evil.example'))).status, 403);
  assert.equal((await POST(request())).status, 401);
  user = { telegramId: 123 };
  assert.equal((await POST(request(wav, '?lesson=housing&phrase=999'))).status, 400);
  assert.equal((await POST(request(corrupt))).status, 400);
  assert.equal((await POST(request(Buffer.from(encodeWav(new Float32Array(16000)))))).status, 422);
  assert.equal((await POST(request(Buffer.alloc(600000)))).status, 413);
  limited = true; assert.equal((await POST(request())).status, 429); limited = false;
  assert.equal(providerCalls, 0, 'invalid/unauthenticated requests must not incur provider usage');
  const result = await POST(request()); assert.equal(result.status, 200); assert.equal((await result.json()).score, 7.8);
  responseBody = {}; assert.equal((await POST(request())).status, 422);
  providerOk = false; assert.equal((await POST(request())).status, 502);
  process.env.AZURE_SPEECH_REGION = 'invalid.example'; assert.equal((await GET().json()).enabled, false);
  console.log('PASS: WAV format/duration/silence, real-score parsing, disabled mode, origin/auth, phrase allowlist, streamed body cap, rate limits, es-ES Azure request, missing assessment/provider errors. Provider calls mocked; live Azure still pending.');
})().catch(error => { console.error(error); process.exitCode = 1; });
