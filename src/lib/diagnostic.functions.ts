import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import OpenAI from "openai";

export const runAiDiagnostic = createServerFn({ method: "POST" })
  .validator((data: { prompt?: string }) => z.object({ prompt: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    const projectID = process.env.LOVABLE_PROJECT_ID;
    const baseURL = "https://api.lovable.dev/v1/ai/openai";

    // Test multiple models to find what's working
    const modelsToTest = [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet-20241022",
      "gemini-1.5-pro",
      "openai/gpt-4o"
    ];

    for (const requestedModel of modelsToTest) {
      try {
        const ai = new OpenAI({
          apiKey: apiKey || "dummy-key",
          baseURL,
          defaultHeaders: {
            "x-lovable-project-id": projectID || "",
          },
          dangerouslyAllowBrowser: false,
        });

        const response = await ai.chat.completions.create({
          model: requestedModel,
          messages: [{ role: "user", content: data.prompt || "GOVCOPILOT_AI_OK" }],
          max_tokens: 5,
        });

        results.tests.push({
          name: `Lovable AI Gateway (${requestedModel})`,
          status: "SUCCESS",
          model: response.model,
          requestedModel: requestedModel,
          details: "Built-in Lovable AI integration responded successfully."
        });
        
        // If one works, we can stop or continue
      } catch (err: any) {
        results.tests.push({
          name: `Lovable AI Gateway (${requestedModel})`,
          status: "FAILED",
          requestedModel: requestedModel,
          error: { 
            message: err.status === 404 
              ? `404 Not Found: The Lovable AI Gateway returned a 404 for model '${requestedModel}'.` 
              : err.message, 
            status: err.status,
            body: err.body
          }
        });
      }
    }

    return results;
  });
