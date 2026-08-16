import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const runAiDiagnostic = createServerFn({ method: "POST" })
  .validator((data: { prompt?: string }) => z.object({ prompt: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const results: any = {
      timestamp: new Date().toISOString(),
      env: {
        LOVABLE_API_KEY_EXISTS: !!process.env.LOVABLE_API_KEY,
        LOVABLE_PROJECT_ID_EXISTS: !!process.env.LOVABLE_PROJECT_ID,
        AGW_URL: process.env.AGW_URL || "NOT_SET",
      },
      tests: [],
    };

    const { createAiGateway } = await import("./ai-gateway.server");
    const ai = createAiGateway();
    
    // Test 1: Simple Completion
    try {
      const start = Date.now();
      const response = await ai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: data.prompt || "Hello, are you there?" }],
        max_tokens: 5,
      });
      console.log("DIAGNOSTIC SUCCESS:", response.model);
      results.tests.push({
        name: "Chat Completion (gpt-4o)",
        status: "SUCCESS",
        duration: Date.now() - start,
        model: response.model,
        usage: response.usage,
      });
    } catch (err: any) {
      console.error("DIAGNOSTIC completion error:", {
        message: err.message,
        status: err.status,
        baseURL: ai.baseURL,
        // headers: ai.defaultHeaders
      });
      results.tests.push({
        name: "Chat Completion (gpt-4o)",
        status: "FAILED",
        error: {
          message: err.message,
          status: err.status,
          name: err.name,
          actualBaseURL: ai.baseURL,
        }
      });
    }

    // Test 2: Embedding
    try {
      const start = Date.now();
      const response = await ai.embeddings.create({
        model: "text-embedding-3-small",
        input: "Diagnostic test",
      });
      results.tests.push({
        name: "Embedding (text-embedding-3-small)",
        status: "SUCCESS",
        duration: Date.now() - start,
        model: response.model,
      });
    } catch (err: any) {
      results.tests.push({
        name: "Embedding (text-embedding-3-small)",
        status: "FAILED",
        error: {
          message: err.message,
          status: err.status,
          name: err.name,
        }
      });
    }

    return results;
  });
