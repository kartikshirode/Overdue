import OpenAI from "openai";

export const MODEL = process.env.MODEL_ID ?? "openai/gpt-5";

export const CALL_SETTINGS = {
  reasoning_effort: "low",
  max_completion_tokens: 3000,
  response_format: { type: "json_object" },
} as const;

export class ModelConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelConfigError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ModelConfigError(
      `Missing ${name}. Set it in .env.local and in the deployment environment.`,
    );
  }

  return value;
}

function requireBaseUrl(): string {
  const value = requireEnv("MODEL_BASE_URL");
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new ModelConfigError("MODEL_BASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ModelConfigError("MODEL_BASE_URL must be an http or https URL.");
  }

  return value;
}

let client: OpenAI | null = null;

// Built on first use, not at module scope, so a missing variable throws inside
// the route handler where it can be logged and reported instead of taking the
// whole module down before the try block runs.
export function getOpenAI(): OpenAI {
  if (client) {
    return client;
  }

  client = new OpenAI({
    apiKey: requireEnv("MODEL_API_KEY"),
    baseURL: requireBaseUrl(),
  });

  return client;
}
