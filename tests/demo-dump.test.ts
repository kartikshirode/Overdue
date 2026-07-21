import { describe, expect, it } from "vitest";

import { DEMO_DUMP, matchesDemoDump } from "../lib/demo-dump";

describe("matchesDemoDump", () => {
  it("matches the scripted demo dump", () => {
    expect(matchesDemoDump(DEMO_DUMP)).toBe(true);
  });

  it("survives casing, punctuation and reordering", () => {
    expect(
      matchesDemoDump(
        "Reschedule dentist. Cancel GYM!! chase landlord about deposit",
      ),
    ).toBe(true);
  });

  it("still matches when one item is fumbled while recording", () => {
    expect(
      matchesDemoDump("cancel gym, broken headphones, chase landlord"),
    ).toBe(true);
  });

  it("does not hijack a real dump that mentions one or two of them", () => {
    expect(matchesDemoDump("cancel gym")).toBe(false);
    expect(matchesDemoDump("refund for the broken headphones and cancel gym")).toBe(
      false,
    );
  });

  it("does not match an unrelated dump", () => {
    expect(
      matchesDemoDump("ask the bank about the failed transfer and chase HR"),
    ).toBe(false);
  });
});
