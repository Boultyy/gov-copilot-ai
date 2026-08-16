import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  const projectID = process.env.LOVABLE_PROJECT_ID;
  
  // The correct baseURL for modern projects using the platform AI gateway
  const baseURL = "https://api.lovable.dev/v1/ai/openai";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    defaultHeaders: {
      "x-lovable-project-id": projectID || "",
    }
  });
}
