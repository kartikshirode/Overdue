// Server-side failure logging. Only the error name, message and status are
// written. A Zod message echoes the received values, which for these routes
// would mean the user dump or task fields in the logs, so Zod errors are
// reduced to their issue paths instead.

type ZodLikeIssue = { path?: unknown };

function isZodLike(error: unknown): error is { name: string; issues: ZodLikeIssue[] } {
  return (
    error instanceof Error &&
    error.name === "ZodError" &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

function statusSuffix(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? ` status=${status}` : "";
}

export function logRouteError(route: string, error: unknown): void {
  if (isZodLike(error)) {
    const paths = error.issues
      .map((issue) => (Array.isArray(issue.path) ? issue.path.join(".") : "?"))
      .join(",");
    console.error(`[${route}] ZodError fields=${paths}`);
    return;
  }

  const name = error instanceof Error ? error.name : "UnknownError";
  // Truncated so an upstream error that quotes the request back cannot spill a
  // whole dump into the logs.
  const message = (error instanceof Error ? error.message : "").slice(0, 200);
  console.error(`[${route}] ${name}: ${message}${statusSuffix(error)}`);
}
