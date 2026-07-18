import { expect, test } from "vitest";
import { approve, tick } from "../lib/escalation";
import type { Task } from "../lib/schema";

const t = (over: Partial<Task> = {}): Task => ({
  id: "tsk_01", raw_input: "x", intent: "refund_request",
  counterparty: { name: "Boat", channel: "email", contact: null, source: "inferred" },
  desired_outcome: "refund", leverage: [], missing_info: [], artifact_type: "email",
  escalation_stage: 1, state: "drafted", next_action_at: null, confidence: 0.9,
  provenance: {}, ...over,
});

test("approve schedules stage-1 escalation in 5 days", () => {
  const out = approve(t(), new Date("2026-07-18T00:00:00Z"));
  expect(out.state).toBe("awaiting_reply");
  expect(out.next_action_at).toBe(new Date("2026-07-23T00:00:00Z").toISOString());
});

test("tick escalates an overdue awaiting task", () => {
  const task = t({ state: "awaiting_reply", next_action_at: "2026-07-20T00:00:00Z" });
  const { tasks, escalated } = tick([task], new Date("2026-07-21T00:00:00Z"));
  expect(tasks[0].escalation_stage).toBe(2);
  expect(tasks[0].state).toBe("drafted");
  expect(escalated).toContain("tsk_01");
});

test("stage 3 never auto-escalates", () => {
  const task = t({ escalation_stage: 3, state: "awaiting_reply", next_action_at: "2026-07-01T00:00:00Z" });
  const { escalated } = tick([task], new Date("2026-07-21T00:00:00Z"));
  expect(escalated.length).toBe(0);
});
