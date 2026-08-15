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
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { services } from "@/lib/demo-data";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow Copilot | GovCopilot" },
      {
        name: "description",
        content:
          "Search any government service and get step-by-step procedure, required documents, official timeline and a live readiness checklist.",
      },
      { property: "og:title", content: "Workflow Copilot | GovCopilot" },
      {
        property: "og:description",
        content: "Step-by-step government service procedures, documents and timelines.",
      },
    ],
  }),
  component: Workflow,
});

function Workflow() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(services[0].id);
  const [done, setDone] = useState<string[]>([]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 02"
        title="Workflow Copilot"
        description="Find any citizen service and follow the exact official procedure."
        icon={<RouteIcon className="h-6 w-6" />}
      />

      <div className="relative animate-rise">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a service — income certificate, trade license, land mutation…"
          className="h-12 rounded-2xl pl-11 text-sm shadow-[var(--shadow-card)]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-2">
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
              No matching service. Try “license” or “pension”.
            </p>
          )}
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
                  <m.icon className="h-5 w-5 shrink-0 text-primary" />
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

          <Card className="animate-rise">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Step-by-step procedure</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-6">
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
                    <p className="mt-0.5 text-sm text-muted-foreground">{st.detail}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="animate-rise">
              <CardHeader className="flex-row items-center gap-2 pb-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Required documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {active.documents.map((d) => (
                  <p key={d} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {d}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-rise">
              <CardHeader className="pb-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <CardTitle className="text-base">Readiness checklist</CardTitle>
                  <Badge className="shrink-0">{progress}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary shadow-[0_0_8px_oklch(0.48_0.18_260/0.4)] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {active.checklist.map((c) => (
                  <label key={c} className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox
                      checked={done.includes(c)}
                      onCheckedChange={(v) =>
                        setDone((prev) => (v ? [...prev, c] : prev.filter((x) => x !== c)))
                      }
                      className="mt-0.5"
                    />
                    <span className={done.includes(c) ? "text-muted-foreground line-through" : ""}>
                      {c}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
