import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Landmark,
  FileSearch,
  PenLine,
  ChevronRight,
  Clock,
  MessageSquare,
  AlertCircle,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "GovCopilot | Your AI Copilot for Government Services" },
      {
        name: "description",
        content: "Discover government schemes, check eligibility, prepare documents and track applications with AI-powered assistance.",
      },
    ],
  }),
  component: LandingDashboard,
});

function LandingDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-12 pb-12 animate-in fade-in duration-500">
        <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = data && (data.stats.applications > 0 || data.stats.documents > 0);

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-16 text-center sm:px-12 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.6_0.2_260/0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl space-y-8">
          <Badge className="bg-primary/20 text-primary-foreground border-primary/30 py-1.5 px-4 rounded-full">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Empowering Citizens with Digital India
          </Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Welcome back, <span className="text-primary-glow">Citizen</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            {hasData 
              ? `You have ${data.stats.applications} active applications and ${data.stats.documents} documents indexed.`
              : "Discover schemes, understand eligibility, and manage your government documents in one unified workspace."
            }
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/20" asChild>
              <Link to="/schemes">Find Government Schemes</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full border-slate-700 bg-transparent px-8 text-base text-white hover:bg-slate-800" asChild>
              <Link to="/copilot">Ask Copilot</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "My Applications",
            value: data?.stats.applications || 0,
            desc: `${data?.stats.pendingReview || 0} under review`,
            icon: Landmark,
            link: "/workflow",
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            title: "Documents",
            value: data?.stats.documents || 0,
            desc: "Ready for processing",
            icon: FileSearch,
            link: "/documents",
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            title: "Saved Schemes",
            value: data?.savedSchemes.length || 0,
            desc: "Relevant to profile",
            icon: ShieldCheck,
            link: "/schemes",
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            title: "AI Conversations",
            value: data?.recentConversations.length || 0,
            desc: "Recent chat activity",
            icon: MessageSquare,
            link: "/copilot",
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-border">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className={`rounded-2xl ${stat.bg} p-3 transition-colors group-hover:bg-primary/10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} group-hover:text-primary`} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-display font-black text-foreground mt-1">{stat.value}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Activity & Conversations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Applications/Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/workflow">View All</Link>
              </Button>
            </div>
            <Card className="rounded-2xl border-border">
              <CardContent className="p-0">
                {data?.activity.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground italic">No recent activity found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {data?.activity.map((act: any) => (
                      <div key={act.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{act.action}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(act.created_at))} ago
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {act.entity_type || 'System'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Recent Conversations */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Copilot Chats
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data?.recentConversations.length === 0 ? (
                <Card className="sm:col-span-2 border-dashed border-border bg-transparent p-6 text-center">
                  <p className="text-sm text-muted-foreground italic">Start your first AI consultation to see it here.</p>
                </Card>
              ) : (
                data?.recentConversations.map((conv: any) => (
                  <Link key={conv.id} to="/copilot" search={{ id: conv.id }}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                          {conv.title || 'Ongoing Consultation'}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(conv.updated_at))} ago</span>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Alerts & Saved Schemes */}
        <div className="space-y-8">
          {/* Important Alerts */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Notifications
            </h2>
            <div className="space-y-3">
              {data?.alerts.map((alert: any) => (
                <div key={alert.id} className={`p-4 rounded-2xl border-l-4 ${
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                }`}>
                  <h4 className="text-sm font-bold text-foreground">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Suggested Schemes */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Saved Schemes
            </h2>
            <div className="space-y-3">
              {data?.savedSchemes.map((scheme: any) => (
                <Link key={scheme.id} to="/schemes" search={{ id: scheme.id }}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary font-bold shadow-sm">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">{scheme.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{scheme.department}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              <Button variant="outline" className="w-full rounded-xl text-xs py-5" asChild>
                <Link to="/schemes">Discover More Schemes</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Trust Indicator Footer */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Official government information assistant powered by AI</span>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Data sourced from National Portal of India. Last updated: August 2026
        </p>
      </footer>
    </div>
  );
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
