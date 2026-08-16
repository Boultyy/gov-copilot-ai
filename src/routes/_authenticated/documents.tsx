import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileSearch, Quote, SendHorizonal, Sparkle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Dropzone, type DroppedFile } from "@/components/dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { demoDocuments, documentQA, suggestedDocQuestions, type ChatTurn } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "AI Document Intelligence | GovCopilot" },
      {
        name: "description",
        content:
          "Upload government PDFs and DOCX files, ask questions in plain language and get AI answers with exact clause and page citations.",
      },
      { property: "og:title", content: "AI Document Intelligence | GovCopilot" },
      {
        property: "og:description",
        content: "Ask questions across government documents and get cited AI answers.",
      },
    ],
  }),
  component: Documents,
});

function Documents() {
  const [files, setFiles] = useState<DroppedFile[]>(demoDocuments as DroppedFile[]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text: "I have indexed 3 documents (156 pages). Ask me anything — I will answer with clause-level citations.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = (question: string) => {
    if (!question.trim() || thinking) return;
    setTurns((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setTurns((t) => [...t, documentQA.default]);
      setThinking(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1100);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 01"
        title="AI Document Intelligence"
        description="Ask questions across uploaded files — every answer is backed by source citations."
        icon={<FileSearch className="h-6 w-6" />}
      />

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="animate-rise h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Knowledge base</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropzone
              files={files}
              onAdd={(newFiles) => {
                const mapped = newFiles.map(f => ({
                  name: f.name,
                  size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
                  status: 'uploaded'
                }));
                setFiles((prev) => [...prev, ...mapped]);
              }}
              onRemove={(file) => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
            />
          </CardContent>
        </Card>

        <Card className="animate-rise flex min-h-[560px] flex-col">
          <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
            <Sparkle className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Document chat</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {files.length} sources
            </Badge>
          </CardHeader>

          <CardContent className="flex-1 space-y-5 overflow-y-auto py-5">
            {turns.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="animate-rise flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md shadow-primary/10">
                    {t.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="animate-rise max-w-[92%] space-y-3">
                  <p className="text-sm leading-relaxed text-foreground">{t.text}</p>
                  {t.citations && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sources
                      </p>
                      {t.citations.map((c, ci) => (
                        <div
                          key={ci}
                          className="rounded-xl border border-border bg-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-card hover:shadow-md"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                            <span className="truncate text-xs font-semibold text-primary">
                              [{ci + 1}] {c.doc}
                            </span>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              p. {c.page}
                            </Badge>
                          </div>
                          <p className="mt-1.5 flex gap-2 text-xs italic text-muted-foreground">
                            <Quote className="mt-0.5 h-3 w-3 shrink-0" />
                            {c.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {thinking && (
              <p className="animate-pulse text-sm text-muted-foreground">
                Searching 156 pages across {files.length} documents…
              </p>
            )}
            <div ref={endRef} />
          </CardContent>

          <div className="space-y-3 border-t border-border p-4">
            <div className="flex flex-wrap gap-2">
              {suggestedDocQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                rows={2}
                placeholder="Ask about eligibility, penalties, budget heads…"
                className="min-h-[52px] resize-none rounded-2xl border-border bg-muted/30 focus-visible:ring-primary/20"
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
                onClick={() => ask(input)}
                disabled={thinking}
                aria-label="Send"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
