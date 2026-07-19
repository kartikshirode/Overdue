# Overdue - build log

What actually happened while building this, why the decisions went the way they did, and the problems that cost real time. Written so the next person (or the next session) does not have to rediscover any of it.

Build window: 18 to 21 Jul 2026, for OpenAI Build Week.

## How it was built

Two agents with a hard split:

| Role | Tool | Owned |
|---|---|---|
| Brain | Claude Code | Spec, implementation plan, module contracts, prompts, review, git, the codemap |
| Hands | Codex | All application code, in one sustained session |

The loop per task: Claude wrote a self-contained prompt, Codex implemented it and ran the tests, Claude read the actual files, verified, and committed. Codex never ran git. That constraint is in `AGENTS.md`, which Codex reads at the start of every session, along with the model settings and the safety invariants.

Sixteen tasks, in dependency order: scaffold, schema, validation, leverage, escalation, the two model routes, the store, then the UI in five slices, then demo seed, polish, deploy, submission.

Why this order: everything that could be built and tested without a model came first. Tasks 1 to 5 (schema plus the three pure modules) needed zero API access, so the whole logic core was finished and unit tested before the model access question was even settled. That turned out to matter a lot, because model access took two attempts to sort out.

## Decisions and why

| Decision | Choice | Why |
|---|---|---|
| State storage | localStorage only | No auth, no database, no server persistence. Fastest path to a working demo, and the escalation engine is real code regardless of where it persists. |
| Leverage source | Curated rules plus a hedged model fallback | Hand-written leverage for the five top intents is accurate and citable. A model left to invent legal claims is the single biggest credibility risk in this product. |
| Jurisdiction | Universal first, India specifics where they add force | Chargeback windows and defective-goods duties hold anywhere; CPA 2019 and MSMED add force without making the app India-only. |
| Escalation demo | Time-travel clock driving the real engine | Waiting five days is impossible on camera. Faking the clock keeps the logic honest; faking the logic would have been the cheap version. |
| Stack | Next.js App Router on Vercel | The model calls must be server-side to hold the key, so a backend was needed anyway, and this gives a live URL judges can try. |
| Escalation timings | 5 days to stage 2, 12 days to stage 3 | Arbitrary but defensible defaults, kept in one constants block so they are trivial to tune per intent later. |

### Deliberately out of scope

OAuth and real sending (a mailto prefill demos identically and saved a day), accounts, mobile, auto-send, payments, and a server-side cron for escalation. The cut order under time pressure was written down in advance: action links first, then the clarification loop, then call scripts. Nothing was ever cut, because the logic core landed early.

The one honest consequence of localStorage: the escalation engine ticks while the app is open, not on a server schedule. So "it escalates while your laptop is closed" is not literally true in v1. The engine is real and tested; only the always-on scheduler is deferred, and adding it later changes no schema and no logic.

## Problems that cost real time

### 1. There is no free GPT-5.6

The hackathon is framed around GPT-5.6 and Codex. GPT-5.6 has no free tier anywhere, and buying credits was not an option for this build.

What we found: GitHub Models gives free OpenAI API access with nothing but a GitHub account and a fine-grained token with the `Models: read` permission. The catalog has the GPT-5 series but not 5.6.

Resolution: the official rules require the project to be built "using Codex and/or GPT-5.6". Codex wrote the entire implementation, which satisfies that on its own, so running the app on GPT-5 is an added strength rather than a gap. The model id lives in one constant, so a swap to 5.6 is a one-line change if access ever appears.

### 2. A system environment variable silently shadowed the API key

Symptom: every model call from the Next app returned 401, while the exact same token worked from curl and from a plain Node script using the identical client code.

Cause: the machine had a system-level `OPENAI_API_KEY` set to an unrelated NVIDIA key (`nvapi-...`). Next gives real process environment variables precedence over `.env.local`, so the app was sending the wrong key and never even looked at ours.

How it was found: a temporary debug route that reported the key length and prefix the running server actually saw. It returned 70 characters starting `nvapi-` instead of 93 starting `github_pat_`. Guessing would not have found this; every other signal pointed at the token being fine, because it was.

Resolution: the app reads `MODEL_API_KEY` and `MODEL_BASE_URL`, names nothing on a developer machine is likely to own. This is recorded in the codemap so it does not get "cleaned up" back to `OPENAI_*` later.

Side note worth keeping: a `_`-prefixed folder under `app/api/` is a private folder in the App Router and is not routed, so the first debug route 404ed until it was renamed.

### 3. GPT-5 returns empty content if the token cap is too low

Symptom: a valid call, HTTP 200, `finish_reason: "length"`, and completely empty content.

Cause: GPT-5 is a reasoning model. Reasoning tokens are spent from the completion budget first. With `max_completion_tokens: 16` the entire budget went to reasoning and nothing was left for the answer.

Resolution: every call sets `reasoning_effort: "low"` and `max_completion_tokens: 3000`, and never sets `temperature` (the model rejects it). Structured calls use `response_format: { type: "json_object" }` and validate the parsed JSON with Zod rather than relying on strict schema support through a proxy. These settings were verified against the live endpoint before any route was written, then recorded in `AGENTS.md` so both routes use them.

### 4. Rate limits shaped the demo design

GitHub Models allows roughly 10 requests a minute and 50 a day per token. Heavy testing across a build day exhausts that, and the endpoint returns a mix of 500s and 429s under pressure.

Resolution: the demo path needs zero model calls. `Load demo` seeds five complete tasks with their drafts already baked in, so the entire product (queue, review, leverage, approval, escalation state, resolve) is explorable under any rate limit. Only a fresh dump and an escalation regeneration touch the model. That was a design decision made because of the constraint, and it also makes the live URL robust for judges.

### 5. A functional gap found in review, not in testing

The store had `resolveTask` and `archiveTask` from early on, but no UI ever called them. Everything passed, because nothing tested for the absence of a control. The queue could fill and escalate but could never drain, which is the product's own stated experience.

Caught by reading the components against the plan rather than by running them. Resolve and archive were added to the review panel footer in the polish task.

## Verification approach

- The three pure modules (`validate`, `leverage`, `escalation`) are unit tested with an injected clock. They hold every rule that matters: the confidence floor, dedupe, stage timings, and the fact that stage 3 never auto-escalates.
- The hardcoded demo data is validated against the Zod schemas at module load, so a malformed seed entry throws on import instead of failing silently in front of an audience.
- Model routes were verified against the live endpoint rather than mocked, because the failures that mattered (empty content, shadowed keys, rate limits) only appear against the real service.
- Every task was reviewed by reading the files, not by trusting the "done" report. Two tasks were reported complete when nothing had been written to disk, and one report claimed a file read the old environment variable names when it did not.

## If this continues

- Server-side escalation on a cron so it runs with the laptop closed. Schema and engine already support it.
- Real sending through Gmail OAuth instead of a mailto prefill, which turns the approval gate into a genuine send.
- Reply detection, so `resolved` stops being a manual button.
- Per-intent escalation timings; refunds should move faster than deposits.
- Leverage rules per jurisdiction, chosen from the user's locale.
