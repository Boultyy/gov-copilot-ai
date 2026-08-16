import { useState, useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Info,
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSchemeById } from "@/lib/schemes.functions";
import { evaluateEligibility } from "@/lib/eligibility.functions";
import { z } from "zod";
import { format } from "date-fns";

const eligibilitySearchSchema = z.object({
  schemeId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/eligibility/")({
  component: EligibilityPage,
});

function EligibilityPage() {
  const search = useSearch({ strict: false }) as any;
  const schemeId = search.schemeId;
  const [step, setStep] = useState(schemeId ? "form" : "select");
  
  const [formData, setFormData] = useState({
    age: "",
    state: "",
    income: "",
    occupation: "",
    gender: "",
    category: "",
    isFarmer: "no",
    isStudent: "no"
  });

  const { data: selectedScheme, isLoading: isLoadingScheme } = useQuery({
    queryKey: ["scheme", schemeId],
    queryFn: () => getSchemeById({ data: schemeId! }),
    enabled: !!schemeId
  });

  const eligibilityMutation = useMutation({
    mutationFn: (data: any) => evaluateEligibility({ data }),
    onSuccess: () => setStep("result")
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeId) return;

    eligibilityMutation.mutate({
      schemeId,
      userData: {
        age: formData.age ? parseInt(formData.age) : undefined,
        state: formData.state || undefined,
        income: formData.income ? parseInt(formData.income) : undefined,
        occupation: formData.occupation || undefined,
        gender: formData.gender || undefined,
        category: formData.category || undefined,
        farmerStatus: formData.isFarmer === "yes",
        studentStatus: formData.isStudent === "yes"
      }
    });
  };

  if (step === "select" || !schemeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="bg-primary/10 p-4 rounded-full">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-extrabold">Eligibility Assessment</h1>
          <p className="text-muted-foreground max-w-md">
            Please select a scheme from the discovery page first to begin a personalized eligibility assessment.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <a href="/schemes">Browse Schemes</a>
        </Button>
      </div>
    );
  }

  if (isLoadingScheme) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <a href="/schemes"><ArrowLeft className="h-5 w-5" /></a>
        </Button>
        <div>
          <h1 className="text-2xl font-display font-extrabold">Eligibility Assessment</h1>
          <p className="text-sm text-muted-foreground">Evaluating: <span className="font-bold text-foreground">{selectedScheme?.name}</span></p>
        </div>
      </div>

      {step === "form" && (
        <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle>Verify Your Details</CardTitle>
            <CardDescription>
              We only collect information required to evaluate your eligibility for this specific scheme.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="e.g. 25" value={formData.age} onChange={handleInputChange} className="rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State / UT</Label>
                <Select onValueChange={(v) => handleSelectChange("state", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Bihar", "Gujarat"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Annual Household Income (₹)</Label>
                <Input id="income" type="number" placeholder="e.g. 300000" value={formData.income} onChange={handleInputChange} className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(v) => handleSelectChange("gender", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isFarmer">Are you a registered farmer?</Label>
                <Select onValueChange={(v) => handleSelectChange("isFarmer", v)} defaultValue="no">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Social Category</Label>
                <Select onValueChange={(v) => handleSelectChange("category", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="obc">OBC</SelectItem>
                    <SelectItem value="sc">SC</SelectItem>
                    <SelectItem value="st">ST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 pt-4">
                <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm font-bold">Privacy Note</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    Your data is used only for this one-time assessment and is not shared with any third parties.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="md:col-span-2 pt-6">
                <Button 
                  type="submit" 
                  className="w-full rounded-xl py-6 text-lg font-bold"
                  disabled={eligibilityMutation.isPending}
                >
                  {eligibilityMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                  ) : "Check Eligibility"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "result" && eligibilityMutation.data && (
        <div className="space-y-6">
          <Card className={`rounded-3xl border-none shadow-lg overflow-hidden ${
            eligibilityMutation.data.status === 'eligible' ? 'bg-emerald-50' : 
            eligibilityMutation.data.status === 'not_eligible' ? 'bg-rose-50' : 
            'bg-amber-50'
          }`}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                {eligibilityMutation.data.status === 'eligible' ? (
                  <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                ) : eligibilityMutation.data.status === 'not_eligible' ? (
                  <XCircle className="h-16 w-16 text-rose-600" />
                ) : (
                  <HelpCircle className="h-16 w-16 text-amber-600" />
                )}
              </div>
              <h2 className={`text-3xl font-display font-extrabold ${
                eligibilityMutation.data.status === 'eligible' ? 'text-emerald-900' : 
                eligibilityMutation.data.status === 'not_eligible' ? 'text-rose-900' : 
                'text-amber-900'
              }`}>
                {eligibilityMutation.data.status === 'eligible' ? 'Likely Eligible' : 
                 eligibilityMutation.data.status === 'not_eligible' ? 'Likely Not Eligible' : 
                 'Insufficient Information'}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                {eligibilityMutation.data.explanation}
              </p>
              
              <Alert className="bg-white/50 border-white/20 text-left max-w-xl mx-auto rounded-2xl">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-medium opacity-80 uppercase tracking-wider">
                  Informational assessment only. Not a legally binding determination.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Analysis Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {eligibilityMutation.data.matching.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Matching Criteria
                    </h4>
                    <ul className="space-y-2">
                      {eligibilityMutation.data.matching.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-foreground bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {eligibilityMutation.data.unmet.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-rose-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Unmet Criteria
                    </h4>
                    <ul className="space-y-2">
                      {eligibilityMutation.data.unmet.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-foreground bg-rose-50/50 p-2 rounded-lg border border-rose-100">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {eligibilityMutation.data.missing.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-amber-700 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" /> Missing Information
                    </h4>
                    <ul className="space-y-2">
                      {eligibilityMutation.data.missing.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-foreground bg-amber-50/50 p-2 rounded-lg border border-amber-100">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Source Provenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Authority</p>
                      <p className="text-sm font-semibold">{eligibilityMutation.data.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Last Verified</p>
                      <p className="text-sm font-semibold">{format(new Date(eligibilityMutation.data.verificationDate), 'dd MMMM yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <a href={selectedScheme?.application_url || '#'} target="_blank" rel="noopener noreferrer">
                    Official Portal <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button className="flex-1 rounded-xl py-6" variant="outline" onClick={() => setStep("form")}>
              Update Information
            </Button>
            {eligibilityMutation.data.status === 'eligible' && (
              <Button className="flex-1 rounded-xl py-6 shadow-lg shadow-primary/20" asChild>
                <a href={selectedScheme?.application_url || '#'} target="_blank" rel="noopener noreferrer">
                  Start Application <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
