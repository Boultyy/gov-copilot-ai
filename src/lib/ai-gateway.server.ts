import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // The internal gateway is available at the project's own origin in the worker runtime
  // or via the AI connector's dedicated gateway. 
  // For Lovable projects, the AI Gateway is typically accessed without a custom baseURL 
  // if using the standard SDK, but here we need to point it to the Lovable proxy.
  const baseURL = "https://api.lovable.dev/v1";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
  });
}
