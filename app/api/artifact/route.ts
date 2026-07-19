import { NextResponse } from "next/server";

import { logRouteError } from "@/lib/log-error";
import { generateArtifact } from "@/lib/openai/artifact";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { EscalationStageSchema, TaskSchema } from "@/lib/schema";

const MAX_BODY_BYTES = 24_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Artifact generation failed.";
}

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
      { artifact: null, error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  try {
    if (isOversizedBody(request)) {
      throw new Error("Request body is too large.");
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      throw new Error("Request body must be an object.");
    }

    const fields = body as Record<string, unknown>;
    const task = TaskSchema.parse(fields.task);
    const stage = EscalationStageSchema.parse(fields.stage);
    const artifact = await generateArtifact(task, stage);

    return NextResponse.json({ artifact }, { status: 200 });
  } catch (error) {
    logRouteError("api/artifact", error);
    return NextResponse.json(
      { artifact: null, error: errorMessage(error) },
      { status: 200 },
    );
  }
}
