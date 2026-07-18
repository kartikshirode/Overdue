import type { Provenance, Task, TaskCandidate } from "./schema";

const MIN_CONFIDENCE = 0.35;

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

type RelativeUnit = "day" | "week" | "month" | "year";

function addRelativeTime(date: Date, amount: number, unit: RelativeUnit): Date {
  const resolved = new Date(date.getTime());

  if (unit === "day") {
    resolved.setUTCDate(resolved.getUTCDate() + amount);
  } else if (unit === "week") {
    resolved.setUTCDate(resolved.getUTCDate() + amount * 7);
  } else if (unit === "month") {
    resolved.setUTCMonth(resolved.getUTCMonth() + amount);
  } else {
    resolved.setUTCFullYear(resolved.getUTCFullYear() + amount);
  }

  return resolved;
}

function parseAmount(value: string): number | null {
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? (NUMBER_WORDS[value] ?? null) : numeric;
}

function resolveRelativeDate(text: string, now: Date): string | null {
  const normalized = text.toLowerCase();

  if (/\bday after tomorrow\b/.test(normalized)) {
    return addRelativeTime(now, 2, "day").toISOString();
  }

  if (/\btomorrow\b/.test(normalized)) {
    return addRelativeTime(now, 1, "day").toISOString();
  }

  if (/\byesterday\b/.test(normalized)) {
    return addRelativeTime(now, -1, "day").toISOString();
  }

  if (/\b(today|tonight)\b/.test(normalized)) {
    return new Date(now.getTime()).toISOString();
  }

  const amountMatch = normalized.match(
    /\b(?:in|within|after)\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(day|week|month|year)s?\b/,
  );
  if (amountMatch) {
    const amount = parseAmount(amountMatch[1]);
    if (amount !== null) {
      return addRelativeTime(now, amount, amountMatch[2] as RelativeUnit).toISOString();
    }
  }

  const fromNowMatch = normalized.match(
    /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(day|week|month|year)s?\s+(?:from (?:now|today)|later)\b/,
  );
  if (fromNowMatch) {
    const amount = parseAmount(fromNowMatch[1]);
    if (amount !== null) {
      return addRelativeTime(now, amount, fromNowMatch[2] as RelativeUnit).toISOString();
    }
  }

  const agoMatch = normalized.match(
    /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(day|week|month|year)s?\s+ago\b/,
  );
  if (agoMatch) {
    const amount = parseAmount(agoMatch[1]);
    if (amount !== null) {
      return addRelativeTime(now, -amount, agoMatch[2] as RelativeUnit).toISOString();
    }
  }

  const namedPeriodMatch = normalized.match(/\b(next|last)\s+(day|week|month|year)\b/);
  if (namedPeriodMatch) {
    const amount = namedPeriodMatch[1] === "next" ? 1 : -1;
    return addRelativeTime(now, amount, namedPeriodMatch[2] as RelativeUnit).toISOString();
  }

  const weekdayMatch = normalized.match(
    /\b(next|this|by|on|before)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (weekdayMatch) {
    const targetDay = WEEKDAYS[weekdayMatch[2]];
    let daysAhead = (targetDay - now.getUTCDay() + 7) % 7;
    if (weekdayMatch[1] === "next" && daysAhead === 0) {
      daysAhead = 7;
    }
    return addRelativeTime(now, daysAhead, "day").toISOString();
  }

  return null;
}

function normalizeCounterparty(name: string | null): string {
  return (name ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function fieldProvenance(
  value: string | null,
  source: Provenance,
): Provenance {
  return value === null || value.trim() === "" ? "default" : source;
}

function buildProvenance(
  candidate: TaskCandidate,
  nextActionAt: string | null,
): Record<string, Provenance> {
  return {
    id: "default",
    raw_input: candidate.raw_input.trim() === "" ? "default" : "extracted",
    intent: "inferred",
    "counterparty.name": fieldProvenance(
      candidate.counterparty.name,
      candidate.counterparty.source,
    ),
    "counterparty.channel": candidate.counterparty.channel
      ? candidate.counterparty.source
      : "default",
    "counterparty.contact": fieldProvenance(
      candidate.counterparty.contact,
      candidate.counterparty.source,
    ),
    "counterparty.source": "inferred",
    desired_outcome:
      candidate.desired_outcome.trim() === "" ? "default" : "inferred",
    leverage: "default",
    missing_info: candidate.missing_info.length > 0 ? "inferred" : "default",
    artifact_type: "inferred",
    escalation_stage: "default",
    state: "default",
    next_action_at: nextActionAt ? "inferred" : "default",
    confidence: "inferred",
  };
}

export function validateCandidates(
  candidates: TaskCandidate[],
  now: Date,
): Task[] {
  const seen = new Set<string>();
  const accepted: TaskCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.confidence < MIN_CONFIDENCE) {
      continue;
    }

    const dedupeKey = `${candidate.intent}:${normalizeCounterparty(candidate.counterparty.name)}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    accepted.push(candidate);
  }

  return accepted.map((candidate, index) => {
    const nextActionAt = resolveRelativeDate(
      `${candidate.raw_input} ${candidate.desired_outcome}`,
      now,
    );

    return {
      ...candidate,
      id: `tsk_${String(index + 1).padStart(2, "0")}`,
      leverage: [],
      escalation_stage: 1,
      state: "drafted",
      next_action_at: nextActionAt,
      provenance: buildProvenance(candidate, nextActionAt),
    };
  });
}
