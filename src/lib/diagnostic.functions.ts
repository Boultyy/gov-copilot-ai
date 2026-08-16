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
      },
      tests: [],
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    const projectID = process.env.LOVABLE_PROJECT_ID;
    const url = "https://api.lovable.dev/v1/ai/openai/chat/completions";

    try {
      const start = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-lovable-project-id': projectID || '',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: data.prompt || 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        results.tests.push({
          name: "Direct Fetch (chat/completions)",
          status: "FAILED",
          error: {
            status: response.status,
            statusText: response.statusText,
            url: url,
            body: body
          }
        });
      } else {
        const json = await response.json();
        results.tests.push({
          name: "Direct Fetch (chat/completions)",
          status: "SUCCESS",
          duration: Date.now() - start,
          model: json.model,
        });
      }
    } catch (err: any) {
      results.tests.push({
        name: "Direct Fetch (chat/completions)",
        status: "FAILED",
        error: {
          message: err.message,
          name: err.name,
        }
      });
    }

    return results;
  });
