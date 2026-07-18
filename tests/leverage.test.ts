import { expect, test } from "vitest";
import { lookupLeverage } from "../lib/leverage";

test("curated hit for a top intent", () => {
  const r = lookupLeverage("refund_request");
  expect(r.items.length).toBeGreaterThan(0);
  expect(r.items[0].source).toBe("curated");
  expect(r.needsModelFallback).toBe(false);
});

test("fallback for unknown intent", () => {
  const r = lookupLeverage("other");
  expect(r.items.length).toBe(0);
  expect(r.needsModelFallback).toBe(true);
});
