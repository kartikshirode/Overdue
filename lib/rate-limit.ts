// In-memory per-IP limiter shared by both model routes. Single instance only:
// each serverless instance keeps its own counters, which is enough to stop a
// casual curl loop from draining the daily model quota.

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// Tuned against the upstream ceiling, roughly 10 requests per minute and 50 per
// day, not against a guess. The limiter has to sit just under the provider so it
// sheds abuse without throttling an honest demo: one extract plus five card
// opens is six calls in a burst, so a per-minute cap of 5 would have cut off the
// judge mid-run. The daily cap is the one that actually protects the quota.
export const PER_MINUTE_LIMIT = 8;
export const PER_HOUR_LIMIT = 40;
export const PER_DAY_LIMIT = 45;

const MAX_TRACKED_KEYS = 5000;

const hits = new Map<string, number[]>();

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) {
    return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function prune(atMs: number): void {
  for (const [key, times] of hits) {
    const recent = times.filter((time) => atMs - time < DAY_MS);
    if (recent.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, recent);
    }
  }
}

// Returns true when the request is allowed, and records it. Returns false when
// either window is already full.
export function allowRequest(key: string, atMs: number = Date.now()): boolean {
  if (hits.size > MAX_TRACKED_KEYS) {
    prune(atMs);
  }

  const times = hits.get(key) ?? [];
  const withinDay = times.filter((time) => atMs - time < DAY_MS);
  const withinHour = withinDay.filter((time) => atMs - time < HOUR_MS);
  const withinMinute = withinHour.filter((time) => atMs - time < MINUTE_MS);

  if (
    withinMinute.length >= PER_MINUTE_LIMIT ||
    withinHour.length >= PER_HOUR_LIMIT ||
    withinDay.length >= PER_DAY_LIMIT
  ) {
    hits.set(key, withinDay);
    return false;
  }

  withinDay.push(atMs);
  hits.set(key, withinDay);
  return true;
}

// Test-only escape hatch; the routes never call this.
export function resetRateLimit(): void {
  hits.clear();
}
