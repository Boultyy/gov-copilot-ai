import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Calendar,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Application Tracker | GovCopilot" },
      {
        name: "description",
        content: "Track the status of your government applications in real-time.",
      },
    ],
  }),
  component: Applications,
});

const myApplications = [
  {
    id: "APP-8829-X",
    scheme: "PM Surya Ghar: Muft Bijli Yojana",
    status: "Documents Verified",
    progress: 40,
    lastUpdate: "2 days ago",
    dept: "Ministry of New & Renewable Energy",
    timeline: [
      { stage: "Application Submitted", date: "10 Mar 2025", status: "completed" },
      { stage: "Documents Verified", date: "12 Mar 2025", status: "current" },
      { stage: "Department Review", date: "Pending", status: "upcoming" },
      { stage: "Final Approval", date: "Pending", status: "upcoming" },
    ],
  },
];

function Applications() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Application Tracker</h1>
          <p className="text-muted-foreground">Monitor your active service requests and benefit disbursals.</p>
        </div>
        <Button className="rounded-xl">Track New ID</Button>
      </div>

      <div className="grid gap-8">
        {myApplications.map((app) => (
          <Card key={app.id} className="animate-rise overflow-hidden border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      ID: {app.id}
                    </Badge>
                    <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                      <Clock className="mr-1.5 h-3 w-3" /> {app.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-xl font-bold">{app.scheme}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3 w-3" /> {app.dept}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Completion</p>
                  <p className="font-display text-lg font-bold text-foreground">24 Mar 2025</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Timeline Visual */}
                <div className="relative">
                  <div className="absolute top-5 left-0 w-full h-0.5 bg-muted" />
                  <div className="relative flex justify-between">
                    {app.timeline.map((step, i) => (
                      <div key={step.stage} className="flex flex-col items-center gap-3 text-center">
                        <div className={cn(
                          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background transition-all",
                          step.status === "completed" ? "bg-success text-white" : 
                          step.status === "current" ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : 
                          "bg-muted text-muted-foreground"
                        )}>
                          {step.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : 
                           step.status === "current" ? <Clock className="h-5 w-5" /> : 
                           <div className="h-2 w-2 rounded-full bg-current" />}
                        </div>
                        <div className="space-y-1 px-2">
                          <p className={cn("text-[10px] font-bold uppercase tracking-tight", 
                            step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {step.stage}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-background p-2 shadow-sm">
                      <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Latest Update</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your physical documents were successfully verified at the District Revenue Office. Your file has been moved to the Department Review stage.
                      </p>
                      <Button variant="link" className="p-0 h-auto text-xs text-primary mt-2">
                        View verification report <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="rounded-xl" variant="outline">Message Department</Button>
                  <Button className="rounded-xl" variant="ghost">Report Issue</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
