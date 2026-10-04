import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(path) {
  const source = fs.readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, URL });
  return exports;
}
const { safeTeacherUrl } = load("src/lib/teacher/urls.ts");
for (const url of ["javascript:alert(1)", "http://calendly.com/test", "https://calendly.com.evil.test/test", "https://evil.test/calendly.com", "https://user:pass@calendly.com/test", "https://calendly.com:444/test", "https://calendly.com/", "https://calendly.com/\\evil", " https://calendly.com/test"]) {
  assert.equal(safeTeacherUrl(url, "calendly"), undefined, url);
}
assert.equal(safeTeacherUrl("https://calendly.com/espanolreal-test/30min", "calendly"), "https://calendly.com/espanolreal-test/30min");
assert.equal(safeTeacherUrl("https://t.me/espanolreal", "telegram"), "https://t.me/espanolreal");
assert.equal(safeTeacherUrl("https://wa.me/34123456789", "whatsapp"), "https://wa.me/34123456789");
assert.equal(safeTeacherUrl("https://vk.com/espanolreal", "vk"), "https://vk.com/espanolreal");
assert.equal(safeTeacherUrl("https://calendly.com/test", "telegram"), undefined);
const { checkTeacherAnswer } = load("src/lib/teacher/practice.ts");
const text = { type: "text", acceptedAnswers: ["La cuenta, por favor"] };
assert.equal(checkTeacherAnswer(text, "  LA CUENTA,   POR FAVOR.  "), true);
assert.equal(checkTeacherAnswer(text, "Un té"), false);
assert.equal(checkTeacherAnswer(text, 0), false);
assert.equal(checkTeacherAnswer({ type: "choice", answerIndex: 1 }, 1), true);
assert.equal(checkTeacherAnswer({ type: "choice", answerIndex: 1 }, "1"), false);
console.log("Teacher URL safety and answer grading checks passed.");
