# Security fixes ER-01 through ER-12

This archive contains the defensive fixes requested for the EspanolReal audit.

| ID | Fix |
| --- | --- |
| ER-01 | Premium phrase indexes are omitted from normal client builds and served only through an entitlement-checked API. |
| ER-02 | The Telegram webhook fails closed unless a dedicated 32-byte secret is configured and supplied by Telegram. |
| ER-03 | Webhook setup is POST-only and accepts a dedicated admin secret only in `X-Admin-Secret`. |
| ER-04 | Next.js and `eslint-config-next` are pinned to 16.3.3. |
| ER-05 | Browser storage no longer establishes Premium access; server entitlement or an explicit static export is required. |
| ER-06 | License keys are not returned to the client or accepted in lesson URL query strings. |
| ER-07 | Unique database constraints and idempotent fulfillment prevent duplicate charge/order licensing. |
| ER-08 | HSTS, CSP, clickjacking, MIME, referrer, permissions, and API cache headers are configured. JSON-LD escapes `<`. |
| ER-09 | Session signing requires an independent `SESSION_SECRET` of at least 32 bytes. |
| ER-10 | Sensitive routes have body limits and best-effort per-instance rate limits; an edge/WAF limit is still recommended. |
| ER-11 | API failures return generic incident references instead of internal exception text. |
| ER-12 | Nested source archives are excluded and ignored. |

## Deployment requirements

1. Generate independent values for `SESSION_SECRET`, `ADMIN_SECRET`, and `TELEGRAM_WEBHOOK_SECRET` with `openssl rand -hex 32`.
2. Check historical database duplicates with the SQL in `README.md`, back up the database, then run `npx drizzle-kit push`.
3. Re-register the Telegram webhook with authenticated `POST /api/telegram/setup`.
4. Configure platform-level rate limiting for Telegram and payment API routes.
5. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:security` in an environment with npm registry access.

The dependency lock was updated for the pinned Next.js release, but registry access was unavailable in the audit environment. Recreate and review `package-lock.json` with the normal trusted npm registry before production deployment.
