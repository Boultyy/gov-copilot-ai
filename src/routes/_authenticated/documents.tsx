import { useRef, useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileSearch,
  Quote,
  SendHorizonal,
  Sparkle,
  Loader2,
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  CalendarDays,
  Building2,
  IndianRupee,
  ListChecks,
  Target,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Dropzone } from "@/components/dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getDocuments,
  uploadDocumentMetadata,
  processDocument,
  deleteDocument,
  askDocuments,
} from "@/lib/documents.functions";
import { supabase } from "@/integrations/supabase/client";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Documents,
});

type Citation = { index: number; doc: string; page: number | null; snippet: string };
type ChatTurn = { role: "user" | "assistant"; text: string; citations?: Citation[] };

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = [".pdf", ".docx", ".txt"];

const STATUS_LABEL: Record<string, string> = {
  uploading: "Uploading…",
  uploaded: "Queued",
  processing: "Processing…",
  extracting: "Extracting text…",
  indexing: "Indexing…",
  analyzing: "Analysing…",
  ready: "Ready",
  failed: "Failed",
  ocr_required: "OCR required",
};

const SUGGESTED = [
  "What is this document about?",
  "Who is eligible?",
  "What are the important deadlines?",
  "Which department issued this?",
  "How much funding is mentioned?",
  "Explain this document in simple language.",
];

function bytes(n?: number | null) {
  if (!n) return "—";
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function Documents() {
  const queryClient = useQueryClient();
  const uploadMetaFn = useServerFn(uploadDocumentMetadata);
  const processDocFn = useServerFn(processDocument);
  const deleteDocFn = useServerFn(deleteDocument);
  const askFn = useServerFn(askDocuments);
  const getDocsFn = useServerFn(getDocuments);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState<{ name: string; stage: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text: "Upload a government scheme, tender, circular, notification or policy document. I will read it, index it and answer your questions with citations from that exact file.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocsFn(),
    refetchInterval: (query) => {
      const rows = (query.state.data as any[]) || [];
      return rows.some((d) => !["ready", "failed", "ocr_required"].includes(d.status))
        ? 2500
        : false;
    },
  });

  const indexedCount = documents.filter((d: any) => d.status === "ready").length;
  const selected = useMemo(
    () => documents.find((d: any) => d.id === selectedId) || null,
    [documents, selectedId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, thinking]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const runProcessing = async (documentId: string, name: string) => {
    try {
      const result: any = await processDocFn({ data: { documentId } });
      if (result?.status === "ready") toast.success(`${name} is ready`);
      else if (result?.error) toast.error(result.error);
    } catch (err) {
      console.error("[DOCS] processing call failed", err);
      toast.error(`Could not process ${name}`);
    } finally {
      refresh();
    }
  };

  const handleUpload = async (files: File[]) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      toast.error("Please sign in again to upload documents.");
      return;
    }

    for (const file of files) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED.includes(ext)) {
        toast.error(`${file.name}: only PDF, DOCX and TXT files are supported.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than the 25 MB limit.`);
        continue;
      }

      setPending((p) => [...p, { name: file.name, stage: "Uploading…" }]);

      try {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const filePath = `${userId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { contentType: file.type || "application/octet-stream" });

        if (uploadError) {
          console.error("[DOCS] storage upload failed", uploadError);
          throw new Error("The file could not be uploaded to secure storage.");
        }

        const doc: any = await uploadMetaFn({
          data: {
            name: file.name,
            storage_path: filePath,
            size_bytes: file.size,
            mime_type: file.type || "application/octet-stream",
          },
        });

        setPending((p) => p.filter((x) => x.name !== file.name));
        refresh();
        setSelectedId((cur) => cur ?? doc.id);
        await runProcessing(doc.id, file.name);
      } catch (error: any) {
        setPending((p) => p.filter((x) => x.name !== file.name));
        console.error("[DOCS] upload failed", error);
        toast.error(error?.message || "Upload failed. Please try again.");
      }
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocFn({ data: { documentId: docId } });
      if (selectedId === docId) setSelectedId(null);
      toast.success("Document deleted");
    } catch {
      toast.error("Could not delete this document.");
    } finally {
      refresh();
    }
  };

  const ask = async (question: string) => {
    if (!question.trim() || thinking) return;
    if (indexedCount === 0) {
      toast.error("Upload and index a document first.");
      return;
    }

    setTurns((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setThinking(true);

    try {
      const res: any = await askFn({
        data: { question, documentId: selectedId ?? null },
      });
      setTurns((t) => [
        ...t,
        { role: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch (error) {
      console.error("[DOCS] chat failed", error);
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          text: "I couldn't complete that search. Please try again in a moment.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const analysis: any = selected?.analysis || null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 01"
        title="AI Document Intelligence"
        description="Ask questions across uploaded files — every answer is backed by source citations."
        icon={<FileSearch className="h-6 w-6" />}
      />

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="animate-rise h-fit">
            <CardHeader className="flex-row items-center gap-2 pb-3">
              <CardTitle className="text-base">Knowledge base</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {indexedCount} indexed
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dropzone
                files={pending.map((p) => ({ name: p.name, size: "—", status: "processing" }))}
                onAdd={handleUpload}
                onRemove={() => {}}
                hint="PDF, DOCX or TXT up to 25 MB"
              />

              {isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                  <p className="font-semibold text-foreground">No documents yet</p>
                  <p className="mt-1">
                    Upload government schemes, tenders, circulars, notifications, policies or
                    guidelines as PDF or DOCX. Each file is read, indexed and summarised — then you
                    can question it in Document Chat with page-level citations.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {documents.map((d: any) => {
                    const active = d.id === selectedId;
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(active ? null : d.id)}
                          className={cn(
                            "w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                            active && "border-primary/60 bg-primary/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {d.status === "ready" ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            ) : d.status === "failed" ? (
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            ) : d.status === "ocr_required" ? (
                              <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            ) : (
                              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{d.name}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {bytes(d.size_bytes)}
                                {d.page_count ? ` · ${d.page_count} pages` : ""} ·{" "}
                                {new Date(d.created_at).toLocaleDateString("en-IN")}
                              </span>
                              <span
                                className={cn(
                                  "mt-0.5 block text-[11px] font-semibold",
                                  d.status === "ready"
                                    ? "text-success"
                                    : d.status === "failed" || d.status === "ocr_required"
                                      ? "text-destructive"
                                      : "text-primary",
                                )}
                              >
                                {STATUS_LABEL[d.status] || d.status}
                                {d.status === "ready" && d.chunk_count
                                  ? ` · ${d.chunk_count} passages indexed`
                                  : ""}
                              </span>
                              {d.error_message && (
                                <span className="mt-1 block text-[11px] text-destructive">
                                  {d.error_message}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            {(d.status === "failed" || d.status === "ocr_required") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runProcessing(d.id, d.name);
                                }}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" /> Retry
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(d.id);
                              }}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {selected && (
            <Card className="animate-rise">
              <CardHeader className="flex-row items-center gap-2 pb-3">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Document details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <Row label="Name" value={selected.name} />
                <Row label="Type" value={selected.mime_type || "—"} />
                <Row label="Size" value={bytes(selected.size_bytes)} />
                <Row
                  label="Uploaded"
                  value={new Date(selected.created_at).toLocaleString("en-IN")}
                />
                <Row label="Status" value={STATUS_LABEL[selected.status] || selected.status} />
                {selected.page_count ? <Row label="Pages" value={String(selected.page_count)} /> : null}
                {selected.word_count ? (
                  <Row
                    label="Extracted"
                    value={`${selected.word_count.toLocaleString("en-IN")} words · ${selected.char_count?.toLocaleString("en-IN")} chars`}
                  />
                ) : null}
                <Row
                  label="Indexed"
                  value={selected.chunk_count ? `${selected.chunk_count} passages` : "Not indexed"}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {analysis && (
            <Card className="animate-rise">
              <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
                <Sparkle className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Document analysis</CardTitle>
                {analysis.document_type && (
                  <Badge variant="outline" className="ml-auto capitalize">
                    {analysis.document_type}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4 py-4 text-sm">
                {analysis.summary && (
                  <p className="leading-relaxed text-foreground">{analysis.summary}</p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <ListBlock icon={<ListChecks className="h-3.5 w-3.5" />} title="Key points" items={analysis.key_points} />
                  <ListBlock
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    title="Important dates"
                    items={(analysis.important_dates || []).map(
                      (d: any) => `${d.date}${d.description ? ` — ${d.description}` : ""}`,
                    )}
                  />
                  <ListBlock icon={<Building2 className="h-3.5 w-3.5" />} title="Organizations" items={analysis.organizations} />
                  <ListBlock
                    icon={<IndianRupee className="h-3.5 w-3.5" />}
                    title="Amounts"
                    items={(analysis.amounts || []).map(
                      (a: any) => `${a.amount}${a.description ? ` — ${a.description}` : ""}`,
                    )}
                  />
                  <ListBlock icon={<ListChecks className="h-3.5 w-3.5" />} title="Eligibility" items={analysis.eligibility} />
                  <ListBlock icon={<ListChecks className="h-3.5 w-3.5" />} title="Requirements" items={analysis.requirements} />
                  <ListBlock icon={<Target className="h-3.5 w-3.5" />} title="Actions required" items={analysis.actions} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Generated only from the text extracted from “{selected?.name}”.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="animate-rise flex min-h-[560px] flex-col">
            <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
              <Sparkle className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Document chat</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {selected ? `Scoped to ${selected.name}` : `${indexedCount} indexed`}
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {t.text}
                    </div>
                    {t.citations && t.citations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Sources
                        </p>
                        {t.citations.map((c) => (
                          <div
                            key={c.index}
                            className="rounded-xl border border-border bg-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-card hover:shadow-md"
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                              <span className="truncate text-xs font-semibold text-primary">
                                [{c.index}] {c.doc}
                              </span>
                              {c.page ? (
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                  p. {c.page}
                                </Badge>
                              ) : null}
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
                <div className="flex animate-pulse items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching documents…</span>
                </div>
              )}
              <div ref={endRef} />
            </CardContent>

            <div className="space-y-3 border-t border-border p-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((q) => (
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
                  placeholder="Ask about eligibility, deadlines, budget heads…"
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
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
      <span className="font-semibold text-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function ListBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items?: string[] | null;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-foreground">
        {items.slice(0, 8).map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
