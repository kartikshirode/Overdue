import { expect, test } from "vitest";
import { z } from "zod";

import { RequestError, classifyError } from "../lib/api-error";

test("our own validation errors travel back verbatim as 400", () => {
  const result = classifyError(new RequestError("Dump is too long."));
  expect(result.status).toBe(400);
  expect(result.message).toBe("Dump is too long.");
});

test("a Zod error is a 400 but its message never travels", () => {
  let thrown: unknown;
  try {
    z.object({ task: z.string() }).parse({ task: 123 });
  } catch (error) {
    thrown = error;
  }

  const result = classifyError(thrown);
  expect(result.status).toBe(400);
  // The received value (123) must not appear in the client-facing text.
  expect(result.message).not.toContain("123");
  expect(result.message).not.toContain("task");
});

test("a missing config surfaces as 503 with a not-your-fault message", () => {
  const configError = new Error("Missing MODEL_API_KEY.");
  configError.name = "ModelConfigError";

  const result = classifyError(configError);
  expect(result.status).toBe(503);
  expect(result.message).not.toContain("MODEL_API_KEY");
});

test("an upstream 429 is passed through as 429", () => {
  const rateLimited = Object.assign(new Error("Rate limit exceeded for gpt-5"), {
    status: 429,
  });

  const result = classifyError(rateLimited);
  expect(result.status).toBe(429);
  // The upstream text names the model; it must not reach the caller.
  expect(result.message).not.toContain("gpt-5");
});

test("any other upstream failure is a 502 with a fixed message", () => {
  const upstream = Object.assign(new Error("500 Internal Server Error from provider"), {
    status: 500,
  });

  const result = classifyError(upstream);
  expect(result.status).toBe(502);
  expect(result.message).not.toContain("provider");
});
