import { useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

const eligibilitySearchSchema = z.object({
  schemeId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/eligibility")({
  validateSearch: (search: Record<string, unknown>) => eligibilitySearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Eligibility Assessment | GovCopilot" },
      {
        name: "description",
        content: "Check your eligibility for government schemes based on official criteria.",
      },
    ],
  }),
  component: () => <Outlet />,
});
