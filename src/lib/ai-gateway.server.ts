import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  const projectID = process.env.LOVABLE_PROJECT_ID;
  
  // Base platform URL
  const baseURL = "https://api.lovable.dev/v1/ai/openai";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  const ai = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    defaultHeaders: {
      "x-lovable-project-id": projectID || "",
    }
  });

  // Explicitly force the baseURL to ensure it doesn't get overridden by OpenAI client logic
  (ai as any).baseURL = baseURL;

  return ai;
}
