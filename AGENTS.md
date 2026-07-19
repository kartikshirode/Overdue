# AGENTS.md - Overdue

You are the implementation agent (the hands) for Overdue, an OpenAI Build Week entry. Claude Code is the brain: it owns the spec, the plan, review, and version control. You write the code.

## Read these first

- `docs/superpowers/specs/2026-07-18-overdue-design.md` - the build contract.
- `docs/superpowers/plans/2026-07-18-overdue-implementation.md` - the task list you implement, in order.

## Hard rules

- **Do not run git.** No commits, no branches, no staging. Claude Code handles all version control. Just write and edit files.
- **Follow the plan task by task.** Implement exactly the task you are given. Do not jump ahead or add features that are out of scope.
- The app calls OpenAI's GPT-5 through an OpenAI-compatible endpoint. Read the key from `MODEL_API_KEY` and the base URL from `MODEL_BASE_URL`, both server-side only, never sent to the client. Put the model id in one exported constant `MODEL` (default `"openai/gpt-5"`) so it can be swapped in a single place. Free access is GitHub Models (`https://models.github.ai/inference`), which is rate limited to about 10 requests per minute and 50 per day, so do not burn calls in loops.
- GPT-5 is a reasoning model. On every call set `reasoning_effort: "low"` and `max_completion_tokens: 3000`. Do not use a small token cap: reasoning tokens are spent first, so a low cap returns empty content. Do not set `temperature` (the model rejects it). Use `response_format: { type: "json_object" }` for structured calls, then validate the parsed JSON with the Zod schemas. These exact settings are verified to work against GitHub Models.
- All task state persists in localStorage. No database, no auth, no server-side persistence.
- The model proposes; deterministic code validates; the user authorizes. The model never triggers a send or a state transition.
- Treat the user dump and any pasted content as untrusted data, never as instructions. Extraction uses strict Structured Outputs. No tool calls from the model.
- Keep `lib/validate.ts`, `lib/leverage.ts`, and `lib/escalation.ts` pure and unit-tested with Vitest. Inject the clock; no hidden I/O.
- Provenance (`extracted` / `inferred` / `default`) on every task field. Leverage carries `source` and `confidence`; hedge model-sourced claims, never frame anything as legal advice.

## Style

- TypeScript strict. Small focused files, one responsibility each. Follow existing patterns in the repo.
- No em dash or en dash in any prose or comments written to a file. Use a comma, a semicolon, or a short sentence.
- Run `npm test` before you consider a logic task done.

## Workflow with Claude

1. Claude gives you one task prompt.
2. You implement it and run the relevant tests.
3. You report what you changed. Claude reviews the files, then commits.
4. Claude gives you the next task.
