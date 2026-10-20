#!/usr/bin/env node
/**
 * Static export build for the offline-only variant of Español Real.
 *
 * Telegram login and Stars payments need a server, so those API routes are
 * temporarily moved out of `src/app` for this build. The learning trainer,
 * content, progress and offline license-key activation keep working.
 *
 * Usage: node scripts/build-static.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const API_DIR = path.join(process.cwd(), "src", "app", "api");
const STASH = path.join(process.cwd(), ".telegram-api-stash");
const SERVER_ROUTES = ["(main)/p", "media", "(main)/blog", "(main)/admin"].map(name => [path.join(process.cwd(), "src", "app", name), path.join(process.cwd(), `.static-${name.replaceAll("/", "-")}-stash`)]);
const SITEMAP = path.join(process.cwd(), "src/app/sitemap.ts");
const SITEMAP_STASH = path.join(process.cwd(), ".static-sitemap-stash");

function move(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  return true;
}

// Recover the original server sitemap if a previous offline build was interrupted.
if (fs.existsSync(SITEMAP_STASH)) {
  if (fs.existsSync(SITEMAP)) fs.unlinkSync(SITEMAP);
  move(SITEMAP_STASH, SITEMAP);
}
// Recover from a previously interrupted run first.
if (fs.existsSync(STASH)) {
  if (fs.existsSync(API_DIR)) {
    console.error(`Both ${API_DIR} and ${STASH} exist — resolve manually.`);
    process.exit(1);
  }
  move(STASH, API_DIR);
}

for (const [source, stash] of SERVER_ROUTES) {
  if (fs.existsSync(stash)) { if (fs.existsSync(source)) throw new Error(`Both ${source} and ${stash} exist`); move(stash, source); }
}
try {
  move(SITEMAP, SITEMAP_STASH);
  fs.writeFileSync(SITEMAP, 'export const dynamic = "force-static";\nexport default function sitemap() { return [{ url: "https://espanolreal.es/" }]; }\n');
  for (const [source, stash] of SERVER_ROUTES) move(source, stash);
  const stashed = move(API_DIR, STASH);
  if (stashed) {
    console.log("• Moved src/app/api aside (server routes are not exportable).");
  }
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "true",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
      PROTECT_PREMIUM_CONTENT: "false",
    },
  });
} finally {
  if (fs.existsSync(SITEMAP_STASH)) {
    if (fs.existsSync(SITEMAP)) fs.unlinkSync(SITEMAP);
    move(SITEMAP_STASH, SITEMAP);
  }
  for (const [source, stash] of SERVER_ROUTES) if (fs.existsSync(stash) && !fs.existsSync(source)) move(stash, source);
  if (fs.existsSync(STASH) && !fs.existsSync(API_DIR)) {
    move(STASH, API_DIR);
    console.log("• Restored src/app/api.");
  }
}
