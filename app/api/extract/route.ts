import { NextResponse } from "next/server";

import { extractTasks } from "@/lib/openai/extract";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Task extraction failed.";
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const dump =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).dump
        : null;

    if (typeof dump !== "string" || dump.trim() === "") {
      throw new Error("Request body must include a non-empty string dump.");
    }

    const candidates = await extractTasks(dump);
    return NextResponse.json({ candidates }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { candidates: [], error: errorMessage(error) },
      { status: 200 },
    );
  }
}
