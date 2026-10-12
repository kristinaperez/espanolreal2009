# Arabic pronunciation prototype — 2026-10-12

## Scope

The listening stage of all three Arabic lessons now includes a local microphone exercise: select a vocabulary word or lesson phrase, hear the existing es-ES TTS sample, record up to 15 seconds, listen back, delete or retry. Recording is optional and does not affect lesson completion, course progress or Premium access.

No Azure account is required for this first step. No speech recognition, upload or AI assessment is implemented or claimed. The 1–10 scale is explicitly inactive; no indicator or fabricated score appears. This prototype alone should not be advertised as an AI pronunciation assessment feature.

## Recording and privacy

- Request microphone permission only after a click; HTTPS required.
- MediaRecorder selects supported Opus/WebM or MP4, falling back to the browser default.
- Audio remains a temporary Blob URL in browser memory. No fetch, localStorage, IndexedDB, database or analytics receives audio.
- Stop audio tracks on stop, timeout, recording error, unmount, and late permission resolution after unmount.
- Revoke Blob URLs on deletion, re-recording, phrase change and unmount.
- Hide the exercise's sample playback control during capture. Avoid playing other audio while recording.
- Netlify Permissions-Policy changes microphone=() to microphone=(self); camera and other permissions retain their existing restrictions.

## Checks

Run build/typecheck/lint/security and the existing Arabic suites. Recording lifecycle tests:

```sh
npm install --prefix /tmp/espanolreal-voice-qa --no-audit --no-fund jsdom
ARABIC_QA_JSDOM=/tmp/espanolreal-voice-qa/node_modules/jsdom node scripts/arabic/pronunciation-checks.cjs
```

These mocked DOM tests do not prove actual microphone/audio codecs. Manual acceptance on Android Chrome and iPhone Safari: permissions accepted/rejected, playback, retry/delete, auto-stop, leaving the stage while recording, mixed RTL/LTR and no horizontal overflow. Check Telegram separately; if its embedded browser blocks recording, normal browser use must remain possible. Preview must serve microphone=(self).

## Next step: Azure resource integration

Create an Azure Speech resource and store AZURE_SPEECH_KEY and AZURE_SPEECH_REGION only as server secrets in Netlify. Adding these variables does not activate this prototype automatically: the server adapter remains to be implemented.

Before enabling assessment:

1. Verify live scripted Pronunciation Assessment for es-ES against actual recordings and supported region/API. Reference text must resolve from a server-controlled lesson/phrase ID.
2. Implement supported audio decoding/resampling to the provider's required format for both WebM and Safari MP4 (or use an appropriate capture/SDK pipeline); never send incompatible audio as WAV.
3. Add server limits on duration/body size, request timeout, request rate and total assessment usage, origin validation, and provider errors without leaking credentials.
4. Map actual AccuracyScore 0–100 to 0–10 and display available word-level results. Do not invent unavailable phoneme labels, prosody or average-speaker percentiles. Silence/unrecognized/failed requests return no score.
5. Explain external audio processing before submission, review provider retention settings, and avoid storing raw audio or adding it to analytics/logs. Keep recording preview local until the learner explicitly submits.
6. Calibrate educational feedback using real learner and native recordings. Confirm useful results and costs before enabling broadly.

Do not merge this prototype based on unexecuted device/Azure checks; attach exact executed checks to the PR and keep pending work explicit.
