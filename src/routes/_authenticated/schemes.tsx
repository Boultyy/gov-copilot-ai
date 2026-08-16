import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  Landmark,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Scheme Discovery | GovCopilot" },
      {
        name: "description",
        content: "Browse and discover government schemes relevant to you.",
      },
    ],
  }),
  component: Schemes,
});

const mockSchemes = [
  {
    id: 1,
    name: "PM Surya Ghar: Muft Bijli Yojana",
    dept: "Ministry of New & Renewable Energy",
    desc: "Provides up to 300 units of free electricity monthly through rooftop solar installation with government subsidy.",
    status: "Eligible",
    benefits: "Rs. 78,000 max subsidy",
    deadline: "Open Application",
    type: "Central",
  },
  {
    id: 2,
    name: "Ayushman Bharat PM-JAY",
    dept: "National Health Authority",
    desc: "World's largest health insurance scheme providing a cover of Rs. 5 lakh per family per year for secondary and tertiary care.",
    status: "May be eligible",
    benefits: "Rs. 5 Lakh health cover",
    deadline: "Ongoing",
    type: "Central",
  },
  {
    id: 3,
    name: "Lakhpati Didi Initiative",
    dept: "Ministry of Rural Development",
    desc: "Empowering women in Self Help Groups (SHGs) to earn an annual income of Rs. 1 lakh or more through skill training.",
    status: "Eligible",
    benefits: "Skill training & financial tools",
    deadline: "FY 2024-25",
    type: "Central",
  },
  {
    id: 4,
    name: "State Housing Scheme",
    dept: "State Housing Board",
    desc: "Affordable housing for Low Income Groups (LIG) and Economically Weaker Sections (EWS) in urban areas.",
    status: "Not eligible",
    benefits: "Subsidized home rates",
    deadline: "30 April 2025",
    type: "State",
  },
];

function Schemes() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Scheme Discovery</h1>
          <p className="text-muted-foreground">Find government benefits tailored for you.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button className="rounded-xl">
            <Landmark className="mr-2 h-4 w-4" /> State Schemes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Filters Sidebar */}
        <aside className="hidden space-y-8 lg:block">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Scheme name..."
                className="pl-9 rounded-xl border-border bg-muted/30"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
            <div className="flex flex-wrap gap-2">
              {["Education", "Housing", "Health", "Farming", "Business"].map((c) => (
                <Badge key={c} variant="secondary" className="cursor-pointer bg-muted/50 px-3 py-1 text-[10px] font-medium transition-colors hover:bg-primary hover:text-white">
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authority</h3>
            <div className="space-y-2">
              {["Central Government", "State Government"].map((a) => (
                <label key={a} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <div className="h-4 w-4 rounded border border-border" />
                  {a}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Schemes Grid */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {mockSchemes.map((scheme) => (
              <Card key={scheme.id} className="group flex flex-col overflow-hidden border-border transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          scheme.type === "Central" ? "bg-primary/10 text-primary border-primary/20" : "bg-purple-50 text-purple-600 border-purple-100"
                        }>
                          {scheme.type} Govt
                        </Badge>
                        <Badge variant="outline" className={
                          scheme.status === "Eligible" ? "bg-success/5 text-success border-success/20" :
                          scheme.status === "May be eligible" ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-destructive/5 text-destructive border-destructive/20"
                        }>
                          {scheme.status}
                        </Badge>
                      </div>
                      <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                        {scheme.name}
                      </h3>
                      <p className="text-[11px] font-medium text-muted-foreground">{scheme.dept}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {scheme.desc}
                  </p>
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Benefits</p>
                      <p className="text-xs font-semibold text-foreground">{scheme.benefits}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Deadline</p>
                      <p className="text-xs font-semibold text-foreground">{scheme.deadline}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 p-4">
                  <div className="flex w-full gap-2">
                    <Button className="flex-1 rounded-lg" size="sm" asChild>
                      <Link to="/eligibility">Check Eligibility</Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-lg" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center pt-4">
            <Button variant="ghost" className="text-muted-foreground">
              Load more schemes <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
