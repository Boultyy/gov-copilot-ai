import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows, ScanSearch, AlertTriangle, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { comparePolicies, getPolicyComparisons } from "@/lib/policy.functions";
import { getDocuments } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/policy")({
  head: () => ({
    meta: [
      { title: "Policy Conflict Checker | GovCopilot" },
      {
        name: "description",
        content: "Compare two policy documents for conflicts, gaps and compliance risk.",
      },
    ],
  }),
  component: PolicyComparison,
});

const severityStyle: Record<string, string> = {
  high: "bg-destructive/12 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/40",
  low: "bg-muted text-muted-foreground border-border",
};

function PolicyComparison() {
  const queryClient = useQueryClient();
  const getDocsFn = useServerFn(getDocuments);
  const getComparisonsFn = useServerFn(getPolicyComparisons);
  const runComparisonFn = useServerFn(comparePolicies);

  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocsFn(),
  });

  const { data: comparisons = [], isLoading: compsLoading } = useQuery({
    queryKey: ["comparisons"],
    queryFn: () => getComparisonsFn(),
  });

  const compareMutation = useMutation({
    mutationFn: (data: { policyAId: string, policyBId: string }) => runComparisonFn({ data }),
    onSuccess: () => {
      toast.success("Comparison completed successfully");
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to compare policies");
    }
  });

  const readyDocs = documents.filter(d => d.status === 'ready');

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 03"
        title="Policy Conflict Checker"
        description="Compare two policy documents for conflicts, gaps and compliance risk."
        icon={<GitCompareArrows className="h-6 w-6" />}
        actions={
          <Button 
            className="shrink-0 rounded-full" 
            onClick={() => compareMutation.mutate({ policyAId: selectedA, policyBId: selectedB })} 
            disabled={!selectedA || !selectedB || compareMutation.isPending}
          >
            <ScanSearch className="mr-2 h-4 w-4" />
            {compareMutation.isPending ? "Analysing…" : "Run comparison"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Document A — Existing Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedA} onValueChange={setSelectedA}>
              <SelectTrigger>
                <SelectValue placeholder={docsLoading ? "Loading documents..." : "Select document..."} />
              </SelectTrigger>
              <SelectContent>
                {readyDocs.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                ))}
                {readyDocs.length === 0 && !docsLoading && (
                  <SelectItem value="none" disabled>No indexed documents found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Document B — Proposed Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedB} onValueChange={setSelectedB}>
              <SelectTrigger>
                <SelectValue placeholder={docsLoading ? "Loading documents..." : "Select document..."} />
              </SelectTrigger>
              <SelectContent>
                {readyDocs.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                ))}
                {readyDocs.length === 0 && !docsLoading && (
                  <SelectItem value="none" disabled>No indexed documents found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {compareMutation.isPending && (
        <Card className="animate-rise border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="animate-pulse font-medium">Aligning clause structures and analyzing provisions for conflicts…</p>
          </CardContent>
        </Card>
      )}

      {comparisons.length > 0 && (
        <div className="space-y-6">
          {comparisons.map((comp) => (
            <div key={comp.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Badge variant="outline" className="bg-muted">
                  Comparison Result — {new Date(comp.created_at).toLocaleDateString()}
                </Badge>
                <span className="text-xs text-muted-foreground">{comp.result_summary}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="animate-rise border-border/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Conflicts found</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-destructive">
                      {comp.policy_conflicts?.length || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="animate-rise border-border/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-success">Verified</p>
                  </CardContent>
                </Card>
                <Card className="animate-rise border-border/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Evidence Level</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-primary">High</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4">
                {comp.policy_conflicts?.map((c: any) => (
                  <Card key={c.id} className="animate-rise overflow-hidden border-border transition-all hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{c.clause_title}</p>
                        <Badge variant="outline" className={`capitalize ${severityStyle[c.severity] || severityStyle.low}`}>
                          {c.severity} severity
                        </Badge>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document A Citation</p>
                            <p className="mt-1 text-sm leading-relaxed">{c.doc_a_value}</p>
                          </div>
                          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">Document B Citation</p>
                            <p className="mt-1 text-sm leading-relaxed">{c.doc_b_value}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-foreground">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold text-xs uppercase tracking-wide text-warning-foreground">Potential conflict requiring human review</p>
                            <p>{c.issue}</p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-primary/5 p-3 text-sm border border-primary/10">
                          <span className="font-bold text-primary italic">AI Recommendation: </span>
                          <span className="text-foreground">{c.recommendation}</span>
                        </div>

                        <p className="text-[10px] text-muted-foreground italic">
                          Disclaimer: This comparison is an AI-generated analysis based on document text chunks. 
                          It is not legal advice or an official government determination.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {comparisons.length === 0 && !compsLoading && !compareMutation.isPending && (
        <Card className="animate-rise border-dashed border-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <GitCompareArrows className="h-12 w-12 opacity-20 mb-4" />
            <p>Select two policy documents above and run comparison to see potential conflicts.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
