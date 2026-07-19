import { beforeEach, expect, test } from "vitest";

import {
  PER_DAY_LIMIT,
  PER_HOUR_LIMIT,
  PER_MINUTE_LIMIT,
  allowRequest,
  clientKey,
  resetRateLimit,
} from "../lib/rate-limit";

const START = 1_800_000_000_000;

beforeEach(() => {
  resetRateLimit();
});

test("allows up to the per-minute limit then blocks", () => {
  for (let i = 0; i < PER_MINUTE_LIMIT; i += 1) {
    expect(allowRequest("1.2.3.4", START + i)).toBe(true);
  }

  expect(allowRequest("1.2.3.4", START + PER_MINUTE_LIMIT)).toBe(false);
});

test("lets the minute window recover but still holds the hour cap", () => {
  let at = START;

  for (let i = 0; i < PER_HOUR_LIMIT; i += 1) {
    if (i % PER_MINUTE_LIMIT === 0) {
      at += 61_000;
    }
    expect(allowRequest("5.6.7.8", at)).toBe(true);
  }

  expect(allowRequest("5.6.7.8", at + 61_000)).toBe(false);
  expect(allowRequest("5.6.7.8", at + 3_700_000)).toBe(true);
});

// The daily cap is the one that guards the upstream quota, so spacing requests
// out far enough to clear the minute and hour windows must not get past it.
test("holds the day cap even when every shorter window has drained", () => {
  let at = START;

  // 30 minutes apart: only two land in any hour, well under the hour cap, and
  // all 45 still fit inside a single day.
  for (let i = 0; i < PER_DAY_LIMIT; i += 1) {
    expect(allowRequest("4.4.4.4", at)).toBe(true);
    at += 1_800_000;
  }

  expect(allowRequest("4.4.4.4", at)).toBe(false);
});

test("keys are per client", () => {
  for (let i = 0; i < PER_MINUTE_LIMIT; i += 1) {
    allowRequest("1.1.1.1", START + i);
  }

  expect(allowRequest("1.1.1.1", START)).toBe(false);
  expect(allowRequest("2.2.2.2", START)).toBe(true);
});

// Built by hand rather than with new Request, which jsdom does not provide.
function requestWithHeaders(headers: Record<string, string>): Request {
  return {
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Request;
}

test("reads the first forwarded address", () => {
  expect(
    clientKey(requestWithHeaders({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })),
  ).toBe("9.9.9.9");

  expect(clientKey(requestWithHeaders({}))).toBe("unknown");
});
