import OpenAI from "openai";

export const MODEL = process.env.MODEL_ID ?? "openai/gpt-5";

export const CALL_SETTINGS = {
  reasoning_effort: "low",
  max_completion_tokens: 3000,
  response_format: { type: "json_object" },
} as const;

export const openai = new OpenAI({
  apiKey: process.env.MODEL_API_KEY,
  baseURL: process.env.MODEL_BASE_URL,
});
