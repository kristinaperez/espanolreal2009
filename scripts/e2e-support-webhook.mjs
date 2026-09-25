#!/usr/bin/env node
/**
 * E2E mock test for the Telegram Support Bot webhook endpoint.
 *
 * Starts a local Node.js HTTP mock that intercepts Telegram Bot API calls,
 * then sends HTTP requests directly to the running app's webhook endpoint.
 *
 *   node scripts/e2e-support-webhook.mjs [baseUrl]
 *
 * Requires the app to be running with:
 *   TELEGRAM_SUPPORT_BOT_TOKEN=7000000099:support-test-token-mock
 *   TELEGRAM_API_URL=http://127.0.0.1:4011
 *   TELEGRAM_SUPPORT_WEBHOOK_SECRET=support-webhook-secret-at-least-32-bytes!!
 *   TELEGRAM_SUPPORT_ADMIN_CHAT_ID=123456789
 *   SESSION_SECRET=0123456789abcdef0123456789abcdef
 *   ADMIN_SECRET=admin-secret-value-at-least-32-bytes-long!!
 *   NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3200
 */
import http from "node:http";

const BASE = process.argv[2] ?? "http://127.0.0.1:3200";
const SUPPORT_WEBHOOK_SECRET =
  process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET ??
  "support-webhook-secret-at-least-32-bytes!!";
const MOCK_PORT = Number(
  new URL(process.env.TELEGRAM_API_URL ?? "http://127.0.0.1:4011").port ?? 4011,
);
const ADMIN_CHAT_ID = Number(process.env.TELEGRAM_SUPPORT_ADMIN_CHAT_ID ?? 123456789);

const ENDPOINT = `${BASE}/api/telegram/support/webhook`;

let failures = 0;

// Recorded Telegram Bot API calls from the mock server
const mockCalls = { sendMessage: [], answerCallbackQuery: [] };

// ---------------------------------------------------------------- mock API
const mock = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const method = (req.url ?? "").replace(/^\/bot[^/]+\//, "");
    let payload = {};
    try { payload = body ? JSON.parse(body) : {}; } catch { /* ignore */ }

    if (method === "sendMessage") {
      mockCalls.sendMessage.push(payload);
    } else if (method === "answerCallbackQuery") {
      mockCalls.answerCallbackQuery.push(payload);
    }

    res.writeHead(200, { "content-type": "application/json" });
    if (method === "sendMessage") {
      res.end(JSON.stringify({ ok: true, result: { message_id: 1, chat: { id: payload.chat_id }, text: payload.text } }));
    } else {
      res.end(JSON.stringify({ ok: true, result: true }));
    }
  });
});

await new Promise((resolve) => mock.listen(MOCK_PORT, "127.0.0.1", resolve));
console.log(`\n▶ Telegram Support Bot — E2E mock test\n  Mock Telegram API: http://127.0.0.1:${MOCK_PORT}\n  App endpoint: ${ENDPOINT}\n`);

// ---------------------------------------------------------------- helpers
function check(label, condition, extra) {
  if (condition) {
    console.log(`  ✔ ${label}`);
  } else {
    failures += 1;
    const detail = extra !== undefined ? ` — ${JSON.stringify(extra).slice(0, 300)}` : "";
    console.log(`  ✘ ${label}${detail}`);
  }
}

async function post(headers, body) {
  let rawBody;
  if (typeof body === "string") {
    rawBody = body;
  } else {
    rawBody = JSON.stringify(body);
  }
  const url = new URL(ENDPOINT);
  const options = {
    hostname: url.hostname,
    port: Number(url.port) || 80,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(rawBody),
      ...headers,
    },
  };
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = { raw: data.slice(0, 200) }; }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on("error", (err) => resolve({ status: 0, json: { error: err.message } }));
    req.write(rawBody);
    req.end();
  });
}

const AUTH = { "x-telegram-bot-api-secret-token": SUPPORT_WEBHOOK_SECRET };
const CHAT_ID = 987654321;

// =================================================================
// 1. Authentication
// =================================================================
console.log("▶ 1. Authentication\n");

const noSecret = await post({}, { update_id: 1, message: { message_id: 1, chat: { id: CHAT_ID }, text: "/id" } });
check("missing secret → 403", noSecret.status === 403, noSecret);

const wrongSecret = await post(
  { "x-telegram-bot-api-secret-token": "wrong-secret-value-totally-different" },
  { update_id: 2, message: { message_id: 2, chat: { id: CHAT_ID }, text: "/id" } },
);
check("wrong secret → 403", wrongSecret.status === 403, wrongSecret);

const correctAuth = await post(AUTH, { update_id: 3, message: { message_id: 3, chat: { id: CHAT_ID }, text: "/id" } });
check("correct secret → authenticated (not 403)", correctAuth.status !== 403, correctAuth);

// =================================================================
// 2. Malformed / edge-case bodies
// =================================================================
console.log("\n▶ 2. Malformed / edge-case bodies\n");

const malformed = await post(AUTH, "this is not json{{{");
check(
  "malformed JSON → does not crash (200 or 400, not 500)",
  malformed.status === 200 || malformed.status === 400,
  malformed,
);
check(
  "malformed JSON → no internal error message exposed",
  !JSON.stringify(malformed.json ?? "").includes("SyntaxError") &&
    !JSON.stringify(malformed.json ?? "").includes("at Object.parse"),
  malformed,
);

const emptyBody = await post(AUTH, "");
check("empty body → does not crash (200 or 400, not 500)", emptyBody.status === 200 || emptyBody.status === 400, emptyBody);

// =================================================================
// 3. /id command
// =================================================================
console.log("\n▶ 3. /id command\n");

mockCalls.sendMessage.length = 0;
const idCmd = await post(AUTH, {
  update_id: 10,
  message: {
    message_id: 10,
    from: { id: CHAT_ID, first_name: "Test" },
    chat: { id: CHAT_ID },
    text: "/id",
  },
});
check("/id → 200 ok", idCmd.status === 200, idCmd);
check("/id → handled: id", idCmd.json?.handled === "id", idCmd.json);
await new Promise((r) => setTimeout(r, 150));
check(
  "/id → bot sends message containing chat ID",
  mockCalls.sendMessage.some(
    (m) => m.chat_id === CHAT_ID && String(m.text ?? "").includes(String(CHAT_ID)),
  ),
  mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id, text: String(m.text ?? "").slice(0, 80) })),
);

// =================================================================
// 4. /start command
// =================================================================
console.log("\n▶ 4. /start command\n");

mockCalls.sendMessage.length = 0;
const startCmd = await post(AUTH, {
  update_id: 11,
  message: {
    message_id: 11,
    from: { id: CHAT_ID, first_name: "Test" },
    chat: { id: CHAT_ID },
    text: "/start",
  },
});
check("/start → 200 ok", startCmd.status === 200, startCmd);
check("/start → handled: start", startCmd.json?.handled === "start", startCmd.json);
await new Promise((r) => setTimeout(r, 150));
check(
  "/start → bot sends inline keyboard (category menu)",
  mockCalls.sendMessage.some(
    (m) => m.chat_id === CHAT_ID && Array.isArray(m.reply_markup?.inline_keyboard),
  ),
  mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id, has_keyboard: !!m.reply_markup })),
);

// =================================================================
// 5. callback_query
// =================================================================
console.log("\n▶ 5. callback_query (bug / idea / question)\n");

for (const category of ["bug", "idea", "question"]) {
  mockCalls.sendMessage.length = 0;
  mockCalls.answerCallbackQuery.length = 0;
  const cb = await post(AUTH, {
    update_id: 20,
    callback_query: {
      id: `cbq-${category}`,
      from: { id: CHAT_ID, first_name: "Test" },
      data: `support:${category}`,
      message: { message_id: 5, chat: { id: CHAT_ID }, text: "Menu" },
    },
  });
  check(`callback_query support:${category} → 200 ok`, cb.status === 200, cb.json);
  check(`callback_query support:${category} → handled: callback_query`, cb.json?.handled === "callback_query", cb.json);
  await new Promise((r) => setTimeout(r, 100));
  check(
    `callback_query support:${category} → answerCallbackQuery called`,
    mockCalls.answerCallbackQuery.some((m) => m.callback_query_id === `cbq-${category}`),
    mockCalls.answerCallbackQuery,
  );
  check(
    `callback_query support:${category} → force_reply prompt sent`,
    mockCalls.sendMessage.some((m) => m.chat_id === CHAT_ID && m.reply_markup?.force_reply === true),
    mockCalls.sendMessage.map((m) => m.reply_markup),
  );
}

// =================================================================
// 6. User reply → forwarded to admin
// =================================================================
console.log("\n▶ 6. User reply → admin forwarding\n");

// Text that parseSupportReplyMarker uses to detect category (checks for emoji)
const promptText =
  "🐛 <b>Ошибка</b>\n\nЧто случилось? Опишите ошибку одним сообщением.\nМожно написать по-русски.";

mockCalls.sendMessage.length = 0;
const userReply = await post(AUTH, {
  update_id: 30,
  message: {
    message_id: 30,
    from: { id: CHAT_ID, first_name: "Ana", username: "ana_test" },
    chat: { id: CHAT_ID },
    text: "Карточка засчиталась неправильно",
    reply_to_message: {
      message_id: 5,
      text: promptText,
    },
  },
});
check("user reply → 200 ok", userReply.status === 200, userReply);
check("user reply → handled: support_message", userReply.json?.handled === "support_message", userReply.json);
await new Promise((r) => setTimeout(r, 150));

if (ADMIN_CHAT_ID) {
  check(
    "user reply → forwarded to TELEGRAM_SUPPORT_ADMIN_CHAT_ID",
    mockCalls.sendMessage.some((m) => m.chat_id === ADMIN_CHAT_ID),
    mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id })),
  );
  check(
    "forwarded message → contains user reply text",
    mockCalls.sendMessage.some(
      (m) =>
        m.chat_id === ADMIN_CHAT_ID &&
        (m.text ?? "").includes("Карточка засчиталась неправильно"),
    ),
    mockCalls.sendMessage
      .filter((m) => m.chat_id === ADMIN_CHAT_ID)
      .map((m) => String(m.text ?? "").slice(0, 100)),
  );
  check(
    "user reply → ✅ confirmation sent back to user",
    mockCalls.sendMessage.some(
      (m) => m.chat_id === CHAT_ID && (m.text ?? "").includes("✅"),
    ),
    mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id, text: String(m.text ?? "").slice(0, 60) })),
  );
}

// =================================================================
// 7. Admin reply → delivered back to the user
// =================================================================
console.log("\n▶ 7. Admin reply → user delivery\n");

mockCalls.sendMessage.length = 0;
const adminReply = await post(AUTH, {
  update_id: 40,
  message: {
    message_id: 40,
    from: { id: ADMIN_CHAT_ID, first_name: "Admin" },
    chat: { id: ADMIN_CHAT_ID },
    text: "Проверил: исправлю это в следующем обновлении.",
    reply_to_message: {
      message_id: 31,
      text: `🇪🇸 <b>Español Real · Support</b>\n<b>Telegram ID:</b> <code>${CHAT_ID}</code>\n<b>Message:</b>\nКарточка засчиталась неправильно`,
    },
  },
});
check("admin reply → 200 ok", adminReply.status === 200, adminReply);
check("admin reply → handled: admin_reply", adminReply.json?.handled === "admin_reply", adminReply.json);
await new Promise((r) => setTimeout(r, 150));
check(
  "admin reply → delivered to original user",
  mockCalls.sendMessage.some(
    (m) => m.chat_id === CHAT_ID && (m.text ?? "").includes("исправлю это в следующем обновлении"),
  ),
  mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id, text: String(m.text ?? "").slice(0, 100) })),
);
check(
  "admin reply → confirmation sent to admin",
  mockCalls.sendMessage.some(
    (m) => m.chat_id === ADMIN_CHAT_ID && (m.text ?? "").includes("Ответ отправлен пользователю"),
  ),
  mockCalls.sendMessage.map((m) => ({ chat_id: m.chat_id, text: String(m.text ?? "").slice(0, 100) })),
);

// =================================================================
// 8. Non-admin cannot use the admin reply path
// =================================================================
console.log("\n▶ 8. Non-admin cannot reply as developer\n");

mockCalls.sendMessage.length = 0;
const forgedAdminReply = await post(AUTH, {
  update_id: 41,
  message: {
    message_id: 41,
    from: { id: CHAT_ID, first_name: "Ana" },
    chat: { id: CHAT_ID },
    text: "Я не админ",
    reply_to_message: {
      message_id: 31,
      text: `<b>Telegram ID:</b> <code>${ADMIN_CHAT_ID}</code>`,
    },
  },
});
check("non-admin forged reply → does not use admin path", forgedAdminReply.json?.handled !== "admin_reply", forgedAdminReply.json);
check(
  "non-admin forged reply → does not send developer reply",
  !mockCalls.sendMessage.some((m) => (m.text ?? "").includes("Ответ разработчика")),
  mockCalls.sendMessage,
);

// =================================================================
// 9. Unknown update type — graceful ignore
// =================================================================
console.log("\n▶ 7. Unknown / no-op updates\n");

const unknownUpdate = await post(AUTH, { update_id: 99, unknown_field: { data: "whatever" } });
check("unknown update type → 200 ignored gracefully", unknownUpdate.status === 200, unknownUpdate);
check("unknown update → ok: true", unknownUpdate.json?.ok === true, unknownUpdate.json);

const noText = await post(AUTH, {
  update_id: 100,
  message: { message_id: 100, chat: { id: CHAT_ID } },
});
check("message with no text → 200 ignored", noText.status === 200, noText.json);

// =================================================================
// 10. Error safety — no stack traces
// =================================================================
console.log("\n▶ 8. Error response safety\n");

const bigStr = JSON.stringify(malformed.json ?? "");
check(
  "malformed JSON response → no stack trace or SyntaxError detail",
  !bigStr.includes("at Object.") && !bigStr.includes("SyntaxError"),
  bigStr.slice(0, 200),
);

// =================================================================
mock.close();
console.log(
  `\n${failures === 0 ? "✅ All support webhook checks passed" : `❌ ${failures} check(s) failed`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
