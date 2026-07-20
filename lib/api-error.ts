// Maps a thrown error onto the HTTP status and the text the client is allowed
// to see.
//
// The split that matters: messages we wrote ourselves are safe to send back,
// because we know what is in them. Messages from anywhere else are not. An
// upstream provider error quotes our request and names our model deployment,
// and a Zod message echoes the received values field by field, so both would
// hand an anonymous caller a free description of the setup. Those stay in the
// server logs and the caller gets a fixed sentence instead.

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}

export type ClassifiedError = {
  status: number;
  // Safe to send to the client. Never derived from upstream or Zod text.
  message: string;
};

const BAD_PAYLOAD = "That request was not in the expected shape.";
const NOT_CONFIGURED = "The drafting service is not configured right now.";
const UPSTREAM_BUSY = "The drafting service is busy. Try again in a moment.";
const UPSTREAM_FAILED = "The drafting service could not be reached.";

function isZodError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "ZodError" &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

function upstreamStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
}

export function classifyError(error: unknown): ClassifiedError {
  // Our own validation. We wrote the text, so it goes back as-is and tells the
  // caller something useful.
  if (error instanceof RequestError) {
    return { status: 400, message: error.message };
  }

  // The payload failed the schema. Still the caller's fault, but the Zod
  // message would reflect their own values back, so it does not travel.
  if (isZodError(error)) {
    return { status: 400, message: BAD_PAYLOAD };
  }

  if (error instanceof Error && error.name === "ModelConfigError") {
    // 503, not 500: the deployment is misconfigured rather than the code being
    // broken, and it is fixable without a new build.
    return { status: 503, message: NOT_CONFIGURED };
  }

  const status = upstreamStatus(error);
  if (status === 429) {
    return { status: 429, message: UPSTREAM_BUSY };
  }

  return { status: 502, message: UPSTREAM_FAILED };
}
