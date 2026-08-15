import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  SendHorizonal,
  Bot,
  User,
  Plus,
  History,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot | GovCopilot" },
      {
        name: "description",
        content: "Experience the next generation of government interaction with our premium AI assistant.",
      },
    ],
  }),
  component: Copilot,
});

const suggestedPrompts = [
  "Find scholarships I may qualify for",
  "What government schemes can help my family?",
  "What documents do I need for an Income Certificate?",
  "Check my eligibility for PMAY",
];

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "scheme" | "eligibility";
  data?: any;
};

function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I'm your GovCopilot. How can I assist you with government services today?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    // Mock AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Based on your interest, I've found a scheme you might qualify for:",
          type: "scheme",
          data: {
            name: "PM Surya Ghar: Muft Bijli Yojana",
            dept: "Ministry of New & Renewable Energy",
            benefits: "Up to 300 units of free electricity monthly",
            status: "Eligible",
          },
        },
      ]);
    }, 1000);
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-64px)] overflow-hidden sm:-mx-6 lg:-mx-8">
      {/* Copilot Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-border bg-muted/30 lg:flex">
        <div className="p-4">
          <Button className="w-full justify-start rounded-xl" variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent</p>
            {[
              "Scholarship search",
              "Housing eligibility",
              "Income certificate docs",
            ].map((chat) => (
              <button key={chat} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{chat}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace</p>
            {[
              { label: "Saved Schemes", icon: Bookmark },
              { label: "Application Tracker", icon: ShieldCheck },
            ].map((item) => (
              <button key={item.label} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="relative flex flex-1 flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-display text-base font-bold">Copilot Assistant</h2>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <ShieldCheck className="mr-1.5 h-3 w-3" /> Secure Official Channel
          </Badge>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12" ref={scrollRef}>
          <div className="mx-auto max-w-3xl space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-4 animate-rise", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", msg.role === "assistant" ? "bg-foreground text-white" : "bg-primary text-primary-foreground")}>
                  {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className={cn("flex flex-col gap-3", msg.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn("rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm", msg.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}>
                    {msg.content}
                  </div>
                  {msg.type === "scheme" && (
                    <Card className="w-full max-w-md border-primary/20 bg-primary/5 shadow-md">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Recommended Scheme</p>
                            <h4 className="mt-1 font-display font-bold text-foreground">{msg.data.name}</h4>
                            <p className="text-xs text-muted-foreground">{msg.data.dept}</p>
                          </div>
                          <Badge className="bg-success text-white">Eligible</Badge>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-xs border border-border">
                          <p className="font-semibold text-foreground">Benefit:</p>
                          <p className="mt-0.5 text-muted-foreground">{msg.data.benefits}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 rounded-lg">Start Application</Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-lg">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {msg.role === "assistant" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full px-3 bg-muted hover:bg-accent">
                        Save to Workspace
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full px-3 bg-muted hover:bg-accent">
                        Share Result
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-background p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button key={p} onClick={() => { setInput(p); }} className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary">
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask GovCopilot about schemes, documents, or eligibility..."
                className="h-14 rounded-2xl border-border bg-muted/30 pl-6 pr-14 shadow-inner"
              />
              <Button onClick={handleSend} size="icon" className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-foreground text-white hover:bg-foreground/90">
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              GovCopilot may provide information from official government sources. Always verify with official portals.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
