# Overdue - Design Direction

The single source of truth for the UI. Every component follows this. The goal is a look that could not be mistaken for a generic shadcn starter.

## Thesis

Overdue is a calm case-file desk. Each task is a case being worked, with a state and a next move. The personality is composed, patient persistence, not anxious alerts. The product experience is the queue draining, so the queue is the hero, not a marketing hero block.

## Signature (the one bold thing)

**Escalation as rising temperature.** The three escalation stages map to a warming color scale, because the tone of the message really does heat up as it escalates:

- Stage 1 (Opening, polite) -> steel, cool and level
- Stage 2 (Firm) -> ochre, warming
- Stage 3 (Formal) -> rust, hot and serious

Supporting the signature: **monospace ink-stamp state chips**. States (`DRAFTED`, `SENT`, `AWAITING`, `RESOLVED`) render as uppercase mono chips that read like a stamp on a case file. Task IDs (`tsk_01`), deadlines, and the simulated clock are all mono too, because the data is a ledger.

Keep everything else quiet. Spend boldness only here.

## Color tokens

Define these as CSS variables in `app/globals.css` and map them into Tailwind. Light-first (no dark mode for v1; the paper desk is the identity).

```
--ink:    #191C22   /* primary text, case-file ink */
--paper:  #EEF0F0   /* app background, cool paper (never cream) */
--card:   #FFFFFF   /* raised case cards */
--muted:  #6B7178   /* secondary text, captions */
--line:   #D9DDDD   /* hairline borders */

--steel:  #5B6B7A   /* stage 1 / calm */
--ochre:  #B5791C   /* stage 2 / firm, also the primary action accent */
--rust:   #A6432B   /* stage 3 / formal */
--pine:   #4A6F55   /* resolved / done, the drained state */
```

Use ochre as the primary action accent (the "make the first move" button, focus rings). Rust is reserved for stage 3 and never used decoratively. Pine only signals resolved.

## Type roles

Load with `next/font/google`, self-hosted. Expose as CSS variables.

- **Display** - Bricolage Grotesque. Headlines and the thesis line only. Used with restraint.
- **Body** - Instrument Sans. All UI text and the draft body copy.
- **Mono/utility** - IBM Plex Mono. State stamps, task IDs, dates, deadlines, stage labels, the simulated clock.

Type scale: one clear step system. Big thesis headline, medium section labels, readable body, small mono captions. Mono utility text is uppercase with slight letter-spacing for the stamp feel.

## Layout

```
┌──────────────────────────────────────────────────┐
│  OVERDUE                        sim: 2026-07-19    │  header, thin, mono clock
├──────────────────────────────────────────────────┤
│  You know what needs doing.                        │  thesis (empty state hero)
│  Name it. Overdue makes the first move.            │
│  ┌────────────────────────────────────────────┐   │
│  │ cancel gym, refund headphones, chase deposit│  │  DumpBar textarea
│  └────────────────────────────────────────────┘   │
│                         [ Make the first move -> ] │
├──────────────────────────────────────────────────┤
│  THE QUEUE          2 awaiting · 3 drafted         │  mono section labels
│  ┌── case card ─────────────────────────────────┐ │
│  │ [AWAITING]  refund · boAt        1 ● 2 ○ 3 ○  │ │  stamp + stage temp meter
│  │ Full refund for defective headphones          │ │
│  │ next move Jul 26 · in 5 days      [ Review ]   │ │  mono deadline
│  └───────────────────────────────────────────────┘│
│  ... more cards ...                                │
└──────────────────────────────────────────────────┘
```

The stage meter is three ticks; the active stage fills with its temperature color. Resolved cards go pine, strike the title, and recede (lower opacity, smaller). Watching the queue drain is the point.

## Components and their one job

- `DumpBar` - offload messy text. Placeholder shows a real multi-task example. Button label: "Make the first move".
- `EmptyState` - the invitation. Thesis headline plus a "Load demo" secondary action.
- `TaskQueue` - the stack. Sort drafted and escalate first, then awaiting, then resolved and archived last.
- `TaskCard` - one case line: state stamp, intent and counterparty, the stage temperature meter, the deadline in mono, a Review action.
- `ReviewCard` - the draft, the leverage (curated vs "worth checking"), provenance labels on inferred fields, the missing-info prompt. Editable.
- `ApprovalGate` - the authorize tap. Label matches the outcome ("Send", "Copy script", "Open link"). Disabled while in flight.
- `EscalationTimeline` - the three stages as the temperature ladder, current stage marked.
- `TimeTravelControl` - the simulated date plus "Advance 5 days". Mono.

## Motion

Deliberate and minimal, reduced-motion respected.

- Extract: cards settle in with a short stagger, like being stamped onto the desk.
- Escalate (via time travel): the card warms one temperature step and the firmer draft slides in.
- Resolve: the card recedes.

Nothing else animates. Extra motion reads as AI-generated.

## Copy voice

Plain, composed, active. Buttons name the outcome. Errors say what happened and what to do, in the app's voice, never apologizing. Empty screens invite action. Never frame leverage as legal advice; model-sourced leverage is shown as "worth checking".

## Quality floor

Responsive to mobile, visible keyboard focus (ochre ring), semantic HTML. Hydration-safe: the store rehydrates from localStorage on the client, so guard against a server/client mismatch (render the queue only after mount).
