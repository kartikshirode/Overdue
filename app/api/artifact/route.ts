import { NextResponse } from "next/server";

import { generateArtifact } from "@/lib/openai/artifact";
import { EscalationStageSchema, TaskSchema } from "@/lib/schema";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Artifact generation failed.";
}

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { artifact: null, error: errorMessage(error) },
      { status: 200 },
    );
  }
}
