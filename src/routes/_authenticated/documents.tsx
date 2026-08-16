import { useRef, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileSearch, Quote, SendHorizonal, Sparkle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Dropzone, type DroppedFile } from "@/components/dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { suggestedDocQuestions } from "@/lib/demo-data";
import { 
  getDocuments, 
  uploadDocumentMetadata, 
  processDocument, 
  deleteDocument,
  searchUserDocuments 
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
    ],
  }),
  component: Documents,
});

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  citations?: { doc: string; page: number; snippet: string }[];
};

function Documents() {
  const queryClient = useQueryClient();
  const getDocsFn = useServerFn(getDocuments);
  const uploadMetaFn = useServerFn(uploadDocumentMetadata);
  const processDocFn = useServerFn(processDocument);
  const deleteDocFn = useServerFn(deleteDocument);
  const searchDocsFn = useServerFn(searchUserDocuments);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text: "Upload your government documents and I will help you analyze them with citations.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocsFn(),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, thinking]);

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        const filePath = `${Math.random().toString(36).substring(2)}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const doc = await uploadMetaFn({ 
          data: {
            name: file.name,
            storage_path: filePath,
            size_bytes: file.size,
            mime_type: file.type
          }
        });

        toast.success(`Uploaded ${file.name}. Starting AI indexing...`);
        queryClient.invalidateQueries({ queryKey: ["documents"] });

        processDocFn({ data: { documentId: doc.id } })
          .then(() => {
            toast.success(`Successfully indexed ${file.name}`);
            queryClient.invalidateQueries({ queryKey: ["documents"] });
          })
          .catch((err) => {
            console.error("Processing error:", err);
            toast.error(`Failed to index ${file.name}`);
            queryClient.invalidateQueries({ queryKey: ["documents"] });
          });

      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`);
      }
    }
  };

  const handleDelete = async (file: DroppedFile) => {
    const doc = documents.find(d => d.id === file.id);
    if (!doc) return;
    
    try {
      await deleteDocFn({ data: { documentId: doc.id, storagePath: doc.storage_path } });
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (error: any) {
      toast.error("Delete failed");
    }
  };

  const ask = async (question: string) => {
    if (!question.trim() || thinking) return;
    
    setTurns((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setThinking(true);

    try {
      const results = await searchDocsFn({ data: { query: question, limit: 3 } });
      
      if (!results || results.length === 0) {
        setTurns((t) => [...t, { 
          role: "assistant", 
          text: "I couldn't find any relevant information in your uploaded documents. Please try another question or upload more sources." 
        }]);
      } else {
        const citations = results.map((r: any) => ({
          doc: r.document_name,
          page: 1, 
          snippet: r.content
        }));

        setTurns((t) => [...t, { 
          role: "assistant", 
          text: `Based on your documents, here is what I found:\n\n${results[0].content}`,
          citations
        }]);
      }
    } catch (error) {
      toast.error("Search failed");
      setTurns((t) => [...t, { role: "assistant", text: "I encountered an error while searching your documents." }]);
    } finally {
      setThinking(false);
    }
  };

  const mappedFiles: DroppedFile[] = documents.map(d => ({
    id: d.id,
    name: d.name,
    size: `${((d.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB`,
    status: d.status,
    error: d.error_message
  }));

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
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Dropzone
                files={mappedFiles}
                onAdd={handleUpload}
                onRemove={handleDelete}
              />
            )}
          </CardContent>
        </Card>

        <Card className="animate-rise flex min-h-[560px] flex-col">
          <CardHeader className="flex-row items-center gap-2 border-b border-border pb-3">
            <Sparkle className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Document chat</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {documents.filter(d => d.status === 'ready').length} indexed
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
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{t.text}</div>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching documents…</span>
              </div>
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
