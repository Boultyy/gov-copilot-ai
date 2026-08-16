import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingSchemes, verifyScheme, getVerificationLogs } from '@/lib/verification.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  History, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  FileEdit,
  Archive,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/admin/verification')({
  component: VerificationDashboard,
});

function VerificationDashboard() {
  const queryClient = useQueryClient();
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const { data: pendingSchemes, isLoading } = useQuery({
    queryKey: ['pending-schemes'],
    queryFn: () => getPendingSchemes(),
  });

  const verifyMutation = useMutation({
    mutationFn: (vars: { schemeId: string, action: "approve" | "reject" | "archive" | "re-verify", notes?: string }) => 
      verifyScheme({ data: vars }),
    onSuccess: () => {
      toast.success('Action successful');
      queryClient.invalidateQueries({ queryKey: ['pending-schemes'] });
      setSelectedScheme(null);
      setNotes('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Scheme Verification Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Review and authorize imported government scheme data before it is published to the public portal.
        </p>
      </div>

      <div className="grid gap-6">
        {pendingSchemes?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Queue Clean</h3>
            <p className="text-muted-foreground">No schemes currently pending verification.</p>
          </Card>
        ) : (
          pendingSchemes?.map((scheme) => (
            <Card key={scheme.id} className="overflow-hidden border-sidebar-border bg-card transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{scheme.government_level}</Badge>
                        <Badge variant="secondary" className="capitalize">{(scheme.verification_status || 'draft').replace('_', ' ')}</Badge>
                        {scheme.scheme_change_history?.length > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Changes Detected
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold">{scheme.official_name || scheme.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {scheme.ministry} {scheme.state_ut ? `• ${scheme.state_ut}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Imported</span>
                      <span>{format(new Date(scheme.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Source</span>
                      <span className="flex items-center gap-1">
                        {scheme.source_name}
                        {scheme.official_source && (
                          <a href={scheme.official_source} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Category</span>
                      <span>{scheme.category || 'Uncategorized'}</span>
                    </div>
                  </div>

                  {scheme.scheme_change_history?.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-sidebar-border">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                        <History className="h-3 w-3" /> Field Changes
                      </p>
                      <div className="space-y-2">
                        {scheme.scheme_change_history.slice(0, 3).map((change: any) => (
                          <div key={change.id} className="text-xs flex items-center gap-2">
                            <span className="font-semibold w-24 truncate">{change.field_name}:</span>
                            <span className="text-muted-foreground line-clamp-1 flex-1">{change.old_value || 'None'}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="text-primary font-medium line-clamp-1 flex-1">{change.new_value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:w-64 border-t md:border-t-0 md:border-l border-sidebar-border bg-muted/5 p-6 flex flex-col justify-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" className="w-full gap-2" onClick={() => setSelectedScheme(scheme)}>
                        <Eye className="h-4 w-4" /> Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Verification Review: {scheme.official_name}</DialogTitle>
                        <DialogDescription>
                          Inspect normalized data and source provenance before authorizing.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="pr-4 py-4 max-h-[50vh]">
                        <div className="space-y-6">
                          <section>
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Core Identity</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-muted-foreground">Official Name</label>
                                <p className="text-sm font-medium">{scheme.official_name}</p>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Ministry</label>
                                <p className="text-sm font-medium">{scheme.ministry}</p>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Description & Benefits</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-muted-foreground">Description</label>
                                <p className="text-sm bg-muted/30 p-2 rounded">{scheme.description}</p>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Benefits</label>
                                <p className="text-sm">{scheme.benefits || 'No benefits data provided'}</p>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Ingestion Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-muted-foreground">Import Source</label>
                                <p className="text-sm">{scheme.source_name} ({scheme.source_type})</p>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Source URL</label>
                                <a href={scheme.official_source} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1">
                                  View Original <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </section>
                        </div>
                      </ScrollArea>

                      <div className="space-y-3 pt-4 border-t">
                        <label className="text-sm font-medium">Reviewer Notes</label>
                        <Textarea 
                          placeholder="Add verification notes, reasons for rejection, or compliance notes..." 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => verifyMutation.mutate({ schemeId: scheme.id, action: 're-verify', notes })}>
                          Request Re-verification
                        </Button>
                        <Button variant="destructive" onClick={() => verifyMutation.mutate({ schemeId: scheme.id, action: 'reject', notes })}>
                          Reject
                        </Button>
                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => verifyMutation.mutate({ schemeId: scheme.id, action: 'approve', notes })}>
                          Approve & Publish
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full gap-2" onClick={() => verifyMutation.mutate({ schemeId: scheme.id, action: 'archive', notes: 'Manually archived during review' })}>
                    <Archive className="h-4 w-4" /> Archive
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
