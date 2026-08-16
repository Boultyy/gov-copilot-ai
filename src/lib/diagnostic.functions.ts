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

    const requestedModel = "google/gemini-3.6-flash";

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
        messages: [{ role: "user", content: data.prompt || "Ping" }],
        max_tokens: 5,
      });

      results.tests.push({
        name: `Lovable AI Gateway`,
        status: "SUCCESS",
        model: response.model,
        requestedModel: requestedModel,
        details: "Built-in Lovable AI integration responded successfully."
      });
    } catch (err: any) {
      results.tests.push({
        name: `Lovable AI Gateway`,
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

    return results;
  });
