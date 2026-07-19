import { expect, test } from "vitest";

import { ArtifactSchema, isSafeActionUrl } from "../lib/schema";

const baseArtifact = {
  task_id: "tsk_01",
  stage: 1,
  artifact_type: "action_link" as const,
  subject: null,
  body: "Open the draft and ask for payment.",
  action_url: "https://example.com/pay",
  leverage_used: [],
};

test("accepts https and mailto links", () => {
  expect(isSafeActionUrl("https://example.com/pay")).toBe(true);
  expect(isSafeActionUrl("mailto:billing@example.com?subject=Invoice")).toBe(true);
});

test("rejects dangerous and unsupported schemes", () => {
  expect(isSafeActionUrl("javascript:alert(1)")).toBe(false);
  expect(isSafeActionUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  expect(isSafeActionUrl("http://example.com")).toBe(false);
  expect(isSafeActionUrl("not a url at all")).toBe(false);
  expect(isSafeActionUrl(`https://example.com/${"a".repeat(3000)}`)).toBe(false);
});

test("the artifact schema rejects an unsafe action_url", () => {
  expect(ArtifactSchema.parse(baseArtifact).action_url).toBe(
    "https://example.com/pay",
  );
  expect(() =>
    ArtifactSchema.parse({ ...baseArtifact, action_url: "javascript:alert(1)" }),
  ).toThrow();
  expect(ArtifactSchema.parse({ ...baseArtifact, action_url: null }).action_url).toBe(
    null,
  );
});
