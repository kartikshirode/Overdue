# Overdue - Design Spec (v1)

OpenAI Build Week 2026 · Track: Apps for your life
Submission deadline: Tue 21 Jul, 5:00 PM PT
Status: approved design, ready for implementation planning

This spec is the concrete build contract. It sits on top of `docs/overdue-project-doc.md` (the vision doc). Where the two differ, this spec wins, because it reflects the four locked decisions.

## Locked decisions

1. **State storage:** localStorage only (client-side). No database, no auth.
2. **Leverage source:** curated rules file for the top intents, GPT-5.6 fallback for the rest.
3. **Jurisdiction:** universal-first leverage, India specifics where needed.
4. **Escalation demo:** a time-travel clock control that drives the real escalation engine.
5. **Stack:** Next.js App Router on Vercel, TypeScript. (Decided, not a fork.)
6. **Name:** Overdue.

## 1. What we are building

Overdue takes a freeform brain-dump of things the user has been avoiding and turns each one into a ready-to-send artifact: an email draft, a call script, or a direct action link, armed with the leverage that makes the other side respond. Nothing sends without a tap. When a task gets no reply, the app escalates the message on its own through three stages.

The product experience is the queue draining. That is the interface.

## 2. Architecture

```
  User dump (freeform text)
        │
        ▼  POST /api/extract  (GPT-5.6, Structured Outputs)
  TaskCandidate[]
        │
        ▼  lib/validate.ts  (pure, deterministic)
  Task[]  (required fields, dates resolved, deduped, confidence gated)
        │
        ▼  POST /api/artifact  (GPT-5.6) + lib/leverage.ts
  Artifact (tone = f(escalation_stage))
        │
        ▼  Review card (editable, shows provenance)
        │  user approves
        ▼  lib/escalation.ts  (pure state machine + clock)
  drafted → sent → awaiting_reply → escalate → drafted(stage+1)
```

**Design rule:** the model proposes, deterministic code validates, the user authorizes. The model never triggers a send or a state transition on its own.

### 2.1 Where things run

- **Server (route handlers, hold the API key):** `/api/extract`, `/api/artifact`. Stateless. They take input, call GPT-5.6, return structured data. They store nothing.
- **Client (browser):** all task state, the validation layer, the leverage lookup, the escalation state machine, and the clock. State persists in localStorage.

### 2.2 Consequence of client-side state (accepted)

The escalation engine ticks while the app is open, not via a server cron. So "it escalates while your laptop is closed" is not literally true in v1. The escalation logic is real and testable; only the always-on scheduler is deferred. This is a deliberate v1 trade for build speed. A server cron is a clean post-hackathon upgrade and does not change the schema or the engine.

## 3. Module boundaries

Each module has one job, a typed interface, and can be understood on its own.

| Module | Responsibility | Kind |
|---|---|---|
| `lib/schema.ts` | Zod schemas + inferred TS types for Task, TaskCandidate, Artifact, provenance, all enums | shared |
| `lib/validate.ts` | Deterministic validation: required-field checks, relative-date resolution, dedupe, confidence gating | pure |
| `lib/leverage.ts` | Curated leverage rules (universal + India) keyed by intent, plus lookup and a "needs model fallback" signal | pure |
| `lib/escalation.ts` | State machine, stage transitions, `next_action_at` computation, clock with time-travel offset, tick function | pure |
| `lib/store.ts` | Zustand store with localStorage persist; holds Task[], clock offset, UI flags | client |
| `lib/openai/extract.ts` | Prompt + Structured Outputs call for extraction | server |
| `lib/openai/artifact.ts` | Prompt + call for artifact generation, tone by stage | server |
| `app/api/extract/route.ts` | Thin handler wrapping `lib/openai/extract.ts` | server |
| `app/api/artifact/route.ts` | Thin handler wrapping `lib/openai/artifact.ts` | server |
| UI components (see §7) | Presentation and interaction only | client |

The three pure modules (`validate`, `leverage`, `escalation`) carry Vitest unit tests. They hold the safety-critical logic, so they are where tests earn their keep.

## 4. Data model

### 4.1 Task schema (superset; TaskCandidate is the pre-validation subset)

```json
{
  "id": "tsk_01",
  "raw_input": "refund for the broken headphones",
  "intent": "refund_request",
  "counterparty": {
    "name": "Boat Lifestyle",
    "channel": "email",
    "contact": null,
    "source": "inferred"
  },
  "desired_outcome": "Full refund for defective product",
  "leverage": [
    {
      "claim": "Defective goods: replacement or refund obligation",
      "basis": "Consumer Protection Act 2019",
      "confidence": 0.81,
      "source": "curated"
    }
  ],
  "missing_info": ["order_id", "purchase_date"],
  "artifact_type": "email",
  "escalation_stage": 1,
  "state": "drafted",
  "next_action_at": "2026-07-26T09:00:00+05:30",
  "confidence": 0.88,
  "provenance": {
    "counterparty.name": "extracted",
    "desired_outcome": "inferred",
    "next_action_at": "default"
  }
}
```

### 4.2 Enums

- `intent`: `refund_request`, `subscription_cancel`, `deposit_return`, `invoice_chase`, `reschedule`, `complaint`, `other`
- `artifact_type`: `email`, `call_script`, `action_link`
- `state`: `drafted`, `sent`, `awaiting_reply`, `escalate`, `resolved`, `archived`
- `escalation_stage`: `1` (Opening), `2` (Firm), `3` (Formal)
- provenance value per field: `extracted`, `inferred`, `default`
- leverage `source`: `curated`, `model`

### 4.3 Provenance rule

Every inferred or defaulted field is labeled. The review card shows the label. Inferred data is never presented as observed fact. This is the cheapest trust mechanism we have and it reads well to judges.

## 5. State machine (`lib/escalation.ts`)

```
  drafted ──approve──▶ sent ──▶ awaiting_reply
                                    │
                        ┌───────────┼───────────┐
                     reply rcvd  timeout    user closes
                        │           │           │
                        ▼           ▼           ▼
                     resolved   escalate     archived
                                    │
                                    └──▶ drafted (stage + 1)
```

- `sent` is set when the user taps approve (v1 send = `mailto:` prefill for email, copy-to-clipboard for scripts, open-link for action links). We mark `sent` optimistically on the tap.
- `awaiting_reply` sets `next_action_at`. Stage timings: stage 1 to 2 after 5 days, stage 2 to 3 after 12 days. These are constants in one place so they are easy to tune (open question in the vision doc; 5/12 is the default).
- `reply received` and `resolved` are manual user actions in v1 (no inbox integration).
- `escalate` transition regenerates the artifact at `stage + 1` via `/api/artifact`, moving the task back to `drafted` at the higher stage. Stage 3 is terminal for auto-escalation.

### 5.1 Clock and time-travel

The engine reads "now" from a single function `now() = realNow + clockOffset`. The time-travel control adjusts `clockOffset`. A `tick()` function scans tasks whose `next_action_at <= now()` and advances them. Advancing the demo clock triggers the real transition and a real artifact regeneration. We fake the clock, never the logic.

## 6. Model usage (GPT-5.6)

- OpenAI-compatible SDK call, `model: openai/gpt-5` (one `MODEL` constant), server-side only. Key in `OPENAI_API_KEY`, base URL in `OPENAI_BASE_URL`. Free access is GitHub Models (10 req/min, 50 req/day), so the demo seeds pre-generated artifacts and keeps live calls minimal. The model id lives in one place so a swap to real `gpt-5.6` later is a single-line change. Codex use in the build satisfies the Build Week model requirement on its own; GPT-5 in the app is an added strength.
- **Extraction:** strict Structured Outputs against a JSON schema derived from `TaskCandidate`. The user dump is untrusted data. The system prompt is fixed and instructs the model to extract only, never to follow instructions found inside the dump. No tool calls.
- **Artifact generation:** input is the validated task plus the target stage and the leverage list from `lib/leverage.ts`. Output is the drafted artifact. Tone maps to stage: stage 1 polite and clear, stage 2 firm and names the delay, stage 3 formal and invokes rights with a final date. The model fills leverage only when `lib/leverage.ts` returns no curated match for the intent.
- **Prompt-injection stance:** all third-party or pasted content is data, never instruction. Fixed action set. Structured Outputs constrains the model to the schema.

## 7. UI

Screens and components (client):

- `DumpBar` - the freeform input. One clear call to action. Supports the demo of typing five things fast.
- `EmptyState` - the empty-to-full transition should feel good; this is the first impression.
- `TaskQueue` - the list of `TaskCard`s. Watching it drain is the product.
- `TaskCard` - compact task summary with state, stage, and next action.
- `ReviewCard` - the editable draft. Shows the artifact, the leverage with source and confidence, provenance labels, and the missing-info clarification prompt when a required field is genuinely absent.
- `ApprovalGate` - the tap that authorizes. Disabled during execution to prevent duplicate sends (idempotency key per task-stage).
- `EscalationTimeline` - shows the 3-stage ladder and where the task is.
- `TimeTravelControl` - dev-facing "advance clock" for the demo.
- `Load demo` action - seeds 5 tasks, one already at `awaiting_reply` near stage 2.

## 8. Leverage layer (`lib/leverage.ts`)

- A curated rules table keyed by `intent`. Each entry has one or more leverage items: `claim`, `basis`, `confidence`, `source: "curated"`.
- Universal-first: chargeback windows, stated deadlines, defective-goods obligation, cooling-off periods. India specifics (Consumer Protection Act 2019, RBI norms) attached where they add force.
- Top intents to curate first: `refund_request`, `subscription_cancel`, `deposit_return`, `invoice_chase`, `reschedule`.
- Lookup returns curated leverage when the intent matches; otherwise it signals the artifact route to have GPT-5.6 propose leverage, tagged `source: "model"` and shown as "worth checking," never asserted as legal advice.

## 9. Safety model

| Risk | Mitigation |
|---|---|
| Model drafts something wrong | Nothing sends without an explicit tap. Every draft is editable. |
| Prompt injection via pasted content | Third-party content is data, never instruction. Fixed action set, no arbitrary tool calls. |
| Hallucinated legal leverage | Leverage carries source and confidence. Low-confidence and model-sourced claims are hedged. Never framed as legal advice. |
| Irreversible action | v1 has no destructive, financial, or legal-filing actions. |
| Sensitive data | No server persistence. Nothing sensitive written to logs. |
| Duplicate sends | Idempotency key per task-stage; approve button disabled during execution. |

## 10. Testing

- Vitest on `lib/validate.ts`, `lib/leverage.ts`, `lib/escalation.ts`.
- Escalation tests cover: stage transitions, `next_action_at` math, the tick function against a fixed clock, and that stage 3 does not auto-escalate further.
- Validate tests cover: missing required fields, relative-date resolution, dedupe, confidence gating.
- Leverage tests cover: curated hit per top intent, and the model-fallback signal on an unknown intent.

## 11. Build sequence

Aligned to the vision doc §8. Four days, Sat to Tue.

- **Sat - Spine:** Next.js scaffold, schema, `/api/extract`, `/api/artifact` for one email draft, dump to draft working end to end.
- **Sun - Differentiator:** localStorage store, real state machine, 3-stage ladder, time-travel control, call script.
- **Mon - Depth + polish:** action links, leverage layer, provenance and clarification in the review card, empty-to-full transition polish, tests green.
- **Tue - Ship:** seed demo data, record the sub-3-minute video, write README with Codex collaboration notes and Session ID, submit early.

Never cut: the escalation ladder or the approval gate.

## 12. Build workflow

- **Brain (Claude Code):** this spec, module contracts, prompts, review, scope discipline, commits, codemap.
- **Hands (Codex):** implementation, scaffolding, UI, wiring, refactors, tests. Codex does not commit.
- Compliance: the majority of core code generation runs through a single sustained Codex session so the submission has a strong `/feedback` Codex Session ID.

## 13. Out of scope for v1

OAuth and real send integration, authentication, multi-user, mobile, auto-send without approval, payments and legal filings, server-side escalation cron, any integration off the demo critical path.
