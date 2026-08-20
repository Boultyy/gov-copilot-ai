import OpenAI from "openai";

/**
 * Lovable AI Gateway (built-in entitlement).
 * Correct base URL is https://ai.gateway.lovable.dev/v1 — models must be
 * namespaced (e.g. "openai/gpt-5-mini", "openai/text-embedding-3-small").
 */
export const AI_BASE_URL = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "google/gemini-2.5-flash";
export const CHAT_MODEL_STRONG = "openai/gpt-5-mini";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL: AI_BASE_URL,
  });
}
