import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, PenLine, Sparkle, Wand2, History, Save, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { draftTypes } from "@/lib/demo-data";
import { generateDraft, saveDraft, getDrafts, deleteDraft } from "@/lib/drafts.functions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/drafts")({
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
  component: Drafts,
});

function Drafts() {
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generateDraft);
  const saveFn = useServerFn(saveDraft);
  const getDraftsFn = useServerFn(getDrafts);
  const deleteFn = useServerFn(deleteDraft);

  const [typeId, setTypeId] = useState(draftTypes[0].id);
  const [prompt, setPrompt] = useState("");
  const [ref, setRef] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: savedDrafts = [] } = useQuery({
    queryKey: ["drafts"],
    queryFn: () => getDraftsFn(),
  });

  const mutation = useMutation({
    mutationFn: (data: { id?: string; type: string; title: string; content: string }) => saveFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("Draft saved successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to save draft", { description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("Draft deleted");
    }
  });

  const active = draftTypes.find((d) => d.id === typeId) || draftTypes[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please provide an instruction for the AI.");
      return;
    }

    setBusy(true);
    setOutput(null);
    try {
      const result = await generateFn({ data: { type: active.label, prompt, reference: ref } });
      setOutput(result.content);
      toast.success("Draft generated", { description: `${active.label} ready for review.` });
    } catch (err: any) {
      toast.error("AI Generation failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    if (!output) return;
    mutation.mutate({
      id: activeDraftId || undefined,
      type: typeId,
      title: prompt.substring(0, 50) || `${active.label} - ${format(new Date(), "PP")}`,
      content: output,
    });
  };

  const loadDraft = (draft: any) => {
    setTypeId(draft.type);
    setPrompt(draft.title);
    setOutput(draft.content);
    setActiveDraftId(draft.id);
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader
        eyebrow="Module 05"
        title="AI Draft Generator"
        description="Turn a one-line instruction into a correctly formatted government document."
        icon={<PenLine className="h-6 w-6" />}
      />

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="animate-rise h-fit">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Draft configuration</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Saved Drafts</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] mt-4">
                    <div className="space-y-3 pr-4">
                      {savedDrafts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No saved drafts yet.</p>
                      ) : (
                        savedDrafts.map((d: any) => (
                          <div key={d.id} className="group flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                            <button 
                              className="flex-1 text-left"
                              onClick={() => loadDraft(d)}
                            >
                              <p className="text-sm font-medium truncate">{d.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.type} • {format(new Date(d.updated_at), "PPp")}
                              </p>
                            </button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive"
                              onClick={() => deleteMutation.mutate(d.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
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
                        if (!activeDraftId) setOutput(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition-all duration-300 hover:shadow-md ${
                        d.id === typeId
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/30"
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
                  Reference number (Optional)
                </Label>
                <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. DC/REV/2025/1184" className="rounded-xl bg-muted/30" />
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
                  className="rounded-xl bg-muted/30 resize-none focus-visible:ring-primary/20"
                />
              </div>

              <Button className="w-full rounded-xl shadow-lg shadow-primary/20 py-6" onClick={handleGenerate} disabled={busy}>
                <Wand2 className="mr-2 h-4 w-4" />
                {busy ? "Drafting…" : "Generate draft"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-rise flex min-h-[560px] flex-col">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkle className="h-4 w-4 shrink-0 text-primary" />
              <CardTitle className="truncate text-base">{active.label} — draft preview</CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {ref && <Badge variant="secondary">Ref {ref}</Badge>}
              
              {output && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <PenLine className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {isEditing ? "View" : "Edit"}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="h-9 gap-2"
                    onClick={handleSave}
                    disabled={mutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>

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
                    onClick={() => toast.info("Download function would be implemented with real PDF/DOCX generation.")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto py-5 space-y-4">
            {output && (
              <Alert variant="default" className="bg-blue-50/50 border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 text-sm font-semibold">Important Notice</AlertTitle>
                <AlertDescription className="text-blue-700 text-xs">
                  AI-generated draft — requires official review and approval. Never represent generated text as an officially issued government document.
                </AlertDescription>
              </Alert>
            )}

            {busy && (
              <p className="animate-pulse text-sm text-muted-foreground">
                Composing {active.label.toLowerCase()} in official format…
              </p>
            )}
            {!busy && output && (
              isEditing ? (
                <Textarea 
                  value={output} 
                  onChange={(e) => setOutput(e.target.value)}
                  className="min-h-[400px] font-sans text-sm leading-relaxed p-4 rounded-xl border-border bg-muted/10 resize-none focus-visible:ring-primary/20"
                />
              ) : (
                <pre className="animate-rise whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-muted/5 p-4 rounded-xl border border-transparent">
                  {output}
                </pre>
              )
            )}
            {!busy && !output && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                <PenLine className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Ready to draft</p>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Choose a document type, provide instructions, and click Generate draft to begin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

