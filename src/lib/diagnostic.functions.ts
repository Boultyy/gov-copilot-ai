import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const runAiDiagnostic = createServerFn({ method: "POST" })
  .validator((data: { prompt?: string }) => z.object({ prompt: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    return {
      timestamp: new Date().toISOString(),
      tests: [{ name: "STATIC_TEST", status: "SUCCESS" }]
    };
  });
