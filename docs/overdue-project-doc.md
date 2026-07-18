# Overdue

**You know what needs doing. Overdue does the first move — and keeps moving when nobody replies.**

OpenAI Build Week 2026 · Track: Apps for your life
Submission deadline: Tue 21 Jul, 5:00 PM PT (Wed 22 Jul, 5:30 AM IST)

---

## 1. Problem

Everyone is carrying a list of things they know exactly how to do, and haven't done.

The refund never claimed. The subscription still charging. The deposit the landlord never returned. The invoice unpaid for four months. The complaint never filed, the appointment never rescheduled, the follow-up never sent.

These aren't hard tasks. Nobody is stuck because they don't know what to say — they're stuck because **someone has to start**, and starting means confrontation, a blank draft, and the near-certainty of being ignored the first time.

So the task moves to tomorrow. Then it moves again. Eventually the return window closes, the chargeback deadline passes, the deposit is written off, and the cost becomes permanent — paid in money, and in the low-grade dread of a list that never shrinks.

### 1.1 Why this is still un-automated

AI solved the *knowing*. Ask any model and it will tell you precisely what to write. That was never the bottleneck.

What remains manual in daily life falls into three buckets:

| Bucket | Example | Automatable? |
|---|---|---|
| Physical | Dishes, driving | No — software can't touch it |
| Knowledge | "What should I say?" | **Already solved** — this is why it's crowded |
| **Initiation & persistence** | "Someone has to send this, and send it again" | **Unclaimed** |

The third bucket is the residue. It's un-automated not because it's hard, but because it requires nerve, access, and being the person who asks again.

### 1.2 The second half of the problem

Asking once is not the task.

Institutions are built on the reliable assumption that you will not follow up. The first message is ignored **by design** — it's a filter. Winning requires a second, and often a third: firmer, better-armed, sent on the right day.

Almost nobody sustains that. It isn't a knowledge problem or even a drafting problem. It's an **endurance** problem — and endurance is exactly what software should be carrying.

---

## 2. Insight

> People don't fail at tasks. They fail at **starting** them, and then they fail at **continuing** them.

Every tool built so far assists the middle — the part that was never broken.

---

## 3. Solution

You name what you've been avoiding, in whatever messy words you have:

```
cancel gym, refund for the broken headphones,
chase landlord about deposit, reschedule dentist
```

Overdue turns each one into a **ready-to-send artifact** — a drafted email, a call script with the number, a direct link past the cancellation maze — armed with the leverage that actually makes the other side respond.

You review. One tap. Done.

And when nothing comes back, **it escalates on its own** — so persistence stops depending on your willpower.

### 3.1 Core loop

```
Dump  →  Extract  →  Validate  →  Draft  →  Approve  →  Send  →  Wait  →  Escalate
                                              ↑                              │
                                              └──────────────────────────────┘
```

### 3.2 The three differentiators

**A. The escalation ladder.**
Tasks don't fail on the first message — they fail because nobody follows up. Overdue tracks state and moves on its own:

| Stage | Trigger | Tone |
|---|---|---|
| 1 — Opening | Immediate | Polite, clear ask, deadline stated |
| 2 — Firm | Day 5, no reply | Names the delay, restates the ask, cites policy |
| 3 — Formal | Day 12, no reply | Invokes rights, states next step, sets final date |

A chat box structurally cannot do this. It has no memory of what it sent, no clock, and no reason to speak first.

**B. Leverage, not politeness.**
The draft is not generic. It knows the chargeback window, the cooling-off period, the consumer-protection clause, the escalation authority. "Write me an email" is a prompt. "Write the email that *wins*" is a product.

**C. Propose → validate → authorize.**
The model never sends anything. It proposes; deterministic code validates; the user authorizes. This is the standard human-in-the-loop pre-execution approval gate, and it's what makes an agent that acts on your behalf trustworthy rather than terrifying.

---

## 4. Why this wins the track

| Criterion | How Overdue scores |
|---|---|
| **Quality of Idea** | No incumbent. No OS feature. Apple and Google are racing to *understand* your screen; nobody is executing on your behalf. This requires acting *as you*, which a platform cannot do. |
| **Technological Implementation** | Structured extraction → deterministic validation → stateful escalation engine → injection-resistant input handling. Not a chat wrapper. |
| **Potential Impact** | Universal and quantifiable. Every user has this list, and it has a rupee value — unclaimed refunds, zombie subscriptions, withheld deposits. |
| **Design** | The queue *is* the interface. Watching it drain is the product experience. |

### 4.1 Competitive position

| Player | Owns | Stops at |
|---|---|---|
| Apple Visual Intelligence | Understanding screen content | Creating a calendar event |
| Google Pixel Screenshots | Recall and search | Surfacing information |
| ChatGPT / any assistant | Drafting text | The moment you close the tab |
| Task managers | Storing the intention | Reminding you that you failed |
| **Overdue** | **Initiation + persistence** | — |

The gap every one of them leaves open is the same: **nothing follows through.**

---

## 5. Scope

### 5.1 In (v1)

- Freeform dump → multiple structured tasks
- Three artifact types: **email draft**, **call script**, **direct action link**
- Leverage retrieval per task
- Editable review card with field-level provenance
- Approval gate — nothing leaves without a tap
- Persistent task state + escalation ladder (3 stages)
- Clarification prompt when a required field is genuinely missing
- Web app

### 5.2 Out (v1) — deliberately

- Gmail/OAuth integration (use `mailto:` prefill + copy — demos identically, saves a day)
- Authentication and multi-user accounts
- Mobile app
- Auto-send without approval
- Payments, legal filings, anything irreversible
- Any integration that isn't on the critical path to the demo

### 5.3 Cut order under time pressure

Cut in this sequence, worst-case first:
1. Third artifact type (action link)
2. Clarification loop
3. Second artifact type (call script)

**Never cut:** the escalation ladder or the approval gate. They are the differentiators.

---

## 6. Architecture

```
    User dump (freeform text)
              │
              ▼
    ┌─────────────────────┐
    │  GPT-5.6 extraction │  strict Structured Outputs
    │  → TaskCandidate[]  │  input treated as untrusted data
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Deterministic       │  required fields · date resolution
    │ validation layer    │  dedupe · confidence gating
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Artifact generation │  email / script / link
    │ + leverage lookup   │  tone = f(escalation_stage)
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Review card        │  editable · shows what was inferred
    └─────────────────────┘
              │  user authorizes
              ▼
    ┌─────────────────────┐
    │  State machine      │  drafted → sent → awaiting → escalate
    │  + escalation clock │
    └─────────────────────┘
```

**Design rule:** the model proposes; it never executes. All state transitions and all sends run through deterministic code with a user tap in front of them.

### 6.1 Task schema

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
      "claim": "Defective goods — replacement or refund obligation",
      "basis": "Consumer Protection Act 2019",
      "confidence": 0.81
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

Every field carries provenance — `extracted`, `inferred`, or `default`. Inferred data is never displayed as observed fact. This is the single cheapest trust mechanism available and it reads extremely well to judges.

### 6.2 State machine

```
  drafted ──approve──▶ sent ──▶ awaiting_reply
                                    │
                        ┌───────────┼───────────┐
                        │           │           │
                   reply rcvd   timeout     user closes
                        │           │           │
                        ▼           ▼           ▼
                     resolved   escalate     archived
                                    │
                                    └──▶ drafted (stage + 1)
```

---

## 7. Safety model

| Risk | Mitigation |
|---|---|
| Model drafts something wrong or damaging | Nothing sends without explicit approval. Every draft is editable. |
| Prompt injection via pasted email or web content | All third-party content is untrusted data, never instruction. Fixed action set. No arbitrary tool calls. |
| Hallucinated legal leverage | Leverage carries a source and confidence; low-confidence claims are shown as "worth checking," not asserted. Never framed as legal advice. |
| Irreversible action | v1 supports no destructive, financial, or legal-filing actions. |
| Sensitive data in user input | No unnecessary persistence; nothing sensitive written to logs. |
| Duplicate sends | Idempotency key per task-stage; approve button disabled during execution. |

---

## 8. Build plan

Four working days: Sat 18 → Tue 21 Jul.

| Day | Goal | Done when |
|---|---|---|
| **Sat** | Spine | Dump → schema → one email draft, working end to end |
| **Sun** | Differentiator | Persistent queue with real state; 3-stage escalation ladder; call script |
| **Mon** | Depth + polish | Action links; leverage layer; confidence/clarification; the empty→full transition looks good |
| **Tue** | Ship | Seed demo data, record video, write README, submit with hours to spare |

### 8.1 Build workflow — Claude Code as brain, Codex as hands

| Layer | Tool | Responsibility |
|---|---|---|
| **Brain** | Claude Code | Architecture, schema design, state-machine logic, prompt design, scope discipline, review |
| **Hands** | Codex | Implementation, scaffolding, UI, wiring, refactors, test generation |

Claude Code decides *what* is built and *why*; Codex builds it. Specs and schemas are written once, then handed down as precise instructions rather than vague asks.

> ⚠️ **Compliance requirement — read this carefully.**
> Build Week judges on *"How thoroughly and skillfully does the project use Codex?"*, and the submission requires a `/feedback` **Codex session ID from the thread where the majority of core functionality was built.**
>
> This means the **majority of actual code generation must run through Codex, in a single sustained session.** Claude Code is legitimate for planning, architecture, and review — but if the code is written elsewhere, the submission is weak at best and non-compliant at worst.
>
> **Action: start the Codex session now, keep it open for the whole build, and route implementation through it.**

---

## 9. Demo — 3 minutes, built backwards from the wow

| Time | Beat |
|---|---|
| 0:00–0:20 | The problem, stated as a list. Everyone recognises their own. |
| **0:20–0:50** | **Wow #1.** Type five dreaded things in twenty seconds. Cut to five finished, ready-to-send artifacts. |
| 0:50–1:20 | Open one. Show the leverage — the specific clause that makes it land. Edit a field. Approve. |
| **1:20–1:50** | **Wow #2.** Fast-forward five days. No reply. The firmer draft has appeared on its own, citing the regulation. *This is the moment it stops looking like a prompt.* |
| 1:50–2:20 | The queue draining. State, history, what's still awaiting. |
| 2:20–2:50 | Safety model in one line: model proposes, code validates, user authorizes. |
| 2:50–3:00 | How Codex and GPT-5.6 were used. Close. |

**Both differentiators — persistent state and unprompted escalation — must be on screen before 1:50.** That is what separates this from a chat box in a judge's mind.

---

## 10. Risk register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | "Isn't this just ChatGPT with extra steps?" | **High** | Show state + unprompted escalation early in the video. Both are structurally impossible in a chat box. |
| 2 | Escalation can't be demoed live in real time | High | Time-travel control in the demo build; seeded task at stage 2. Do not fake the logic — fake only the clock. |
| 3 | Scope creep into integrations | High | `mailto:` + copy. No OAuth. Cut order in §5.3 is binding. |
| 4 | Wrong or hallucinated leverage | Medium | Confidence + source on every claim; hedged display; never framed as legal advice. |
| 5 | Codex session fragmentation → weak `/feedback` ID | Medium | One sustained session from Saturday. Do not scatter. |
| 6 | Demo depends on live API latency | Medium | Pre-warmed demo path + recorded backup. At least one live run. |
| 7 | Feels like a vitamin, not a painkiller | Medium | Lead with money left on the table, not with tidiness. |

---

## 11. Open questions

1. **Name.** Overdue is descriptive but slightly negative. Alternatives: Unstick, First Move, Nudge, Follow.
2. **Escalation timing** — are 5 and 12 days right, or should they be per-intent (refunds move faster than deposits)?
3. **Leverage sourcing** — model knowledge alone for v1, or a small curated rules file for the top five intents? The curated version is more accurate and more defensible to judges.
4. **Does the demo dump use real personal tasks?** More authentic, but check what's on screen before recording.

---

## 12. One-line summary for the submission form

> Overdue turns the things you've been avoiding into the first move that gets them done — and follows up on its own when nobody replies.
