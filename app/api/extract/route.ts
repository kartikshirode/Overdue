import { NextResponse } from "next/server";

import { RequestError, classifyError } from "@/lib/api-error";
import { logRouteError } from "@/lib/log-error";
import { extractTasks } from "@/lib/openai/extract";
import { allowRequest, clientKey } from "@/lib/rate-limit";

const MAX_DUMP_CHARS = 4000;
const MAX_BODY_BYTES = 16_000;

function isOversizedBody(request: Request): boolean {
  const declared = Number.parseInt(
    request.headers.get("content-length") ?? "",
    10,
  );
  return Number.isFinite(declared) && declared > MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { candidates: [], error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  try {
    if (isOversizedBody(request)) {
      throw new RequestError("Request body is too large.");
    }

    const body: unknown = await request.json();
    const dump =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).dump
        : null;

    if (typeof dump !== "string" || dump.trim() === "") {
      throw new RequestError("Request body must include a non-empty string dump.");
    }

    if (dump.length > MAX_DUMP_CHARS) {
      throw new RequestError(
        `Dump is too long. Keep it under ${MAX_DUMP_CHARS} characters.`,
      );
    }

    const candidates = await extractTasks(dump);
    return NextResponse.json({ candidates }, { status: 200 });
  } catch (error) {
    logRouteError("api/extract", error);
    const { status, message } = classifyError(error);
    return NextResponse.json({ candidates: [], error: message }, { status });
  }
}
