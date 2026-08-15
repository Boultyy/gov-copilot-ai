import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Landmark,
  FileSearch,
  PenLine,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
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

const featuredServices = [
  {
    title: "Income Certificate",
    dept: "Revenue Department",
    tag: "Popular",
    icon: FileSearch,
  },
  {
    title: "PMAY Housing",
    dept: "Ministry of Housing",
    tag: "New",
    icon: Landmark,
  },
  {
    title: "Trade License",
    dept: "Urban Development",
    tag: "Business",
    icon: PenLine,
  },
  {
    title: "Pension Scheme",
    dept: "Social Welfare",
    tag: "Social",
    icon: ShieldCheck,
  },
];

function LandingDashboard() {
  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-20 text-center sm:px-12 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.6_0.2_260/0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl space-y-8">
          <Badge className="bg-primary/20 text-primary-foreground border-primary/30 py-1.5 px-4 rounded-full">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Empowering Citizens with Digital India
          </Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Your AI Copilot for <span className="text-primary-glow">Government Services</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            Discover schemes, understand eligibility, prepare documents, and track your applications in one unified workspace.
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

      {/* Feature Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Discover Schemes",
            desc: "Browse 500+ Central and State government schemes.",
            icon: Landmark,
            link: "/schemes",
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            title: "Check Eligibility",
            desc: "Instantly find out if you qualify for specific benefits.",
            icon: ShieldCheck,
            link: "/eligibility",
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            title: "Document Assistant",
            desc: "AI-powered help with document prep and verification.",
            icon: FileSearch,
            link: "/documents",
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            title: "Application Tracker",
            desc: "Real-time updates on your pending applications.",
            icon: RouteIcon,
            link: "/applications",
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((feature) => (
          <Link key={feature.title} to={feature.link}>
            <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className={`rounded-2xl ${feature.bg} p-3 transition-colors group-hover:bg-primary/10`}>
                  <feature.icon className={`h-6 w-6 ${feature.color} group-hover:text-primary`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                </div>
                <div className="mt-auto flex items-center text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Explore <ChevronRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Popular Services Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Popular Services</h2>
            <p className="text-sm text-muted-foreground">Most accessed citizen services this week</p>
          </div>
          <Button variant="link" className="text-primary" asChild>
            <Link to="/schemes">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service) => (
            <Card key={service.title} className="group cursor-pointer border-transparent bg-muted/40 transition-colors hover:border-primary/20 hover:bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-background p-2.5 shadow-sm group-hover:text-primary">
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-foreground">{service.title}</h4>
                  <p className="truncate text-[11px] text-muted-foreground">{service.dept}</p>
                </div>
                <Badge variant="secondary" className="bg-background text-[10px] font-bold uppercase tracking-tight">
                  {service.tag}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="rounded-[2.5rem] bg-muted/30 px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-foreground">How GovCopilot Works</h2>
          <p className="mt-4 text-muted-foreground">Three simple steps to access your government benefits</p>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {[
              { step: "01", title: "Tell us what you need", desc: "Use the AI search to describe your requirement in plain language." },
              { step: "02", title: "Copilot finds services", desc: "Our AI maps your needs to the most relevant government schemes." },
              { step: "03", title: "Apply with confidence", desc: "Follow step-by-step guides to complete your application correctly." },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <span className="font-display text-6xl font-black text-primary/5">{s.step}</span>
                <div className="relative -mt-8 space-y-2">
                  <h4 className="font-bold text-foreground">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicator Footer */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Official government information assistant powered by AI</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Data sourced from National Portal of India. Last updated: March 2025
        </p>
      </footer>
    </div>
  );
}

// Simple internal icon mapper if needed, but imported lucide icons are better
const RouteIcon = (props: any) => <Landmark {...props} />;
