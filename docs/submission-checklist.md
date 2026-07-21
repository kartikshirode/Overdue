# Overdue - Devpost submission checklist

Deadline: Tue 21 Jul 2026, 5:00 PM PT. Submit with hours to spare.

## Required fields

- [x] **Project name:** Overdue
- [x] **One-line summary:** Overdue turns the things you have been avoiding into the first move that gets them done, and follows up on its own when nobody replies.
- [x] **Text description:** see the block below.
- [ ] **Demo video:** under 3 minutes, public on YouTube, with audio, covering what it does and how Codex and GPT-5 were used. No third-party trademarks or copyrighted music. Script is in `docs/video-script.md`. **Still to record and upload.**
- [x] **Repo URL:** https://github.com/kartikshirode/Overdue
- [x] **Live URL for judges:** https://overdue-nine.vercel.app
- [x] **README with Codex collaboration notes:** done (README.md).
- [x] **Codex Session ID:** `019f78ee-43b9-70c3-9429-98d1520a810f` (in README.md; paste into the Devpost form too).
- [x] **Track:** Apps for your life.

## Repo state

Verified green on the submission build:

- `npm run lint` clean, `npm test` 31 passing, `npm run build` succeeds, `npx tsc --noEmit` clean.
- No secrets tracked. Only `.env.local.example` is committed and `.env*` is ignored.
- MIT LICENSE added. Default Next.js scaffolding assets removed.
- The scripted demo dump resolves offline, so neither the video nor a judge's first run depends on model quota.

Left to do: record the video, upload it public on YouTube, then fill the Devpost form.

## Text description (paste into Devpost)

Overdue is for the list everyone carries and never finishes: the refund never claimed, the subscription still charging, the deposit never returned. These are not hard tasks. People stall because someone has to start, and because the first message is ignored by design.

Overdue takes a freeform dump of what you have been avoiding and turns each item into a ready-to-send artifact: an email draft, a call script, or a direct link, armed with the leverage that makes the other side respond. You review and tap once. When nothing comes back, it escalates on its own through three stages, from a polite opening to a formal notice.

Two things set it apart from a chat box: persistent state with an escalation ladder that moves without you, and curated leverage that cites the actual rule instead of just being polite. The model proposes, deterministic code validates, and the user authorizes every send, so the agent is trustworthy rather than scary.

Built with Codex as the implementation agent across one sustained session, with GPT-5 handling extraction and drafting.

## Demo video beats (under 3 minutes)

Full shot-by-shot script with the voiceover lines is in `docs/video-script.md`. It rebalances the beats below to give the Codex story more room, since that is a scored criterion.

1. 0:00-0:20 The problem, as a list everyone recognizes.
2. 0:20-0:50 Type five dreaded things, cut to five finished artifacts. (Fresh model quota, or start from Load demo.)
3. 0:50-1:20 Open one. Show the leverage clause. Edit a field. Approve.
4. 1:20-1:50 Advance the clock five days. No reply, so the firmer draft appears on its own, citing the regulation. This is the moment it stops looking like a prompt.
5. 1:50-2:20 The queue draining: states, what is still awaiting, mark one resolved.
6. 2:20-2:50 Safety in one line: model proposes, code validates, user authorizes.
7. 2:50-3:00 How Codex and GPT-5 were used. Close.

Record with a fresh daily model quota, and keep a backup take. Load demo needs no model calls, so most of the video is safe from rate limits.

## Judging criteria, self-check

- **Quality of idea:** no incumbent executes on your behalf; initiation and persistence is the unclaimed bucket.
- **Technological implementation:** structured extraction, deterministic validation, a stateful escalation engine, injection-resistant input, all built through Codex.
- **Potential impact:** universal list with a real money value in unclaimed refunds, zombie subscriptions, withheld deposits.
- **Design:** the queue is the interface, and watching it drain is the experience.
