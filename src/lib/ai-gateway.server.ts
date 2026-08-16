import OpenAI from "openai";

export function createAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  // The internal gateway is available at the project's own origin in the worker runtime
  // or via the AI connector's dedicated gateway.
  // For Lovable projects, use the internal endpoint which is typically reached 
  // without a custom baseURL if the proxy is configured, or via api.lovable.dev.
  const baseURL = "https://api.lovable.dev/v1";

  if (!apiKey) {
    console.warn("LOVABLE_API_KEY is not set. AI calls will likely fail.");
  }

  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
  });
}
