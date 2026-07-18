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
