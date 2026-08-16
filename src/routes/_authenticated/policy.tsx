import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows, ScanSearch, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { comparePolicies } from "@/lib/policy.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/policy")({
  component: PolicyComparison,
});

function PolicyComparison() {
  const [selected, setSelected] = useState<{ a?: string; b?: string }>({});
  const queryClient = useQueryClient();
  const runComparison = useServerFn(comparePolicies);
  
  const mutation = useMutation({
    mutationFn: runComparison,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
    }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 03"
        title="Policy Conflict Checker"
        description="Evidence-based policy comparison."
        icon={<GitCompareArrows className="h-6 w-6" />}
      />
      
      <div className="grid gap-6 md:grid-cols-2">
         {/* Placeholder for policy selectors */}
         <Card>
           <CardHeader><CardTitle>Policy A</CardTitle></CardHeader>
           <CardContent>Select policy from your documents...</CardContent>
         </Card>
         <Card>
           <CardHeader><CardTitle>Policy B</CardTitle></CardHeader>
           <CardContent>Select policy from your documents...</CardContent>
         </Card>
      </div>

      <Button 
        disabled={!selected.a || !selected.b || mutation.isPending}
        onClick={() => selected.a && selected.b && mutation.mutate({ policyAId: selected.a, policyBId: selected.b })}
      >
        {mutation.isPending ? "Analyzing..." : "Compare Selected Policies"}
      </Button>

      {/* Comparison Results Area */}
    </div>
  );
}
