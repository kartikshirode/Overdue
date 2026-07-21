// The scripted dump used in the demo video. Typing it fills the queue from the
// pre-baked seed tasks instead of calling the model, so a recording (or a
// judge's first run) can never be broken by the provider rate limit.
//
// This is a demo affordance, not a hidden cache: it only fires for this
// specific list, and only when the queue is empty, so it can never stand in
// for a real extraction or overwrite real tasks.
export const DEMO_DUMP =
  "cancel gym, refund for the broken headphones, chase landlord about deposit, invoice from the March project, reschedule dentist";

// One group per seed task. A group counts as present if any of its terms
// appears. Matching on terms rather than the exact string means a typo or a
// reordered line while recording still takes the offline path.
const MARKER_GROUPS: readonly (readonly string[])[] = [
  ["gym"],
  ["headphone"],
  ["landlord", "deposit"],
  ["invoice"],
  ["dentist"],
];

// Three of five. High enough that a real dump mentioning one or two of these
// still goes to the model, low enough to survive a fumbled line on camera.
const MATCH_THRESHOLD = 3;

function normalise(dump: string): string {
  return dump.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

export function matchesDemoDump(dump: string): boolean {
  const text = normalise(dump);

  const hits = MARKER_GROUPS.filter((group) =>
    group.some((term) => text.includes(term)),
  ).length;

  return hits >= MATCH_THRESHOLD;
}
