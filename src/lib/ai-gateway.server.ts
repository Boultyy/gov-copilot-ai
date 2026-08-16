import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // The official baseURL for the built-in AI connector in modern TanStack Start projects.
  // We use the proxy endpoint provided by the platform.
  const baseURL = "https://api.lovable.dev/v1/openai";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    // Add project header to help the gateway route correctly
    defaultHeaders: {
      "x-lovable-project-id": process.env.LOVABLE_PROJECT_ID || "",
    }
  });
}
