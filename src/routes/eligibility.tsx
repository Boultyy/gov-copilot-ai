import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  IndianRupee,
  MapPin,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/eligibility")({
  head: () => ({
    meta: [
      { title: "Eligibility Checker | GovCopilot" },
      {
        name: "description",
        content: "Check your eligibility for government schemes in a few simple steps.",
      },
    ],
  }),
  component: Eligibility,
});

const steps = [
  {
    id: "personal",
    title: "Personal Details",
    questions: [
      { id: "age", label: "What is your age?", options: ["Under 18", "18-60", "Above 60"] },
      { id: "gender", label: "Gender", options: ["Male", "Female", "Other"] },
    ],
  },
  {
    id: "economic",
    title: "Economic Status",
    questions: [
      { id: "income", label: "Annual Household Income", options: ["Under ₹3 Lakh", "₹3 Lakh - ₹8 Lakh", "Above ₹8 Lakh"] },
      { id: "category", label: "Caste Category", options: ["General", "OBC", "SC/ST", "EWS"] },
    ],
  },
  {
    id: "residence",
    title: "Residence",
    questions: [
      { id: "area", label: "Area of Residence", options: ["Urban", "Rural"] },
      { id: "state", label: "State", options: ["Delhi", "Maharashtra", "Uttar Pradesh", "Karnataka"] },
    ],
  },
];

function Eligibility() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (showResult) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8 animate-rise">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">You're likely eligible!</h1>
          <p className="text-muted-foreground">Based on your details, you qualify for 3 flagship schemes.</p>
        </div>

        <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-lg">
          <CardHeader className="bg-primary/10 py-4">
            <CardTitle className="text-base text-primary font-bold">Eligibility Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Why you qualify</p>
                <ul className="text-sm space-y-1.5 text-foreground">
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Annual income below threshold</li>
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Residence in rural area</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Primary Benefit</p>
                <div className="flex items-baseline gap-1 text-primary">
                  <span className="text-lg font-bold">₹78,000</span>
                  <span className="text-xs">Solar Subsidy</span>
                </div>
              </div>
            </div>

            <Separator className="bg-primary/20" />

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">Next Steps</h4>
              <div className="space-y-2">
                {[
                  "Prepare Aadhaar and Bank Passbook",
                  "Visit official PM Surya Ghar portal",
                  "Submit rooftop photos and utility bill",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] border-primary/30 text-primary">
                      {i + 1}
                    </Badge>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" size="lg" asChild>
                <Link to="/documents">Start Document Prep</Link>
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" size="lg">
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Eligibility Checker</h1>
        <p className="text-muted-foreground">Answer a few questions to find your matching benefits.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <Card className="animate-rise overflow-hidden border-border shadow-xl">
        <CardHeader className="bg-muted/30 border-b border-border py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {currentStep + 1}
            </Badge>
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {steps[currentStep].questions.map((q) => (
            <div key={q.id} className="space-y-4">
              <Label className="text-base font-bold text-foreground">{q.label}</Label>
              <RadioGroup defaultValue={q.options[0]} className="grid gap-3 sm:grid-cols-2">
                {q.options.map((opt) => (
                  <div key={opt}>
                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="peer sr-only" />
                    <Label
                      htmlFor={`${q.id}-${opt}`}
                      className="flex cursor-pointer items-center justify-center rounded-xl border border-border bg-card p-4 text-sm font-medium transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted/50"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <div className="flex items-center justify-between border-t border-border bg-muted/20 p-4">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="rounded-lg">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleNext} className="rounded-lg px-8">
            {currentStep === steps.length - 1 ? "Check Eligibility" : "Next"} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
