import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_AI_GATEWAY_API_KEY;
  const baseURL = "https://api.lovable.ai/v1";

  if (!apiKey) {
    // Fallback or error if not in Lovable environment
    console.warn("LOVABLE_AI_GATEWAY_API_KEY is not set.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
  });
}
