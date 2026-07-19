# Overdue

**You know what needs doing. Overdue makes the first move, and keeps moving when nobody replies.**

Live: https://overdue-nine.vercel.app
Built for OpenAI Build Week 2026, track: Apps for your life.

To see it without typing anything, open the app and hit **Load demo**. That fills the queue with five real tasks and their drafts, no setup.

## The problem

Everyone carries a list of things they know how to do and still haven't done. The refund never claimed. The subscription still charging. The deposit the landlord never returned. The invoice unpaid for months.

These aren't hard. People get stuck because someone has to start, and starting means a blank draft, a confrontation, and the near certainty of being ignored the first time. So the task slides to tomorrow. Then the return window closes and the cost is permanent.

AI already solved the knowing part. Ask any model and it tells you what to write. What stays manual is the nerve to send it, and the patience to send it again when the first message gets ignored on purpose. That second half is an endurance problem, and endurance is exactly what software should carry.

## What it does

You dump the things you have been avoiding in whatever messy words you have:

```
cancel gym, refund for the broken headphones,
chase landlord about deposit, reschedule dentist
```

Overdue turns each one into a ready-to-send artifact: a drafted email, a call script with the number, or a direct action link, armed with the leverage that actually makes the other side respond. You review, edit if you want, and tap once. Done.

When nothing comes back, it escalates on its own. The message gets firmer, cites the right rule, and moves through three stages so persistence stops depending on your willpower.

### The two things a chat box cannot do

1. **Persistent state and an escalation ladder.** Each task has a state and a clock. If a message goes unanswered, Overdue moves it from a polite opening to a firm follow-up to a formal notice, on its own. A chat box has no memory of what it sent and no reason to speak first.
2. **Leverage, not just politeness.** The draft knows the chargeback window, the cooling-off period, the consumer-protection clause. Curated rules cover the top intents, and every claim carries a source you can check. It is framed as leverage, never as legal advice.

## How it works

```
dump -> extract -> validate -> draft + leverage -> review -> approve -> wait -> escalate
```

The rule that holds the whole thing together: **the model proposes, deterministic code validates, the user authorizes.** The model never sends anything and never changes a task's state on its own. Every send and every stage change runs through plain code with a tap in front of it.

- **Extraction** turns the freeform dump into structured tasks. The user text is treated as untrusted data, never as instructions.
- **Validation** is pure TypeScript: it assigns ids, gates out low-confidence guesses, dedupes, resolves dates, and stamps every field with its provenance (extracted, inferred, or default) so inferred data is never shown as fact.
- **Leverage** comes from a curated rules table for the top intents, with a hedged model fallback for the rest.
- **The escalation engine** is a pure state machine with an injected clock. The demo has a time-travel control that advances the clock and drives the real engine, so you can watch a task escalate without waiting five days. The clock is faked; the logic is real.

All task state lives in localStorage. No database, no accounts, no server-side storage. Two thin server routes hold the API key and make the model calls; everything else runs in the browser.

### Tech

Next.js App Router, TypeScript, Tailwind, Zustand, Zod, Vitest. The pure modules (validate, leverage, escalation) are unit tested.

### Model

The app calls OpenAI's GPT-5 through an OpenAI-compatible endpoint. It reads the key from `MODEL_API_KEY` and the base URL from `MODEL_BASE_URL`, both server-side only. Free access is GitHub Models, which is rate limited to about 10 requests a minute and 50 a day, so the demo path is built to run with no model calls and the model id sits in one constant for an easy swap.

## How Codex was used

This project was built with Codex as the implementation agent across a single sustained session. Claude Code acted as the architect and reviewer: it wrote the design spec and the task-by-task plan, and reviewed and committed each result. Codex wrote the code, one task at a time, from the spec:

- scaffolded the Next.js app and the Vitest setup
- built the Zod schema, the deterministic validation layer, the curated leverage rules, and the escalation state machine, each test-first
- wrote the two GPT-5 route handlers with strict JSON validation and an injection-resistant prompt
- built the Zustand store, the whole UI (dump bar, queue, review panel, approval gate, escalation ladder, time-travel control), and the demo seed data
- closed the resolve loop and did the accessibility and motion polish

Codex Session ID: `PASTE_YOUR_CODEX_SESSION_ID_HERE`

## Run it locally

```bash
npm install
cp .env.local.example .env.local
# put a GitHub fine-grained token with the "Models: read" permission in MODEL_API_KEY
npm run dev
```

Then open http://localhost:3000 and hit Load demo, or type your own dump.

```bash
npm test    # runs the unit tests for the pure logic
```

## Safety

- Nothing sends without an explicit tap. Every draft is editable.
- Pasted or third-party content is data, never instruction. The model gets a fixed action set and makes no tool calls.
- Leverage carries a source and a confidence. Model-sourced claims are hedged and shown as worth checking, never as settled fact or legal advice.
- v1 does nothing irreversible: no payments, no filings, no auto-send.
- No unnecessary persistence, and nothing sensitive written to logs.
