import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createHmac, createHash } from "node:crypto";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const env = { TELEGRAM_BOT_TOKEN: "123456789:test-only-not-a-live-token", TELEGRAM_AUTH_MAX_AGE: "3600" };
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/telegram/crypto.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require, process: { env }, Buffer, URLSearchParams, Date });
function signed(fields, widget = false) {
 const token = env.TELEGRAM_BOT_TOKEN;
 const key = widget ? createHash("sha256").update(token).digest() : createHmac("sha256", "WebAppData").update(token).digest();
 // Independent protocol producer: only hash is excluded from Mini App HMAC.
 const check = Object.keys(fields).sort().map(k => `${k}=${fields[k]}`).join("\n");
 return { ...fields, hash: createHmac("sha256", key).update(check).digest("hex") };
}
const base = { auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id: 42, first_name: "Café", username: "tester" }), query_id: "test-query" };
for (const fields of [base, { ...base, signature: "Telegram-Ed25519-signature-is-part-of-HMAC" }]) {
 const input = signed(fields);
 assert.equal(exports.verifyInitData(new URLSearchParams(input).toString())?.user.id, 42);
 assert.equal(exports.verifyInitData(new URLSearchParams({ ...input, user: JSON.stringify({ id: 43 }) }).toString()), null);
 if (input.signature) assert.equal(exports.verifyInitData(new URLSearchParams({ ...input, signature: "tampered" }).toString()), null);
}
for (const auth_date of ["0", "NaN", String(Math.floor(Date.now() / 1000) - 4000), String(Math.floor(Date.now() / 1000) + 400)]) {
 assert.equal(exports.verifyInitData(new URLSearchParams(signed({ ...base, auth_date })).toString()), null);
}
const widget = signed({ id: "42", first_name: "Café", auth_date: base.auth_date }, true);
assert.equal(exports.verifyTelegramAuth(widget)?.user.id, 42);
assert.equal(exports.verifyTelegramAuthDetailed(widget).ok, true);
const originalMini = new URLSearchParams(signed(base)).toString();
env.TELEGRAM_BOT_TOKEN = "different-bot:test-token";
assert.equal(exports.verifyInitData(originalMini), null);
assert.equal(exports.verifyTelegramAuth(widget), null);
console.log("Mini App old/new signature field, tampering, freshness, wrong bot and Login Widget regression passed.");
