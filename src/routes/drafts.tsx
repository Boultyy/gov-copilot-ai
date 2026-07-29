import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, PenLine, Sparkle, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { draftTypes } from "@/lib/demo-data";

export const Route = createFileRoute("/drafts")({
  head: () => ({
    meta: [
      { title: "AI Draft Generator | GovCopilot" },
      {
        name: "description",
        content:
          "Generate official letters, public notices, circulars, RTI replies and office orders in correct government format from a short prompt.",
      },
      { property: "og:title", content: "AI Draft Generator | GovCopilot" },
      {
        property: "og:description",
        content: "Draft government letters, circulars, RTI replies and office orders instantly.",
      },
    ],
  }),
  component: Drafts;
});

function Drafts() {
  const [typeId, setTypeId] = useState(draftTypes[0].id);
  const [prompt, setPrompt] = useState(
    "Request additional manpower to clear pending land mutation cases in Tahsil-3",
  );
  const [ref, setRef] = useState("DC/REV/2025/1184");
  const [output, setOutput] = useState<string | null>(draftTypes[0].sample);
  const [busy, setBusy] = useState(false);

  const active = draftTypes.find((d) => d.id === typeId)!;

  const generate = () => {
    setBusy(true);
    setOutput(null);
    setTimeout(() => {
      setOutput(active.sample);
      setBusy(false);
      toast.success("Draft generated", { description: `${active.label} ready for review.` });
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 05"
        title="AI Draft Generator"
        description="Turn a one-line instruction into a correctly formatted government document."
        icon={<PenLine className="h-5 w-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="animate-rise h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Draft configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Document type
              </Label>
              <div className="grid gap-2">
                {draftTypes.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setTypeId(d.id);
                      setOutput(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      d.id === typeId
                        ? "border-primary bg-accent/70 shadow-[var(--shadow-card)]"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-sm font-semibold">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref" className="text-xs uppercase tracking-wider text-muted-foreground">
                Reference number
              </Label>
              <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-xs uppercase tracking-wider text-muted-foreground">
                Instruction
              </Label>
              <Textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what the document should convey…"
              />
            </div>

            <Button className="w-full rounded-xl" onClick={generate} disabled={busy}>
              <Wand2 className="mr-2 h-4 w-4" />
              {busy ? "Drafting…" : "Generate draft"}
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-rise flex min-h-[560px] flex-col">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkle className="h-4 w-4 shrink-0 text-primary" />
              <CardTitle className="truncate text-base">{active.label} — draft preview</CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">Ref {ref}</Badge>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy draft"
                onClick={() => {
                  if (output) navigator.clipboard.writeText(output);
                  toast.success("Draft copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Download draft"
                onClick={() => toast.info("Demo mode — download disabled")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto py-5">
            {busy && (
              <p className="animate-pulse text-sm text-muted-foreground">
                Composing {active.label.toLowerCase()} in official format…
              </p>
            )}
            {!busy && output && (
              <pre className="animate-rise whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {output}
              </pre>
            )}
            {!busy && !output && (
              <p className="text-sm text-muted-foreground">
                Choose a document type and click Generate draft.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
