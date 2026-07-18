# OpenAI Build Week - Context & Submission Playbook

Research notes for our entry. Track: **Apps for Your Life**. Everything here is pulled from the official Devpost rules and OpenAI's event pages.

## The one-line summary

Global week-long hackathon run by OpenAI on Devpost. You ship a real project built with **GPT-5.6** and **Codex**, both used in a meaningful way. $100K total prize pool across four tracks.

## Timeline (this is tight)

Today is **2026-07-18**. The hard deadline is **2026-07-21, 5:00 PM PT**. That leaves roughly 3 days.

| Event | When (PT) |
|---|---|
| Registration window | Jul 9 (10:00 AM) - Jul 21 (5:00 PM) |
| Submission window | Jul 13 (9:00 AM) - Jul 21 (5:00 PM) |
| Free Codex credits request deadline | Jul 17 (12:00 PM) - already passed, check if we have credits |
| Free credits usage deadline | Jul 21 (5:00 PM) |
| Judging | Jul 22 - Aug 5 |
| Winners announced | ~Aug 12 (2:00 PM) |

Action: confirm we are registered on openai.devpost.com and check credit status. The credit request deadline (Jul 17) has passed, so if we didn't grab them we use our own API access.

## The track: Apps for Your Life

Official description: "Consumer apps for everyday life - from productivity and creativity to home, family, travel, health, and personal finance."

The other three tracks (for reference, we are NOT in these): Work and Productivity, Developer Tools, Education.

## Prizes per track

- **1st:** $15,000 + up to 2 DevDay/Exchange passes + OpenAI Developer promotion + a meeting with the Codex team + 1-year Pro account
- **2nd:** $10,000 + OpenAI Developer promotion + 1-year Pro account

So $25K available in our track across two spots.

## Judging criteria (all four weighted equally)

There is a Stage One pass/fail gate first: does the project fit the theme and actually use the required APIs/SDKs. Then Stage Two scores on:

1. **Technological Implementation** - How thoroughly and skillfully does the project use Codex? Does the code show real effort and a working, non-trivial build?
2. **Design** - Is it a complete, coherent product experience, not just a proof of concept?
3. **Potential Impact** - Does it make a credible, specific case for solving a real problem for a real audience?
4. **Quality of the Idea** - How creative and novel is it, and how does it differ from what already exists?

Read that as: a polished, genuinely useful app that solves one real problem well, with Codex clearly doing heavy lifting in the build. Novelty matters, but so does "does the demo actually work."

## What we have to submit (checklist)

- [ ] Functioning project built with Codex and GPT-5.6
- [ ] Text description of features and functionality
- [ ] Demo video, **under 3 minutes**, with audio, showing what we built and how we used Codex + GPT-5.6. Must be public on YouTube. No third-party trademarks or copyrighted music.
- [ ] URL to the code repo (public or private access for judges)
- [ ] A working link: live site, functioning demo, or test build. Judges must be able to try it without rebuilding from scratch.
- [ ] README that describes how Codex was used across the project
- [ ] **Codex Session ID** from the project thread
- [ ] If it is a plugin or dev tool: install instructions, supported platforms, how to test

## Non-obvious requirements worth flagging

- **Both models are mandatory.** GPT-5.6 (in the app itself) and Codex (in how we built it). The README and the video both need to show the Codex collaboration. Keep Codex session logs.
- **Newly created or meaningfully extended.** If any part predates the submission window we need dated commit history or timestamped Codex logs proving the new work.
- **The Codex story is a scored criterion, not a formality.** One full quarter of the score is literally "how well did you use Codex." We should build with Codex in a way we can show and narrate.
- The working demo link matters. A judge who can't run it falls back to the video, so the video has to be strong.

## Eligibility notes

Open to individuals of age of majority in OpenAI-API-supported countries, and teams of such people. Blocked jurisdictions include Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, Syria. India is fine.

## How this shapes our build

Given 3 days and equal weighting on Idea / Design / Impact / Tech:

- Pick ONE sharp everyday problem, not a Swiss-army app. Narrow and finished beats broad and half-working.
- GPT-5.6 should be core to the value, not a bolt-on chatbot. The "aha" should come from the model doing something a normal app can't.
- Budget real time for polish and the demo video. A clean 3-minute demo can outscore a more ambitious app that stutters on stage.
- Keep a running note of how Codex helped (scaffolding, refactors, tests) so the README and video write themselves.

## Sources

- Official rules: https://openai.devpost.com/rules
- Devpost hub: https://openai.devpost.com/
- OpenAI event page: https://openai.com/build-week/
