import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import OpenAI from "openai";

export const runAiDiagnostic = createServerFn({ method: "POST" })
  .validator((data: { prompt?: string }) => z.object({ prompt: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const RUN_ID = Math.random().toString(36).substring(7);
    const results: any = {
      timestamp: new Date().toISOString(),
      runId: RUN_ID,
      env: {
        LOVABLE_API_KEY_EXISTS: !!process.env.LOVABLE_API_KEY,
        LOVABLE_PROJECT_ID_EXISTS: !!process.env.LOVABLE_PROJECT_ID,
      },
      tests: [],
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    const projectID = process.env.LOVABLE_PROJECT_ID;
    
    // Testing multiple base URLs
    const endpoints = [
      "https://api.lovable.dev/v1/ai/openai",
      "https://api.lovable.dev/v1/ai",
      "https://api.lovable.dev/v1"
    ];

    for (const baseURL of endpoints) {
      try {
        const ai = new OpenAI({
          apiKey: apiKey || "dummy-key",
          baseURL,
          defaultHeaders: {
            "x-lovable-project-id": projectID || "",
          }
        });

        const start = Date.now();
        const response = await ai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: data.prompt || "Ping" }],
          max_tokens: 5,
        });

        results.tests.push({
          name: `Completion via ${baseURL}`,
          status: "SUCCESS",
          duration: Date.now() - start,
          model: response.model,
        });
      } catch (err: any) {
        results.tests.push({
          name: `Completion via ${baseURL}`,
          status: "FAILED",
          error: {
            message: err.message,
            status: err.status,
            baseURL
          }
        });
      }
    }

    return results;
  });
