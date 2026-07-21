# Devpost submission copy

Paste the story below into "About the project". Tags and links follow at the end.

---

## Inspiration

I had a pair of headphones die inside the warranty window. I knew the shop had to replace them. I knew roughly what to write. I still did nothing for four months, and by then it did not matter.

That kept bothering me, because the blocker was not knowledge. Ask any model what to write and it hands you a decent email in seconds. The blocker was that somebody has to go first, and then somebody has to go again when the first message is ignored, which it usually is on purpose. Companies are not bad at answering. They are good at waiting you out.

So I looked at my own list. Deposit a landlord never returned. A gym charging me every month for a year after I stopped going. An invoice from a project that finished in March. None of it hard. All of it undone.

The gap I wanted to close is not writing. It is initiation and persistence.

## What it does

You dump whatever you have been avoiding, in whatever words you have:

```
cancel gym, refund for the broken headphones,
chase landlord about deposit, invoice from the March project,
reschedule dentist
```

Overdue pulls each one apart, works out who it goes to and what you actually want, and drafts the thing that moves it. An email, a call script, or a direct action link.

The drafts are not just polite. Each one carries the leverage that makes the other side respond: the chargeback window, the cooling-off period, the defective-goods obligation under the Consumer Protection Act. Every claim shows where it came from and how confident it is, so you can check it rather than trust it. Nothing is dressed up as legal advice.

Then the part I care about most. When a message gets no reply, Overdue rewrites it firmer and moves it up a three stage ladder on its own. Polite, then firm naming the delay, then formal with a final date. Persistence stops depending on whether you feel like it that week.

Every field the model guessed is labelled as a guess. You see what was extracted from your words, what was inferred, and what was defaulted.

## How I built it

The whole thing runs on one rule:

> The model proposes, deterministic code validates, and the user authorizes.

The model never sends anything and never moves a task between states. It writes prose and proposes structure. Everything with consequences is plain TypeScript with a tap in front of it.

The pipeline:

```
dump -> extract (GPT-5) -> validate (pure code) -> draft + leverage (GPT-5)
     -> review -> approve -> wait -> escalate
```

Two stateless server routes hold the API key and call GPT-5. Extraction runs with strict Structured Outputs against a Zod schema. Everything else lives in the browser, with task state in localStorage. No database, no accounts, nothing sensitive stored anywhere.

Three modules carry the logic that matters, and all three are pure with the clock injected:

- **validate** gates out low-confidence guesses at \\(c \geq 0.35\\), resolves relative dates, dedupes, and stamps provenance on every field.
- **leverage** is a curated rules table keyed by intent. Curated claims are copied into the draft verbatim so the model cannot reword a legal basis. Uncovered intents fall back to the model, prefixed "Worth checking" with clamped confidence.
- **escalation** is the state machine. Scheduling is just

$$t_{\text{next}} = t_{\text{sent}} + \Delta(s), \qquad \Delta(1) = 5 \text{ days}, \quad \Delta(2) = 12 \text{ days}$$

with stage 3 terminal.

Stack is Next.js App Router, TypeScript strict, Tailwind, Zustand, Zod, Vitest, deployed on Vercel.

On the build itself, Codex was the implementation agent across one sustained session and wrote effectively all the code. I ran it as a two-role setup: I owned the spec, the module contracts, the review and version control, and Codex implemented one scoped task at a time, test first on the pure modules. It scaffolded the app, built the schema, the validation layer, the leverage rules and the escalation engine, then the two route handlers with an injection-resistant prompt, then the whole interface.

That split turned out to matter more than I expected. Handing over a written contract per task, rather than a vague ask, is what kept the output reviewable.

## Challenges I ran into

**A 401 that was not a 401.** The app kept failing auth against a key I could see was correct. The env var was named `OPENAI_API_KEY`, and I had a stale machine-level `OPENAI_API_KEY` set from months earlier. Real process env beats dotenv in Next, so my file was being silently shadowed. Renaming to `MODEL_API_KEY` and `MODEL_BASE_URL` fixed it in one line and cost me an hour first. Both names are now deliberate, with a note explaining why, so nobody tidies them back.

**Empty responses from a working model.** Early calls returned valid responses with empty content. GPT-5 is a reasoning model, and reasoning tokens come out of the same budget first, so a modest `max_completion_tokens` gets spent thinking and leaves nothing to say. Raising it to 3000 with `reasoning_effort: "low"` fixed it. It also rejects `temperature` outright, which took another read of the error to notice.

**Ten requests a minute.** Free access runs through GitHub Models, roughly 10 requests per minute and 50 per day. That is a hard ceiling on a demo. Rather than fight it, I made it a design constraint: the seed demo is fully pre-baked, and the scripted dump resolves offline from that seed data. The app is worth using with no key at all, and a judge's first run cannot be broken by my quota.

**Demoing something that takes twelve days.** The escalation ladder is the whole point and it unfolds over weeks. So the engine reads now from a single function, \\(\text{now}() = \text{realNow} + \text{offset}\\), and a control in the header moves the offset. Advancing it fires the real tick and a real regeneration at the higher stage. The clock is fake. Nothing else is.

**Hydration.** Task state persists to localStorage and rehydrates after first paint, so the server markup and the client markup disagreed. I patched it with a mounted flag set in an effect, which worked but is exactly what React now warns about. Late on I replaced it with `useSyncExternalStore` reporting false for the server snapshot and true for the client. Same behaviour, one less render, lint clean.

**Deciding what not to build.** Real send integration, accounts, an inbox watcher and a server cron were all tempting. Cutting them was right. A narrow thing that works beats a broad thing that stutters in a demo.

## What I learned

Reasoning models need a different mental model than chat models. Token budget is not output budget, and a cap that feels generous can leave you with nothing.

Provenance is the cheapest trust mechanism I have ever added. Labelling every field as extracted, inferred, or defaulted took very little code and changed how the product feels completely. You stop having to trust it, because you can see exactly what it made up.

Constraining the model is more useful than prompting it harder. Copying curated leverage in verbatim, server side, means no prompt can talk it into rewording a legal basis. Structured Outputs plus schema validation does more for reliability than any amount of instruction.

On working with Codex: it goes as far as your spec does. Vague tasks came back plausible and wrong. Tasks with a stated interface, a named file and a test to satisfy came back nearly right the first time. Most of my value was in writing the contract, not reading the diff.

And a rate limit can be a design brief. Being forced to make the demo path work offline produced an app that a stranger can open and understand with no key, which is strictly better than what I would have shipped with unlimited quota.

## What's next for Overdue

- **A server cron for escalation.** Right now the engine ticks while the app is open. Moving it server side makes "it chases while your laptop is closed" literally true. The schema and the engine do not change.
- **Real send and reply detection.** Gmail OAuth so it sends properly and resolves a task by itself when a reply lands.
- **Wider leverage coverage.** The rules table is the brain. More intents, more jurisdictions, with cited and versioned sources.
- **Outcome tracking.** Learn which phrasings and which timings actually get people to pay, then tune the ladder on evidence instead of my guess of 5 and 12 days.

---

## Built with

Enter these in order. Devpost shows them in the order you add them, and the first four are the ones that answer the "did it use the required models" gate without a judge having to read anything.

```
openai
gpt-5
codex
github-models
next.js
react
typescript
tailwindcss
vercel
zustand
zod
vitest
shadcn-ui
node.js
javascript
html
css
ai
llm
structured-outputs
localstorage
eslint
turbopack
```

23 of the 25 allowed. If autocomplete does not offer `gpt-5`, `github-models`, `structured-outputs` or `shadcn-ui`, add them as new tags rather than dropping them. The last four in the list are the ones to cut if you want it tighter.

## Try it out

- Live app: https://overdue-nine.vercel.app
- Source: https://github.com/kartikshirode/Overdue
