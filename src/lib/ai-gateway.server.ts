import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // Use the standard Lovable AI Gateway endpoint for projects.
  const baseURL = "https://api.lovable.dev/v1";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    // Add default headers for the Lovable proxy if needed
    defaultHeaders: {
      "x-lovable-project-id": process.env.LOVABLE_PROJECT_ID || "",
    }
  });
}
