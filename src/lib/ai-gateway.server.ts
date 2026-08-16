import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY || process.env.LOVABLE_AI_GATEWAY_API_KEY;
  const baseURL = "https://api.lovable.dev/v1";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
  });
}
