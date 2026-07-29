import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Lightbulb,
  Download,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  aiInsights,
  casesByMonth,
  grievanceByDept,
  grievanceStatus,
  kpis,
  recentActivity,
} from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Decision Intelligence Dashboard | GovCopilot" },
      {
        name: "description",
        content:
          "Live KPIs, pending cases, citizen grievance analytics and AI insights for district administration in one government dashboard.",
      },
      { property: "og:title", content: "Decision Intelligence Dashboard | GovCopilot" },
      {
        property: "og:description",
        content: "KPIs, grievance analytics and AI insights for district administration.",
      },
    ],
  }),
  component: Dashboard,
});

const pieColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 04"
        title="Decision Intelligence Dashboard"
        description="District-level performance, grievances and AI-generated recommendations."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <Button variant="outline" className="shrink-0 rounded-full">
            <Download className="mr-2 h-4 w-4" /> Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Card
            key={k.label}
            className="animate-rise gradient-surface border-border shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{k.value}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                    k.trend === "up"
                      ? "bg-success/15 text-success"
                      : "bg-primary/12 text-primary"
                  }`}
                >
                  {k.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {k.delta}
                </span>
                <span className="text-muted-foreground">{k.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-rise lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cases filed vs disposed</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={casesByMonth} margin={{ left: 8, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="filed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="disposed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={46} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="filed"
                  stroke="var(--color-chart-1)"
                  fill="url(#filed)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="disposed"
                  stroke="var(--color-chart-3)"
                  fill="url(#disposed)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grievance status</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={grievanceStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {grievanceStatus.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-4 flex flex-wrap justify-center gap-3">
              {grievanceStatus.map((g, i) => (
                <span key={g.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  {g.name} {g.value}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grievances by department</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grievanceByDept} margin={{ left: 8, right: 12, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={46} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-rise lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">AI insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((ins) => (
              <div
                key={ins.title}
                className="rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-accent/50"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <p className="min-w-0 font-semibold text-foreground">{ins.title}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {ins.tag}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{ins.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-rise">
        <CardHeader className="flex-row items-center gap-2 pb-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.map((a, i) => (
            <div key={a.what}>
              {i > 0 && <Separator />}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{a.what}</p>
                  <p className="text-xs text-muted-foreground">{a.who}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.when}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
