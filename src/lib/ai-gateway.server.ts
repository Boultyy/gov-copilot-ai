import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // Use the specific platform-recommended AI proxy endpoint
  const baseURL = "https://api.lovable.dev/v1/ai";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    defaultHeaders: {
      "x-lovable-project-id": process.env.LOVABLE_PROJECT_ID || "",
    }
  });
}
