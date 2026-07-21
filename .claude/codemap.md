<!-- codemap-format: v1 -->

# Codemap: Overdue

## Overview

Overdue turns a freeform dump of avoided admin tasks (refunds, deposits, cancellations) into ready-to-send artifacts, then escalates them through three stages when nobody replies. Built for OpenAI Build Week 2026.

Stack: Next.js App Router (16.x, Turbopack) + TypeScript strict, Tailwind v4, shadcn/ui, Zustand (persist), Zod, Vitest. Deployed on Vercel.

Data flow:
```
dump -> POST /api/extract (GPT-5) -> TaskCandidate[]
     -> lib/validate.ts (pure) -> Task[]
     -> POST /api/artifact (GPT-5) + lib/leverage.ts -> Artifact
     -> ReviewCard -> ApprovalGate (user tap) -> lib/escalation.ts
     -> drafted -> sent -> awaiting_reply -> escalate -> drafted(stage+1)
```

Where things live: all task state is client-side in localStorage via `lib/store.ts` (key `overdue-v1`). The server does exactly two things, both stateless route handlers that hold the API key: extraction and artifact generation. The three pure logic modules (`validate`, `leverage`, `escalation`) hold the safety-critical logic and are the only unit-tested code.

Commands: `npm run dev`, `npm run build`, `npm test` (Vitest), `npx tsc --noEmit`.

Project-wide gotchas:
- Model env vars are `MODEL_API_KEY` and `MODEL_BASE_URL`, deliberately NOT `OPENAI_*`. A machine-level `OPENAI_API_KEY` shadows dotenv values in Next (real process env wins), which caused a hard-to-trace 401. Do not rename them back.
- GPT-5 is a reasoning model. Calls must set `reasoning_effort: "low"` and a generous `max_completion_tokens` (3000). A small cap is consumed by reasoning tokens and returns empty content.
- Free access is GitHub Models: roughly 10 requests/min and 50/day per token. Never call the model in a loop. The "Load demo" path is deliberately API-free so the product demos under rate limits.
- The model proposes, deterministic code validates, the user authorizes. Nothing sends and no state transition happens without an explicit tap.
- User dump and pasted content are untrusted data, never instructions. No tool calls from the model.
- Design tokens only (ink/paper/card/muted/line/steel/ochre/rust/pine). No raw hex in components.
- No em dash or en dash in prose written to files.

## app/

### app/layout.tsx
Root layout: loads Bricolage Grotesque, Instrument Sans, and IBM Plex Mono via next/font and exposes them as CSS variables on <html>.
Exports: default RootLayout({ children }); metadata (title "Overdue")
Used by: Next App Router (implicit)
Gotcha: font CSS variable names (--font-display/-body/-mono) are consumed by app/globals.css; renaming breaks all typography.

### app/page.tsx
Client home screen. Wires the store to the header clock, dump bar, queue, and review modal.
Exports: default Home()
Used by: Next App Router (implicit)
Gotcha: renders queue/empty state only after a `mounted` flag, because the persisted store rehydrates on the client and would otherwise cause a hydration mismatch. `onReview` also prefetches the draft via `attachArtifact`.

### app/globals.css
Tailwind v4 entry: maps the six design tokens into the theme, sets paper background and ochre focus ring, and defines the queue card entrance and resolve recede animations.
Gotcha: motion is wrapped in a prefers-reduced-motion guard; `queue-card-enter` reads a `--queue-delay` custom property set inline by TaskQueue.

## app/api/

### app/api/extract/route.ts
POST handler wrapping extractTasks. Per-IP rate limit (429), body-size and dump-length caps (RequestError -> 400), then extractTasks.
Exports: POST(request): Promise<NextResponse>
Used by: lib/store.ts (ingest)
Gotcha: failures return `{ candidates: [], error }` with a real status from lib/api-error classifyError (400/429/502/503), not the old always-200. The `error` string is a fixed safe message, never upstream or Zod text; the real cause is logged via lib/log-error.

### app/api/artifact/route.ts
POST handler wrapping generateArtifact. Rate limit (429), body cap, then parses `task` with TaskSchema and `stage` with EscalationStageSchema.
Exports: POST(request): Promise<NextResponse>
Used by: lib/store.ts (attachArtifact)
Gotcha: same contract as extract, returning `{ artifact: null, error }` with a classified status. Model output `action_url` is sanitised to null inside generateArtifact; ArtifactSchema still hard-rejects an unsafe one.

## lib/

### lib/schema.ts
Zod schemas and inferred types for the entire data model. Single source of truth for every enum.
Exports: IntentSchema/Intent; ArtifactTypeSchema/ArtifactType; TaskStateSchema/TaskState; EscalationStageSchema/EscalationStage (numeric 1|2|3); ProvenanceSchema/Provenance; LeverageSourceSchema/LeverageSource; LeverageItemSchema/LeverageItem; CounterpartySchema/Counterparty; TaskCandidateSchema/TaskCandidate; TaskSchema/Task; ArtifactSchema/Artifact
Used by: lib/validate.ts, lib/leverage.ts, lib/escalation.ts, lib/store.ts, lib/demo.ts, lib/openai/extract.ts, lib/openai/artifact.ts, app/api/artifact/route.ts, and more (grep to enumerate)
Gotcha: EscalationStage is a numeric enum built with `z.enum({opening:1,firm:2,formal:3})`; it accepts 1/2/3 and rejects the string labels.

### lib/validate.ts
Deterministic gate between the model and the app. Turns raw candidates into Task objects.
Exports: validateCandidates(candidates: TaskCandidate[], now: Date): Task[]
Used by: lib/store.ts
Gotcha: pure, clock injected. Drops candidates with confidence < 0.35, dedupes on normalized intent + counterparty name (first wins), assigns ids tsk_01.., and stamps provenance on every field.

### lib/leverage.ts
Curated leverage rules keyed by intent, universal-first with India specifics where they add force.
Exports: LEVERAGE_RULES: Record<Intent, LeverageItem[]>; lookupLeverage(intent): { items: LeverageItem[]; needsModelFallback: boolean }
Used by: lib/openai/artifact.ts, lib/demo.ts
Gotcha: returns the shared rule array by reference, so callers copy before mutating (demo.ts and artifact.ts both copy). `complaint` and `other` are empty and signal needsModelFallback.

### lib/escalation.ts
The stateful core: pure state machine, stage timings, and the simulated clock.
Exports: STAGE_DELAYS_DAYS ({1:5, 2:12}); now(clockOffsetMs): Date; approve(task, at): Task; resolve(task): Task; archive(task): Task; tick(tasks, at): { tasks: Task[]; escalated: string[] }
Used by: lib/store.ts, components/TimeTravelControl.tsx
Gotcha: every function returns new objects and never mutates input. Stage 3 is terminal: it gets a null next_action_at and tick never escalates past it. `now()` is the only impure function.

### lib/store.ts
Zustand store persisted to localStorage; the seam between UI, the pure modules, and the two API routes.
Exports: type StoredTask (Task + artifact?, artifactError?, artifactErrorMessage?, inFlightStage?); type OverdueStore; useStore
Used by: app/page.tsx, components/DumpBar.tsx, components/EmptyState.tsx, components/ReviewCard.tsx, components/ApprovalGate.tsx, components/TimeTravelControl.tsx, lib/demo.ts (type only)
Gotcha: persist key is `overdue-v1`, so any breaking schema change needs a new key or stale local data will rehydrate. `approveTask` guards on inFlightStage to prevent double sends; `runTick` clears the artifact of escalated tasks and refetches at the new stage (one live model call per escalation). `postJson` throws ServiceError on any non-2xx, so config/upstream failures land in the catch and set a specific ingestError or artifactErrorMessage; an empty candidate list at 2xx is a genuine empty extraction, not an error.

### lib/demo.ts
Five realistic seed tasks with pre-baked artifacts so the demo runs with zero model calls.
Exports: DEMO_TASKS: StoredTask[]
Used by: lib/store.ts (seedDemo)
Gotcha: validates every task and artifact against TaskSchema/ArtifactSchema at module load, so a malformed entry throws on import rather than failing silently. next_action_at is null here; seedDemo sets it relative to the current simulated clock.

### lib/utils.ts
shadcn class helper (clsx + tailwind-merge).
Exports: cn(...inputs: ClassValue[]): string

### lib/api-error.ts
Maps a thrown error to an HTTP status and a client-safe message. Own-validation RequestError travels back as 400 verbatim; Zod, ModelConfigError, upstream 429 and everything else map to fixed messages so upstream/provider text never leaks.
Exports: RequestError (class); classifyError(error): { status, message }; ClassifiedError (type)
Used by: app/api/extract/route.ts, app/api/artifact/route.ts
Gotcha: the message is deliberately not the error's own text except for RequestError. Do not pass a Zod or provider message straight through; that is the whole point of the file.

### lib/rate-limit.ts
In-memory per-IP token bucket shared by both model routes. Sliding minute/hour/day windows tuned just under the provider ceiling.
Exports: allowRequest(key, atMs?): boolean; clientKey(request): string; resetRateLimit() (test-only); PER_MINUTE_LIMIT, PER_HOUR_LIMIT, PER_DAY_LIMIT
Used by: app/api/extract/route.ts, app/api/artifact/route.ts, tests/rate-limit.test.ts
Gotcha: per serverless instance and x-forwarded-for is spoofable, so it is a speed bump, not access control. The day cap is the one guarding the ~50/day quota.

### lib/log-error.ts
Server-side failure logging for the two routes. Reduces a Zod error to its issue paths and truncates other messages so a dump or task fields never reach the logs.
Exports: logRouteError(route, error): void
Used by: app/api/extract/route.ts, app/api/artifact/route.ts
Gotcha: keep it content-free. The README promises nothing sensitive is logged; only name, truncated message and status go out.

## lib/openai/

### lib/openai/client.ts
Single place for the model id, the shared call settings, and the OpenAI-compatible client.
Exports: MODEL (default "openai/gpt-5"); CALL_SETTINGS (reasoning_effort low, max_completion_tokens 3000, json_object); openai
Used by: lib/openai/extract.ts, lib/openai/artifact.ts
Gotcha: reads MODEL_API_KEY and MODEL_BASE_URL, never OPENAI_*. Swapping to a different provider or to gpt-5.6 is a one-line change here. Do not set temperature; GPT-5 rejects it.

### lib/openai/extract.ts
Turns a freeform dump into schema-valid task candidates.
Exports: extractTasks(dump: string): Promise<TaskCandidate[]>
Used by: app/api/extract/route.ts
Gotcha: the system prompt treats the dump as untrusted data and forbids following instructions inside it. Output is parsed as JSON then each candidate is safeParsed; invalid ones are silently dropped rather than throwing.

### lib/openai/artifact.ts
Drafts the email, call script, or action link for a task at a given stage, armed with leverage.
Exports: generateArtifact(task: Task, stage: EscalationStage): Promise<Artifact>
Used by: app/api/artifact/route.ts
Gotcha: the model only writes prose. task_id, stage, artifact_type, and leverage_used are filled server-side, so curated leverage is copied verbatim and cannot be reworded. Model-proposed leverage is force-prefixed "Worth checking:" with clamped confidence. Tone is driven by STAGE_INSTRUCTIONS (polite, firm, formal).

## components/

### components/DumpBar.tsx
The freeform input and the primary "Make the first move" action.
Exports: DumpBar()
Used by: app/page.tsx
Gotcha: compares task count before and after ingest to decide success, and shows a plain message when extraction returns nothing (which is what a rate limit looks like to the user).

### components/EmptyState.tsx
First-run thesis headline plus the "Load demo" action.
Exports: EmptyState()
Used by: app/page.tsx

### components/TaskQueue.tsx
Sorts the queue and renders the count summary. The queue is the product's main surface.
Exports: TaskQueue({ tasks, onReview })
Used by: app/page.tsx
Gotcha: sort is active work first (drafted/escalate, then awaiting, sent, resolved, archived), stable within a group by original index. Sets an inline `--queue-delay` custom property to stagger the entrance animation, capped at 6 items.

### components/TaskCard.tsx
One task as a case-file line: state stamp, id, stage meter, title, intent and recipient, next-move date.
Exports: TaskCard({ task, onReview })
Used by: components/TaskQueue.tsx
Gotcha: resolved cards render pine with a strikethrough and reduced opacity (the drained look); archived render muted. The next-move line only appears for awaiting_reply tasks with a next_action_at.

### components/ReviewCard.tsx
Modal review panel: the editable draft, the leverage, provenance tags, missing info, and the footer actions.
Exports: ReviewCard({ task, onClose })
Used by: app/page.tsx
Gotcha: edits write through `editTask` by rebuilding the whole artifact object. Curated and model leverage are rendered in separate sections, model ones under "Worth checking" with an explicit not-legal-advice line. Closes on backdrop mousedown, Escape, and the X button.

### components/ApprovalGate.tsx
The authorize tap. The only code path that performs an outward action.
Exports: ApprovalGate({ task, onApproved })
Used by: components/ReviewCard.tsx
Gotcha: side effects (mailto draft, clipboard copy, opening a link) fire only on the explicit click, then `approveTask` runs. Disabled while the artifact is missing or a stage is in flight, which is what prevents duplicate sends. Email is marked sent optimistically since mailto cannot be confirmed.

### components/EscalationTimeline.tsx
The three-stage ladder (Opening, Firm, Formal) with the current stage filled in its temperature color.
Exports: EscalationTimeline({ stage })
Used by: components/ReviewCard.tsx

### components/TimeTravelControl.tsx
Header control showing the simulated date and advancing it to drive real escalation.
Exports: TimeTravelControl()
Used by: app/page.tsx
Gotcha: renders the date only after mount (placeholder "SIM: ----------" before) to keep SSR markup stable. `advanceDays(5)` runs the real tick, so each escalation triggers a live artifact regeneration.

## components/ui/

### components/ui/StateStamp.tsx
Uppercase mono chip for a TaskState, tinted per state (the ink-stamp identity).
Exports: StateStamp({ state, className? })
Used by: components/TaskCard.tsx, components/ReviewCard.tsx

### components/ui/StageMeter.tsx
Compact three-dot escalation indicator; the active stage fills with its temperature color.
Exports: StageMeter({ stage, className? })
Used by: components/TaskCard.tsx, components/ReviewCard.tsx

### components/ui/button.tsx
shadcn button primitive (unused by the app's hand-styled controls; kept from init).

## tests/

### tests/validate.test.ts
Covers id and initial state assignment, the confidence floor, and dedupe.

### tests/leverage.test.ts
Covers a curated hit for a top intent and the model-fallback signal for an uncovered one.

### tests/escalation.test.ts
Covers approve scheduling next_action_at five days out, tick escalating an overdue awaiting task to stage 2, and stage 3 never auto-escalating.

### tests/schema.test.ts
Covers TaskCandidateSchema accepting a valid candidate and rejecting a bad intent.

### tests/action-url.test.ts
Covers isSafeActionUrl accepting https/mailto and rejecting dangerous schemes, and ArtifactSchema rejecting an unsafe action_url.

### tests/rate-limit.test.ts
Covers the per-minute, per-hour and per-day caps and per-client keying. Hand-stubs Request since jsdom has no constructor.

### tests/api-error.test.ts
Covers classifyError: RequestError travels back as 400, while Zod, ModelConfigError (503) and upstream (429/502) messages never reach the caller.

### tests/smoke.test.ts
Trivial sanity test from scaffolding.

## Root config

### vitest.config.ts
Vitest with the jsdom environment and the React plugin.

### next.config.ts
Default Next config (no custom settings).

### components.json
shadcn/ui configuration (aliases, Tailwind entry).

### .env.local.example
Template for MODEL_API_KEY and MODEL_BASE_URL, with the GitHub Models endpoint prefilled.

### AGENTS.md
Operating rules for the implementation agent: no git, follow the plan, model settings, safety invariants.

### docs/
Vision doc, design spec, implementation plan, design direction, Build Week context, submission checklist, the demo video script, and the build log.
Gotcha: `docs/build-log.md` records the non-obvious constraints (the MODEL_ env naming and why, GPT-5 reasoning-token behaviour, rate-limit-driven demo design). Read it before changing model wiring or env var names.
