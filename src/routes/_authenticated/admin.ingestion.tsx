import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIngestionSources, triggerSourceSync } from '@/lib/ingestion.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Route = createFileRoute('/admin/ingestion')({
  component: IngestionManagementPage,
});

function IngestionManagementPage() {
  const queryClient = useQueryClient();
  
  const { data: sources, isLoading } = useQuery({
    queryKey: ['ingestion-sources'],
    queryFn: () => getIngestionSources(),
  });

  const syncMutation = useMutation({
    mutationFn: (sourceId: string) => triggerSourceSync({ sourceId }),
    onSuccess: (data) => {
      toast.success(`Sync successful: Processed ${data.processed} records`);
      queryClient.invalidateQueries({ queryKey: ['ingestion-sources'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Government Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage official scheme data ingestion sources and synchronization pipelines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
