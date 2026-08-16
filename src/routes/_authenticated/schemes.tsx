import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getSchemes } from "@/lib/schemes.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Scheme Discovery | GovCopilot" },
      {
        name: "description",
        content: "Browse and discover government schemes relevant to you.",
      },
    ],
  }),
  component: Schemes,
});

function Schemes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const { data: schemes = [], isLoading } = useQuery({
    queryKey: ["schemes", searchQuery, selectedType, selectedCategory],
    queryFn: () => getSchemes({ 
      data: {
        query: searchQuery, 
        type: selectedType as any, 
        category: selectedCategory || undefined 
      }
    }),

  });

  const categories = useMemo(() => {
    const cats = new Set(schemes.map(s => s.category).filter(Boolean));
    return Array.from(cats);
  }, [schemes]);

  const selectedScheme = useMemo(() => 
    schemes.find(s => s.id === selectedSchemeId), 
    [schemes, selectedSchemeId]
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Scheme Discovery</h1>
          <p className="text-muted-foreground">Find government benefits tailored for you.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={selectedType === "State" ? "default" : "outline"} 
            className="rounded-xl"
            onClick={() => setSelectedType(selectedType === "State" ? null : "State")}
          >
            <Landmark className="mr-2 h-4 w-4" /> State Schemes
          </Button>
          <Button 
            variant={selectedType === "Central" ? "default" : "outline"} 
            className="rounded-xl"
            onClick={() => setSelectedType(selectedType === "Central" ? null : "Central")}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Central Schemes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Filters Sidebar */}
        <aside className="hidden space-y-8 lg:block">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Scheme name..."
                className="pl-9 rounded-xl border-border bg-muted/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
            <div className="flex flex-wrap gap-2">
              {["Energy", "Health", "Education", "Housing", "Farming", "Business"].map((c) => (
                <Badge 
                  key={c} 
                  variant={selectedCategory === c ? "default" : "secondary"} 
                  className="cursor-pointer px-3 py-1 text-[10px] font-medium transition-colors"
                  onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authority</h3>
            <div className="space-y-2">
              {[
                { label: "Central Government", value: "Central" },
                { label: "State Government", value: "State" }
              ].map((a) => (
                <label 
                  key={a.value} 
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  onClick={() => setSelectedType(selectedType === a.value ? null : a.value)}
                >
                  <div className={`h-4 w-4 rounded border border-border flex items-center justify-center ${selectedType === a.value ? 'bg-primary border-primary' : ''}`}>
                    {selectedType === a.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Schemes Grid */}
        <div className="space-y-6">
          {isLoading ? (
             <div className="grid gap-6 md:grid-cols-2">
                {[1,2,3,4].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-muted/20" />
                ))}
             </div>
          ) : schemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-border">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">No schemes found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your search filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {schemes.map((scheme) => (
                <Card key={scheme.id} className="group flex flex-col overflow-hidden border-border transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            scheme.type === "Central" ? "bg-primary/10 text-primary border-primary/20" : "bg-purple-50 text-purple-600 border-purple-100"
                          }>
                            {scheme.type} Govt
                          </Badge>
                          {scheme.verification_status === 'verified' && (
                            <Badge variant="outline" className="bg-success/5 text-success border-success/20 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                          {scheme.name}
                        </h3>
                        <p className="text-[11px] font-medium text-muted-foreground">{scheme.department}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {scheme.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Category</p>
                        <p className="text-xs font-semibold text-foreground">{scheme.category || 'General'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Source</p>
                        <p className="text-xs font-semibold text-foreground truncate">{scheme.official_source}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border bg-muted/20 p-4">
                    <div className="flex w-full gap-2">
                      <Button className="flex-1 rounded-lg" size="sm" asChild>
                        <Link to="/eligibility">Check Eligibility</Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-lg" 
                        size="sm"
                        onClick={() => setSelectedSchemeId(scheme.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && schemes.length > 0 && (
            <div className="flex items-center justify-center pt-4">
              <Button variant="ghost" className="text-muted-foreground">
                Load more schemes <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scheme Detail Dialog */}
      <Dialog open={!!selectedSchemeId} onOpenChange={(open) => !open && setSelectedSchemeId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-3xl border-none">
          {selectedScheme && (
            <>
              <DialogHeader className="p-8 bg-foreground text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary text-white border-none">{selectedScheme.type} Govt</Badge>
                  <Badge variant="outline" className="text-white border-white/20">{selectedScheme.category}</Badge>
                </div>
                <DialogTitle className="text-2xl font-display font-extrabold">{selectedScheme.name}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedScheme.department} {selectedScheme.ministry ? `| ${selectedScheme.ministry}` : ''}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] p-8">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 font-bold text-foreground">
                      <Info className="h-4 w-4 text-primary" /> Description
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedScheme.description}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-bold text-sm">Key Benefits</h4>
                        <p className="text-xs text-muted-foreground">{selectedScheme.benefits}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-bold text-sm">Eligibility</h4>
                        <p className="text-xs text-muted-foreground">{selectedScheme.eligibility_summary}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-foreground">
                      <FileText className="h-4 w-4 text-primary" /> Application Process
                    </h4>
                    <div className="rounded-2xl border border-border p-4 bg-background">
                      <p className="text-sm text-muted-foreground mb-4">{selectedScheme.application_process}</p>
                      {selectedScheme.application_url && (
                        <Button className="w-full rounded-xl" asChild>
                          <a href={selectedScheme.application_url} target="_blank" rel="noopener noreferrer">
                            Visit Application Portal <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedScheme.scheme_requirements && selectedScheme.scheme_requirements.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Required Documents</h4>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {selectedScheme.scheme_requirements
                          .filter((r: any) => r.requirement_type === 'document')
                          .map((r: any) => (
                          <li key={r.id} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded-lg">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            {r.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Verified: {selectedScheme.last_verified_at ? format(new Date(selectedScheme.last_verified_at), 'dd MMM yyyy') : 'Recently'}
                      </div>
                      <a 
                        href={selectedScheme.source_url || '#'} 

                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Landmark className="h-3 w-3" />
                        Source: {selectedScheme.official_source}
                      </a>
                    </div>
                    {selectedScheme.deadline && (
                       <Badge variant="outline" className="w-fit">Deadline: {selectedScheme.deadline}</Badge>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                <Button variant="ghost" onClick={() => setSelectedSchemeId(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
