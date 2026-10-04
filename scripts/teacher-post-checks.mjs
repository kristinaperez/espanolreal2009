import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(path, extra = {}) {
  const source = fs.readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, URL, URLSearchParams, AbortSignal, ...extra });
  return exports;
}
const model = load("src/lib/teacher-posts/model.ts");
const draft = { ...model.emptyDraft, topic: "Me pones un café", sourceText: "В баре говорим «Me pones un café», а затем добавляем por favor.", teacherLessonsUrl: "https://example.com/lessons" };
assert.ok(model.parseDraft(draft));
for (const patch of [{ sourceText: "short" }, { sourceText: "x".repeat(8001) }, { tone: "fake" }, { includeCta: "true" }, { teacherLessonsUrl: "javascript:alert(1)" }, { lessonUrl: "https://user:pass@example.com" }]) assert.equal(model.parseDraft({ ...draft, ...patch }), null);
for (const url of ["javascript:alert(1)", "http://example.com", "https://127.0.0.1", "https://192.168.1.2", "https://example.com:99", "https://user:password@example.com"]) assert.equal(model.safePostUrl(url), null);
assert.equal(model.resolveCta(draft, "KristinaPerez9", "https://espanolreal.es").label, "Продолжить в EspanolReal");
assert.equal(model.resolveCta({ ...draft, includeCta: false }, "kristinaperez9", "https://espanolreal.es").url, "https://espanolreal.es/learn");
assert.equal(model.resolveCta(draft, "other", "https://espanolreal.es").label, "Уроки преподавателя");
assert.equal(model.resolveCta({ ...draft, includeCta: false }, "other", "https://espanolreal.es"), null);
assert.equal(model.resolveCta({ ...draft, lessonUrl: "https://example.com/coffee", lessonName: "Кофе" }, "other", "https://espanolreal.es").label, "Продолжить урок «Кофе»");
assert.equal(model.resolveCta({ ...draft, teacherLessonsUrl: "" }, null, "https://espanolreal.es"), null);
let providerBody;
let providerResult;
const env = {};
const generator = load("src/server/teacher-posts/generate.ts", { process: { env }, require: name => name === "server-only" ? {} : model, fetch: async (_, init) => { providerBody = JSON.parse(init.body); return { ok: true, json: async () => providerResult }; } });
const result = await generator.generatePost(draft);
assert.equal(result.mode, "mock");
assert.equal(result.post.explanation, draft.sourceText);
assert.ok(model.parsePost(result.post));
const q = result.post.interactiveQuestion;
for (const patch of [{ correctIndex: 7 }, { correctIndex: "0" }, { options: ["same", "same"] }, { options: [] }, { feedback: "" }]) assert.equal(model.parsePost({ ...result.post, interactiveQuestion: { ...q, ...patch } }), null);
const exported = model.formatPost(result.post, null);
assert.equal(exported.includes("Продолжить в EspanolReal"), false);
assert.ok(exported.includes(draft.sourceText));
env.OPENAI_API_KEY = "test-key"; env.TEACHER_POST_AI_MODEL = "configured-test-model";
providerResult = { output: [{ content: [{ type: "output_text", text: JSON.stringify(result.post) }] }] };
assert.equal((await generator.generatePost(draft)).mode, "ai");
assert.equal(providerBody.store, false);
assert.equal(providerBody.text.format.strict, true);
assert.equal(JSON.parse(providerBody.input).sourceText, draft.sourceText);
providerResult = { output: [{ content: [{ type: "refusal" }] }] };
await assert.rejects(generator.generatePost(draft));
providerResult = { output: [{ content: [{ type: "output_text", text: '{"title":"partial"}' }] }] };
await assert.rejects(generator.generatePost(draft));
const share = load("src/lib/teacher-posts/share.ts");
const url = new URL(share.shareUrl("Telegram", "¿Café? & sí", "https://example.com/p?a=1&b=2"));
assert.equal(url.searchParams.get("text"), "¿Café? & sí");
assert.equal(url.searchParams.get("url"), "https://example.com/p?a=1&b=2");
assert.equal(share.shareUrl("Instagram", exported, ""), null);
console.log("Post validation, account CTA, source-grounded mock, AI contract/refusal, and share encoding passed.");
const origin = load("src/server/teacher-posts/origin.ts");
const request = (browserOrigin, host = "preview.example.com", url = "https://internal.example.com/api/posts") => ({ url, headers: { get: name => name === "origin" ? browserOrigin : name === "host" ? host : null } });
assert.equal(origin.samePostOrigin(request("https://preview.example.com")), true);
assert.equal(origin.samePostOrigin(request("https://evil.test")), false);
assert.equal(origin.samePostOrigin(request(null)), false);
assert.equal(origin.samePostOrigin(request("http://preview.example.com")), false);
assert.equal(origin.samePostOrigin(request("https://preview.example.com/evil")), false);
const calls = [];
const mockUser = { id: 123, telegramId: 777, username: "KristinaPerez9" };
const http = {
 currentUser: async () => mockUser, rateLimit: () => null,
 errorResponse: (message, status = 400) => ({ status, message }),
 jsonResponse: (body, status = 200) => ({ status, body }),
 readJsonBody: async request => request.body,
 siteOrigin: () => "https://espanolreal.es",
};
const publish = load("src/app/api/teacher/posts/publish/route.ts", { require: name => name.endsWith('/http') ? http : name.endsWith('/model') ? model : name.endsWith('/origin') ? origin : { publishPost: async (user, submittedDraft, generated) => { calls.push({ user, submittedDraft, generated }); return { slug: "post-qa" }; } }, process: { env: {} } });
const publication = await publish.POST({ ...request("https://preview.example.com"), body: { draft, post: result.post, mode: "mock", teacherId: 999, username: "spoof", cta: { label: "evil", url: "https://evil.test" } } });
assert.equal(publication.status, 201);
assert.equal(calls[0].user.telegramId, 777);
assert.equal(calls[0].generated.cta.url, "https://espanolreal.es/learn");
assert.equal(calls[0].generated.cta.label, "Продолжить в EspanolReal");
assert.equal((await publish.POST({ ...request("https://evil.test"), body: {} })).status, 403);
console.log("Host/origin normalization and publication ignoring forged author/CTA passed.");
const generationEnv = { OPENAI_API_KEY: "configured-test-key", TEACHER_POST_AI_MODEL: "configured-test-model" };
const generateCalls = [];
const generateRoute = load("src/app/api/teacher/posts/generate/route.ts", { process: { env: generationEnv }, require: name => name.endsWith('/http') ? { ...http, currentUser: async () => null } : name.endsWith('/model') ? model : name.endsWith('/origin') ? origin : { generatePost: async (d, forceMock) => { generateCalls.push(forceMock); return {post: generator.mockPost(d), mode: forceMock ? "mock" : "ai"}; } } });
assert.equal((await generateRoute.POST({...request("https://preview.example.com"),body:draft})).status,401);
assert.equal((await generateRoute.POST({...request("https://preview.example.com"),body:{...draft,mode:"mock"}})).body.mode,"mock");
assert.equal(generateCalls[0],true);
console.log("Configured AI is auth-gated; explicit guest mock never calls paid AI.");

assert.ok(model.parseDraft({ ...draft, includeCta: false, teacherLessonsUrl: "not-a-url", lessonUrl: "javascript:bad" }));
assert.equal(model.parseDraft({ ...draft, includeCta: true, teacherLessonsUrl: "not-a-url" }), null);
