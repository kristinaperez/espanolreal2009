#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let failures = 0;

function check(label, condition) {
  console.log(`${condition ? "  OK" : "FAIL"}  ${label}`);
  if (!condition) failures += 1;
}

const searchPage = read("src/app/learn/search/page.tsx");
const reviewPage = read("src/app/learn/review/page.tsx");
const mistakesPage = read("src/app/learn/mistakes/page.tsx");
const lessonApi = read("src/app/api/lessons/[n]/route.ts");
const trainer = read("src/components/trainer/trainer-page.tsx");
const webhook = read("src/app/api/telegram/webhook/route.ts");
const setup = read("src/app/api/telegram/setup/route.ts");
const session = read("src/lib/session.ts");
const schema = read("src/db/schema.ts");
const account = read("src/server/account.ts");
const orders = read("src/server/orders.ts");
const envExample = read(".env.example");
const netlify = read("netlify.toml");
const packageJson = JSON.parse(read("package.json"));

for (const [label, source] of [
  ["search page", searchPage],
  ["review page", reviewPage],
  ["mistakes page", mistakesPage],
]) {
  check(`${label} starts with a protected client phrase index`, source.includes("getClientPhraseIndex()") && !source.includes("getPhraseIndex()"));
}

check("premium lesson API ignores query-string keys", !lessonApi.includes("searchParams.get(\"key\")"));
check("trainer never sends a key in a URL", !trainer.includes("?key=") && !trainer.includes("encodeURIComponent(licenseKey)"));
check("webhook requires a configured secret", webhook.includes('configuredSecret("TELEGRAM_WEBHOOK_SECRET")') && webhook.includes("if (!expected)"));
check("webhook validates amount, currency and Telegram payer", webhook.includes("payment.total_amount === order.stars") && webhook.includes("payment.currency === order.currency") && webhook.includes("payerId === user.telegramId"));
check("setup is POST-only and header-authenticated", setup.includes("export async function POST") && !setup.includes("export async function GET") && setup.includes("adminSecretOk(request)"));
check("session has no bot-token or development-secret fallback", !session.includes("TELEGRAM_BOT_TOKEN") && !session.includes("development-secret"));
check("database enforces one charge and one license per order", schema.includes('chargeId: text("charge_id").unique()') && /orderId:[\s\S]{0,100}\.unique\(\)/.test(schema));
check("payment fulfillment cannot reopen refunded orders", orders.includes('if (order.status !== "pending") return null') && orders.includes('eq(orders.status, "pending")'));
check("entitlement requires a currently paid order", /findPaidLicenseForUser[\s\S]*innerJoin\([\s\S]*eq\(orders\.status, "paid"\)/.test(orders));
check("account payload does not expose license keys", !/premium:[\s\S]{0,180}key:/.test(account));
check("public master license key was removed", !envExample.includes("NEXT_PUBLIC_MASTER_LICENSE_KEY"));
check("baseline security headers are configured", netlify.includes("Strict-Transport-Security") && netlify.includes("Content-Security-Policy =") && netlify.includes("X-Frame-Options"));
check("Next.js security update is pinned", packageJson.dependencies.next === "16.3.3" && packageJson.devDependencies["eslint-config-next"] === "16.3.3");

const apiFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /route\.ts$/.test(entry.name)) apiFiles.push(full);
  }
}
walk(path.join(root, "src", "app", "api"));
const leakingErrors = apiFiles.filter((file) => /\$\{\s*\(error as Error\)\.message\s*\}/.test(fs.readFileSync(file, "utf8")));
check("API routes do not reflect internal exception messages", leakingErrors.length === 0);

const forbiddenArtifacts = [];
function findArtifacts(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "out"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findArtifacts(full);
    else if (/\.(?:zip|tar\.gz)$/i.test(entry.name)) forbiddenArtifacts.push(full);
  }
}
findArtifacts(root);
check("source tree contains no nested archives", forbiddenArtifacts.length === 0);

console.log(failures ? `\n${failures} security regression check(s) failed.` : "\nAll security regression checks passed.");
process.exit(failures ? 1 : 0);
