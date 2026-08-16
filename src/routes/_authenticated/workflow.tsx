import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Route as RouteIcon,
  Search,
  Plus,
  History,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/lib/demo-data";
import { 
  getApplications, 
  createApplication, 
  updateApplicationStatus, 
  deleteApplication 
} from "@/lib/workflow.functions";

export const Route = createFileRoute("/_authenticated/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow Copilot | GovCopilot" },
      {
        name: "description",
        content:
          "Search government services, track applications and get live status updates with historical events.",
      },
      { property: "og:title", content: "Workflow Copilot | GovCopilot" },
      {
        property: "og:description",
        content: "Track your government applications and follow procedures step-by-step.",
      },
    ],
  }),
  component: Workflow,
});

function Workflow() {
  const queryClient = useQueryClient();
  const getAppsFn = useServerFn(getApplications);
  const createAppFn = useServerFn(createApplication);
  const updateStatusFn = useServerFn(updateApplicationStatus);
  const deleteAppFn = useServerFn(deleteApplication);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(services[0].id);
  const [done, setDone] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newApp, setNewApp] = useState({
    external_app_id: "",
    status: "submitted" as any,
    department: "",
    notes: "",
  });

  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ["applications"],
    queryFn: () => getAppsFn(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createAppFn({ data }),
    onSuccess: () => {
      toast.success("Application added successfully");
      setIsAdding(false);
      setNewApp({ external_app_id: "", status: "submitted", department: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: () => toast.error("Failed to add application")
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string; notes?: string }) => updateStatusFn({ data }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: () => toast.error("Update failed")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAppFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Application removed");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: () => toast.error("Delete failed")
  });

  const results = useMemo(
    () =>
      services.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.department.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const active = services.find((s) => s.id === activeId)!;
  const progress = Math.round((done.length / active.checklist.length) * 100);

  const handleAddApplication = () => {
    createMutation.mutate({
      ...newApp,
      service_id: active.id,
      department: active.department,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 02"
        title="Workflow Copilot"
        description="Find any citizen service, follow official procedures, and track your live applications."
        icon={<RouteIcon className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 animate-rise">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a service — income certificate, trade license, land mutation…"
            className="h-12 rounded-2xl pl-11 text-sm shadow-[var(--shadow-card)]"
          />
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-12 gap-2 rounded-2xl px-6 shadow-md">
              <Plus className="h-4 w-4" />
              Track New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Track Application</DialogTitle>
              <DialogDescription>
                Add an existing government application to your tracker.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service</label>
                <Input value={active.name} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Reference Number</label>
                <Input 
                  placeholder="e.g. APP/2024/9912" 
                  value={newApp.external_app_id}
                  onChange={e => setNewApp(prev => ({ ...prev, external_app_id: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Initial Status</label>
                <Select 
                  value={newApp.status} 
                  onValueChange={v => setNewApp(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="documents_required">Documents Required</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea 
                  placeholder="Any private notes about this application..." 
                  value={newApp.notes}
                  onChange={e => setNewApp(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAdding(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddApplication} 
                disabled={!newApp.external_app_id || createMutation.isPending}
                className="cursor-pointer"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Tracker
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="animate-rise h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick select service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    setDone([]);
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-300 hover:shadow-md ${
                    s.id === activeId
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.department}</p>
                </button>
              ))}
              {results.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No matching service.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-rise">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active trackers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingApps ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : applications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">No applications tracked yet.</p>
                </div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="group relative rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {app.status.replace('_', ' ')}
                      </Badge>
                      <button 
                        onClick={() => deleteMutation.mutate(app.id)}
                        className="invisible cursor-pointer text-muted-foreground transition-colors hover:text-destructive group-hover:visible"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold">{app.service?.name || app.scheme?.name || 'Service'}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {app.external_app_id}</p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex -space-x-1">
                        {app.events?.slice(0, 3).map((e: any, i: number) => (
                          <div key={i} title={e.stage} className="h-1 w-4 rounded-full bg-success/40" />
                        ))}
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        Updated {new Date(app.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Landmark, label: "Department", value: active.department },
              { icon: CalendarClock, label: "Timeline", value: active.timeline },
              { icon: CircleDollarSign, label: "Fee", value: active.fee },
            ].map((m) => (
              <Card key={m.label} className="animate-rise border-border/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <m.icon className="h-5 w-5 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="truncate text-sm font-semibold">{m.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="animate-rise overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-3">
              <CardTitle className="text-base">Live procedure & status</CardTitle>
              {applications.some(a => a.service_id === active.id) && (
                <Badge className="bg-success/20 text-success hover:bg-success/30 border-none">
                  Tracked
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[1fr_300px]">
                <div className="border-r border-border/50 p-6">
                  <h4 className="mb-6 text-sm font-semibold">Step-by-step guidance</h4>
                  <ol className="relative space-y-6 border-l border-border pl-6">
                    {active.steps.map((st, i) => (
                      <li key={st.title} className="relative">
                        <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg shadow-primary/20">
                          {i + 1}
                        </span>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <p className="min-w-0 text-sm font-semibold text-foreground">{st.title}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {st.days}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{st.detail}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                
                <div className="bg-muted/10 p-6">
                  <div className="mb-6 flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Application History</h4>
                  </div>
                  
                  {applications.find(a => a.service_id === active.id) ? (
                    <div className="space-y-6">
                      {applications.find(a => a.service_id === active.id).events?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((event: any, i: number) => (
                        <div key={i} className="relative pl-4">
                          <div className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${i === 0 ? 'bg-primary ring-4 ring-primary/10' : 'bg-muted-foreground/30'}`} />
                          {i !== (applications.find(a => a.service_id === active.id).events.length - 1) && (
                            <div className="absolute left-[3px] top-4 h-full w-[2px] bg-border/50" />
                          )}
                          <p className="text-xs font-semibold capitalize">{event.stage.replace('_', ' ')}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                          {event.notes && <p className="mt-1 text-[10px] italic text-muted-foreground">"{event.notes}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center text-center">
                      <CalendarClock className="h-8 w-8 text-muted-foreground/30" />
                      <p className="mt-2 text-xs text-muted-foreground">Select or start a tracker to see history.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="animate-rise border-border/50">
              <CardHeader className="flex-row items-center gap-2 border-b border-border/50 pb-3">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Document requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {active.documents.map((d) => (
                  <div key={d} className="flex gap-3 rounded-lg border border-transparent bg-muted/30 p-2 transition-all hover:border-border hover:bg-card">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-xs font-medium text-foreground/80">{d}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-rise border-border/50">
              <CardHeader className="flex-row items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Readiness</CardTitle>
                </div>
                <Badge className="bg-primary/10 text-primary border-none">{progress}% Complete</Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary shadow-[0_0_8px_oklch(0.48_0.18_260/0.4)] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {active.checklist.map((c) => (
                    <label key={c} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/30">
                      <Checkbox
                        checked={done.includes(c)}
                        onCheckedChange={(v) =>
                          setDone((prev) => (v ? [...prev, c] : prev.filter((x) => x !== c)))
                        }
                        className="mt-0.5"
                      />
                      <span className={`text-xs ${done.includes(c) ? "text-muted-foreground line-through" : "text-foreground/80 font-medium"}`}>
                        {c}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
