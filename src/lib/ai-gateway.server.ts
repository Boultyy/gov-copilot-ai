import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // Use the internal gateway URL which is available in the sandbox/worker environment.
  const baseURL = "https://api.lovable.dev/v1";

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
