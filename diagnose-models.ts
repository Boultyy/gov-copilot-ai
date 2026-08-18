
import OpenAI from "openai";

async function diagnose() {
  const apiKey = process.env.LOVABLE_API_KEY;
  const projectID = process.env.LOVABLE_PROJECT_ID;
  const baseURL = "https://api.lovable.dev/v1/ai/openai";

  console.log("Config:", { projectID, hasApiKey: !!apiKey });

  const ai = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
    defaultHeaders: {
      "x-lovable-project-id": projectID || "",
    }
  });

  const models = [
    "gpt-4o",
    "gpt-4o-mini",
    "google/gemini-2.0-flash-exp",
    "google/gemini-2.0-flash",
    "anthropic/claude-3-5-sonnet",
  ];

  for (const model of models) {
    try {
      console.log(`Testing model: ${model}...`);
      const response = await ai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      });
      console.log(`✅ ${model} SUCCESS:`, response.choices[0].message.content);
      return model; // Found a working one
    } catch (err: any) {
      console.log(`❌ ${model} FAILED:`, err.status, err.message);
    }
  }
}

diagnose().catch(console.error);
