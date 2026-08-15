import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, GitCompareArrows, ScanSearch, XCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Dropzone, type DroppedFile } from "@/components/dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complianceChecks, conflicts, missingClauses } from "@/lib/demo-data";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { title: "Policy Conflict Checker | GovCopilot" },
      {
        name: "description",
        content:
          "Compare two policy documents side by side to surface contradictory clauses, missing provisions and statutory compliance gaps.",
      },
      { property: "og:title", content: "Policy Conflict Checker | GovCopilot" },
      {
        property: "og:description",
        content: "Detect clause conflicts, missing provisions and compliance gaps across policies.",
      },
    ],
  }),
  component: Policy,
});

const severityStyle: Record<string, string> = {
  high: "bg-destructive/12 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/40",
  low: "bg-muted text-muted-foreground border-border",
};

function Policy() {
  const [docA, setDocA] = useState<DroppedFile[]>([
    { name: "Housing_Policy_2021.pdf", size: "1.9 MB" },
  ]);
  const [docB, setDocB] = useState<DroppedFile[]>([
    { name: "Draft_Housing_Rules_2025.docx", size: "840 KB" },
  ]);
  const [state, setState] = useState<"idle" | "scanning" | "done">("done");

  const run = () => {
    setState("scanning");
    setTimeout(() => setState("done"), 1400);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 03"
        title="Policy Conflict Checker"
        description="Compare two policy documents for conflicts, gaps and compliance risk."
        icon={<GitCompareArrows className="h-6 w-6" />}
        actions={
          <Button className="shrink-0 rounded-full" onClick={run} disabled={state === "scanning"}>
            <ScanSearch className="mr-2 h-4 w-4" />
            {state === "scanning" ? "Analysing…" : "Run comparison"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Document A — existing policy", files: docA, set: setDocA },
          { label: "Document B — proposed policy", files: docB, set: setDocB },
        ].map((slot) => (
          <Card key={slot.label} className="animate-rise">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{slot.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Dropzone
                files={slot.files}
                onAdd={(f) => slot.set((p) => [...p, ...f])}
                onRemove={(n) => slot.set((p) => p.filter((x) => x.name !== n))}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {state === "scanning" && (
        <Card className="animate-rise">
          <CardContent className="p-6 text-sm text-muted-foreground">
            <p className="animate-pulse">Aligning clause structures and diffing 214 provisions…</p>
          </CardContent>
        </Card>
      )}

      {state === "done" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Conflicts found", value: conflicts.length, tone: "text-destructive" },
              { label: "Missing clauses", value: missingClauses.length, tone: "text-warning-foreground" },
              { label: "Compliance checks passed", value: "3 / 5", tone: "text-success" },
            ].map((s) => (
              <Card key={s.label} className="animate-rise border-border/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 font-display text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="animate-rise">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Clause-level conflicts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conflicts.map((c) => (
                <div key={c.clause} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <p className="min-w-0 font-semibold text-foreground">{c.clause}</p>
                    <Badge
                      variant="outline"
                      className={`shrink-0 capitalize ${severityStyle[c.severity]}`}
                    >
                      {c.severity} severity
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Document A
                      </p>
                      <p className="mt-1 text-sm">{c.docA}</p>
                    </div>
                    <div className="rounded-lg border border-destructive/30 bg-destructive/8 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                        Document B
                      </p>
                      <p className="mt-1 text-sm">{c.docB}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    {c.issue}
                  </p>
                  <p className="mt-1.5 rounded-lg bg-accent/60 p-3 text-sm text-accent-foreground">
                    <span className="font-semibold">AI recommendation: </span>
                    {c.recommendation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="animate-rise">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Missing clauses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingClauses.map((m) => (
                  <p key={m} className="flex gap-2 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    {m}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-rise">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compliance checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceChecks.map((c) => (
                  <div
                    key={c.name}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm">{c.name}</span>
                    {c.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : c.status === "warn" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
