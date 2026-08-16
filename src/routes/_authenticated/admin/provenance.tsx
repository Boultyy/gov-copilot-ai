import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getProvenanceAudit } from '@/lib/verification.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Database, 
  Globe, 
  Building2, 
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute('/_authenticated/admin/provenance')({
  component: ProvenanceAuditDashboard,
});

function ProvenanceAuditDashboard() {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['provenance-audit'],
    queryFn: () => getProvenanceAudit(),
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Database className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { auditResults, stats } = auditData || { auditResults: [], stats: null };

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Data Provenance Audit</h1>
        <p className="text-muted-foreground mt-2">
          Strict verification of government scheme sources and data trustworthiness.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Schemes</CardDescription>
            <CardTitle className="text-2xl">{stats?.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{stats?.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Verification</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats?.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-2xl text-slate-600">{stats?.archived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Jurisdiction & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Central Govt:</span>
                <span className="font-bold">{stats?.central}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">State/UT:</span>
                <span className="font-bold">{stats?.stateUt}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded border-emerald-500/20 border">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-bold text-emerald-600">{stats?.active}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded border-slate-500/20 border">
                <span className="text-muted-foreground">Inactive:</span>
                <span className="font-bold text-slate-600">{stats?.inactive}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Category Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(stats?.categories || {}).map(([cat, count]) => (
                <div key={cat} className="flex justify-between p-2 border rounded capitalize">
                  <span className="text-muted-foreground">{cat}:</span>
                  <span className="font-bold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Audit Records
          </CardTitle>
          <CardDescription>
            Detailed provenance check for every scheme in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provenance Complete</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Gov Level</TableHead>
                <TableHead>Last Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditResults.map((result: any) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {result.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.verification === 'verified' ? 'default' : 'secondary'} className="capitalize whitespace-nowrap">
                      {result.verification.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {result.provenanceComplete === 'YES' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className={result.provenanceComplete === 'YES' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                        {result.provenanceComplete}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-[250px]">
                      <span className="text-xs font-semibold truncate">{result.source}</span>
                      {result.sourceUrl !== 'None' && (
                        <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 truncate">
                          <Globe className="h-2 w-2" /> {result.sourceUrl}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{result.govLevel}</TableCell>
                  <TableCell className="text-[10px] whitespace-nowrap">
                    {result.lastVerified ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-2 w-2" />
                        {format(new Date(result.lastVerified), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Never verified</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-amber-900 dark:text-amber-100">Audit Guidelines</p>
          <p className="text-amber-800 dark:text-amber-200 mt-1">
            Schemes marked as <Badge variant="secondary" className="scale-75 origin-left">pending verification</Badge> with <span className="font-bold">Provenance Complete: NO</span> require manual review of the official source URL and comparison against the normalized metadata before being authorized for public discovery.
          </p>
        </div>
      </div>
    </div>
  );
}
