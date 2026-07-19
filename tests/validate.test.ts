import { expect, test } from "vitest";
import { validateCandidates } from "../lib/validate";

const base = {
  raw_input: "refund headphones", intent: "refund_request" as const,
  counterparty: { name: "Boat", channel: "email" as const, contact: null, source: "inferred" as const },
  desired_outcome: "Full refund", missing_info: [], artifact_type: "email" as const, confidence: 0.9,
};

test("assigns ids and initial state", () => {
  const out = validateCandidates([base], new Date("2026-07-18T00:00:00Z"));
  expect(out[0].id).toBe("tsk_01");
  expect(out[0].state).toBe("drafted");
  expect(out[0].escalation_stage).toBe(1);
});

test("drops low-confidence candidates", () => {
  expect(validateCandidates([{ ...base, confidence: 0.2 }], new Date()).length).toBe(0);
});

test("dedupes by intent + counterparty", () => {
  expect(validateCandidates([base, { ...base }], new Date()).length).toBe(1);
});

test("continues ids past the ones the caller already holds", () => {
  const at = new Date("2026-07-18T00:00:00Z");
  const first = validateCandidates([base], at);
  const second = validateCandidates(
    [{ ...base, counterparty: { ...base.counterparty, name: "Northstar" } }],
    at,
    first.map((task) => task.id),
  );

  expect(second[0].id).toBe("tsk_02");

  const ids = [...first, ...second].map((task) => task.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("skips past a gap rather than reusing a freed id", () => {
  const at = new Date("2026-07-18T00:00:00Z");
  const out = validateCandidates([base], at, ["tsk_01", "tsk_07", "not_a_task"]);
  expect(out[0].id).toBe("tsk_08");
});
