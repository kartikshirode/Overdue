import { expect, test } from "vitest";

import { TaskCandidateSchema } from "../lib/schema";

const validCandidate = {
  raw_input: "refund for broken headphones",
  intent: "refund_request",
  counterparty: {
    name: "Boat Lifestyle",
    channel: "email",
    contact: null,
    source: "extracted",
  },
  desired_outcome: "Full refund for defective product",
  missing_info: ["order_id", "purchase_date"],
  artifact_type: "email",
  confidence: 0.88,
};

test("accepts a valid task candidate", () => {
  expect(TaskCandidateSchema.parse(validCandidate)).toEqual(validCandidate);
});

test("rejects an invalid intent", () => {
  expect(() =>
    TaskCandidateSchema.parse({
      ...validCandidate,
      intent: "invalid_intent",
    }),
  ).toThrow();
});
