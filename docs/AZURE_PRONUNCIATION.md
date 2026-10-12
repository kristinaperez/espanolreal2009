# Azure pronunciation and navigation — 2026-10-12

## Behavior

Local recording remains available without login. After configuration, the learner can consent and submit a recording for real Azure scripted Pronunciation Assessment in es-ES. Assessment requires existing Telegram server authentication. No score is generated when Azure is disabled, silent audio is rejected, recognition fails, or the response contains no pronunciation assessment. AccuracyScore is displayed as 0–10, with word-level scores and omission/insertion labels. This is an automated estimate, not an official language exam or a population percentile.

The browser decodes its native WebM/MP4 recording and resamples to mono 16 kHz PCM WAV. Unsupported codec decoding fails visibly without uploading an incompatible file. The API validates the WAV header/duration (0.2–16 seconds), caps streamed input at 512044 bytes, accepts reference phrases only from the three server-owned Arabic lesson lists, rejects foreign origins, uses a 20-second Azure timeout and never exposes the key or raw provider exceptions.

Audio is not saved by the app to files, databases, storage or analytics. Consent is required for each recording before external processing. The app cannot promise zero retention by Microsoft: consult the provider's data handling documentation and resource configuration.

## Netlify setup

Create an Azure Speech resource, then obtain its key and exact region identifier from **Keys and Endpoint**. Store secrets in Netlify server/function environment scope; do not use NEXT_PUBLIC prefixes, commit keys, or send them in chat.

| Variable | Value |
| --- | --- |
| AZURE_SPEECH_KEY | Speech resource key |
| AZURE_SPEECH_REGION | Resource region identifier, for example westeurope |
| AZURE_SPEECH_ENABLED | true to activate; false to disable immediately on next environment/deploy refresh |

Redeploy the branch/production after configuration. `/api/pronunciation` returns only `{enabled: boolean}`. Sign in through `/ar/account`, record a phrase, consent and click the assessment button. Check one clear recording, silence, a wrong phrase, missing key and a provider failure. Confirm actual es-ES scores on Chrome and Safari before marketing the feature as live AI assessment.

## Usage limits and rollout

The existing per-instance limiter allows 6 requests/minute and 20/hour per authenticated Telegram account. This is best effort in serverless instances, NOT a global spend cap. Keep the first rollout limited to controlled testing. Configure provider quotas/platform edge limits and monitoring before broad paid-tier use; Azure budget alerts alone do not enforce a hard spending ceiling. Durable aggregate limits are pending and not claimed here.

## Navigation

Remove Create post and Cabinet actions from the public header and mobile menu. Keep their routes intact. Put the RU/AR switch in the first header action row with a Settings link. French appears only in full language selectors in `/learn/settings` and new noindex `/ar/settings`; preserve selection across root-layout navigation. Public and floating compact selectors show RU/AR only.

## Verification

Run `node scripts/arabic/azure-checks.cjs`, the recording lifecycle/three-lesson DOM tests, Arabic content and HTTP suites, typecheck, lint, security and production build. API tests use mocked provider responses and prove guardrails and score mapping, not live Azure quality or credentials. Native device codec/microphone checks and live provider evaluation remain required.

Official API reference: https://learn.microsoft.com/azure/ai-services/speech-service/rest-speech-to-text-short
