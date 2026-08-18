import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIngestionSources, triggerSourceSync, getIngestionStats } from '@/lib/ingestion.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Shield, Tag, Landmark, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/ingestion')({
  component: IngestionManagementPage,
});

function IngestionManagementPage() {
  const queryClient = useQueryClient();
  
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['ingestion-sources'],
    queryFn: () => getIngestionSources(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['ingestion-stats'],
    queryFn: () => getIngestionStats(),
  });

  const syncMutation = useMutation({
    mutationFn: (sourceId: string) => triggerSourceSync({ data: { sourceId } }),
    onSuccess: (data) => {
      toast.success(`Sync finished: ${data.inserted} new, ${data.updated} updated, ${data.rejected} rejected`);
      queryClient.invalidateQueries({ queryKey: ['ingestion-sources'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  if (sourcesLoading || statsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading system diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''

                                        
                                            
                                            I want you to completely fix the Government Scheme data coverage problem in GovCopilot.

IMPORTANT:

This is now the PRIMARY task.

Do not work on the AI Gateway issue.

Do not modify Citizen Copilot AI.

Do not modify unrelated features.

We have unlimited build credits, so implement a robust production-grade scheme data ingestion architecture rather than adding a handful of manually seeded schemes.</h1>
          <p className="text-muted-foreground mt-2">
            Manage official scheme data ingestion sources and synchronization pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Last Global Sync:</span>
          <span className="font-bold">{stats?.lastSync?.created_at ? format(new Date(stats.lastSync.created_at), 'MMM d, HH:mm') : 'Never'}</span>
        </div>
      </div>

      {/* System Health & Data Coverage */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70 font-bold text-[10px] uppercase tracking-widest">Total Verified Schemes</CardDescription>
            <CardTitle className="text-4xl font-display">{stats?.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-primary/60 font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              Active in Discovery
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Verification Status</CardDescription>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display">
                {stats?.status.find((s: any) => s.status === 'pending_verification')?.count || 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Pending Review</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
               <div 
                className="bg-amber-500 h-full" 
                style={{ 
                  width: `${stats?.total ? 
                    ((stats.status.find((s: any) => s.status === 'pending_verification')?.count || 0) / 
                    (stats.total + (stats.status.find((s: any) => s.status === 'pending_verification')?.count || 0)) * 100) 
                    : 0}%` 
                }} 
               />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Authority Breakdown</CardDescription>
            <div className="flex gap-4 mt-1">
              <div>
                <span className="text-xl font-bold font-display block">
                  {stats?.levels.find((l: any) => l.level === 'Central')?.count || 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Central</span>
              </div>
              <div>
                <span className="text-xl font-bold font-display block">
                  {stats?.levels.find((l: any) => l.level === 'State')?.count || 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">State/UT</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Landmark className="h-3 w-3" />
              Jurisdiction mix
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Category Coverage</CardDescription>
            <CardTitle className="text-2xl font-display mt-1">{stats?.categories.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate">
              <Tag className="h-3.5 w-3.5" />
              {stats?.categories.slice(0, 2).map((c: any) => c.category).join(", ")}...
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Ingestion Pipelines
            </h2>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">
              {sources?.length || 0} Active Sources
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {sources?.map((source) => (
              <Card key={source.id} className="relative overflow-hidden border-sidebar-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {source.last_sync_status === 'success' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle className="h-3 w-3" />
                          Synced
                        </span>
                      ) : source.last_sync_status === 'failed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/5 px-2 py-0.5 rounded-full border border-destructive/10">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-muted-foreground/10">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">{source.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{source.base_url || 'Manual Source'}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-tight">Source Type</p>
                      <p className="font-medium mt-0.5 capitalize">{source.source_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-tight">Last Sync</p>
                      <p className="font-medium mt-0.5">
                        {source.last_sync_at ? format(new Date(source.last_sync_at), 'MMM d, HH:mm') : 'Never'}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => syncMutation.mutate(source.id)} 
                    disabled={syncMutation.isPending}
                    className="w-full gap-2 mt-2"
                    variant={source.last_sync_status === 'failed' ? 'destructive' : 'default'}
                  >
                    {syncMutation.isPending && syncMutation.variables === source.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync Now
                  </Button>
                </CardContent>
                
                {source.last_sync_error && (
                  <div className="bg-destructive/5 px-4 py-2 border-t border-destructive/10">
                    <p className="text-[10px] text-destructive font-mono truncate">{source.last_sync_error}</p>
                  </div>
                )}
              </Card>
            ))}

            <Card className="flex flex-col items-center justify-center border-dashed border-2 p-6 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <RefreshCw className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-muted-foreground">Add New Source</h3>
              <p className="text-sm text-center text-muted-foreground mt-1 max-w-[200px]">
                Connect to official government datasets or APIs.
              </p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Category Mix
          </h2>
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-4">
              {stats?.categories.map((c: any) => (
                <div key={c.category} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{c.category}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${(c.count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats?.categories.length === 0 && (
                <div className="text-center py-8">
                  <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">No category data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                Data Integrity Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Only records marked as <strong>Verified</strong> are visible in the public Citizen Copilot and Scheme Discovery. 
                Use the <a href="/admin/verification" className="text-primary hover:underline">Verification Dashboard</a> to review pending imports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
