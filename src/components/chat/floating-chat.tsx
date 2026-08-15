import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  SendHorizonal,
  Bot,
  User,
  ChevronDown,
  Loader2,
  Trash2,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchemeChatHistory,
  saveSchemeChatMessage,
  deleteSchemeChatMessage,
  clearSchemeChatHistory,
} from "@/lib/chat.functions";
import { toast } from "sonner";

type Source = { title: string; ref: string; url: string };

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const SOURCE_MARKER = "\n\n[[SOURCES]]";

function encodeContent(text: string, sources?: Source[]) {
  if (!sources || sources.length === 0) return text;
  return `${text}${SOURCE_MARKER}${JSON.stringify(sources)}`;
}

function decodeContent(raw: string): { text: string; sources?: Source[] } {
  const idx = raw.indexOf(SOURCE_MARKER);
  if (idx === -1) return { text: raw };
  const text = raw.slice(0, idx);
  try {
    const sources = JSON.parse(raw.slice(idx + SOURCE_MARKER.length)) as Source[];
    return { text, sources };
  } catch {
    return { text };
  }
}

type Answer = { text: string; sources: Source[] };

const MOCK_ANSWERS: Record<string, Answer> = {
  default: {
    text: "I can help you with information regarding various government schemes like PM Surya Ghar, PMAY, Ayushman Bharat, PM-Kisan, and Lakhpati Didi. Which one would you like to know more about?",
    sources: [
      {
        title: "MyScheme — National Scheme Repository",
        ref: "Govt. of India, Digital India Corporation",
        url: "https://www.myscheme.gov.in/",
      },
    ],
  },
  solar: {
    text: "The PM Surya Ghar: Muft Bijli Yojana provides up to 300 units of free electricity monthly through rooftop solar. The government provides significant subsidies: Rs. 30,000 for 1kW, Rs. 60,000 for 2kW, and Rs. 78,000 for 3kW or higher systems.",
    sources: [
      {
        title: "PM Surya Ghar: Muft Bijli Yojana — Official Portal",
        ref: "Ministry of New & Renewable Energy, Scheme Guidelines Cl. 4.2 (Subsidy Slabs)",
        url: "https://pmsuryaghar.gov.in/",
      },
      {
        title: "National Rooftop Solar Portal — Subsidy Structure",
        ref: "MNRE Office Memorandum No. 318/12/2023-Grid Solar",
        url: "https://solarrooftop.gov.in/",
      },
    ],
  },
  housing: {
    text: "Pradhan Mantri Awas Yojana (PMAY) provides financial assistance for building pucca houses. For PMAY-U (Urban), the interest subsidy is available for loans up to Rs. 12 lakh based on income categories.",
    sources: [
      {
        title: "PMAY-Urban — Scheme Guidelines",
        ref: "Ministry of Housing & Urban Affairs, CLSS Chapter 3",
        url: "https://pmay-urban.gov.in/",
      },
      {
        title: "PMAY-Gramin — Beneficiary Framework",
        ref: "Ministry of Rural Development, PMAY-G Framework for Implementation",
        url: "https://pmayg.nic.in/",
      },
    ],
  },
  health: {
    text: "Ayushman Bharat (PM-JAY) provides Rs. 5 lakh health cover per family. It covers over 1,900 procedures including oncology, cardiology, and neurosurgery.",
    sources: [
      {
        title: "Ayushman Bharat PM-JAY — About the Scheme",
        ref: "National Health Authority, Health Benefit Packages 2022",
        url: "https://nha.gov.in/PM-JAY",
      },
    ],
  },
  farmer: {
    text: "PM-Kisan provides Rs. 6,000 annually in three equal installments directly to bank accounts. You can check your status on the PM-Kisan portal using your Aadhaar or mobile number.",
    sources: [
      {
        title: "PM-KISAN Samman Nidhi — Operational Guidelines",
        ref: "Ministry of Agriculture & Farmers Welfare, Rev. Guidelines Para 2",
        url: "https://pmkisan.gov.in/",
      },
    ],
  },
  women: {
    text: "The Lakhpati Didi scheme focuses on skill development for women in SHGs, covering areas like plumbing and drone operation to ensure a minimum annual income of Rs. 1 lakh.",
    sources: [
      {
        title: "Lakhpati Didi Initiative — DAY-NRLM",
        ref: "Ministry of Rural Development, Deendayal Antyodaya Yojana",
        url: "https://aajeevika.gov.in/",
      },
    ],
  },
};

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: history, isLoading } = useQuery({
    queryKey: ["scheme-chat-history", session?.user?.id],
    queryFn: () => getSchemeChatHistory(),
    enabled: !!session,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["scheme-chat-history", session?.user?.id] });

  const saveMessageMutation = useMutation({
    mutationFn: (msg: { role: "user" | "assistant"; content: string }) =>
      saveSchemeChatMessage({ data: msg }),
    onSuccess: invalidate,
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) => deleteSchemeChatMessage({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Message deleted");
    },
    onError: () => toast.error("Failed to delete message"),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearSchemeChatHistory(),
    onSuccess: () => {
      invalidate();
      toast.success("Chat history cleared");
    },
    onError: () => toast.error("Failed to clear chat history"),
  });

  const messages: Message[] = history?.length
    ? history.map((m) => {
        const { text, sources } = decodeContent(m.content);
        return { id: m.id, role: m.role as "user" | "assistant", content: text, sources };
      })
    : [
        {
          role: "assistant",
          content:
            "Hello! I am GovCopilot's Scheme Assistant. Ask me anything about recent government schemes like PM Surya Ghar, Lakhpati Didi, or PMAY.",
        },
      ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");

    if (session) {
      try {
        await saveMessageMutation.mutateAsync({ role: "user", content: userMsg });
      } catch (err) {
        toast.error("Failed to save message");
        return;
      }
    }

    setIsTyping(true);

    setTimeout(async () => {
      let answer = MOCK_ANSWERS.default;
      const lowerInput = userMsg.toLowerCase();

      if (lowerInput.includes("solar") || lowerInput.includes("bijli") || lowerInput.includes("electricity")) {
        answer = MOCK_ANSWERS.solar;
      } else if (lowerInput.includes("housing") || lowerInput.includes("awas") || lowerInput.includes("house")) {
        answer = MOCK_ANSWERS.housing;
      } else if (lowerInput.includes("health") || lowerInput.includes("ayushman") || lowerInput.includes("hospital")) {
        answer = MOCK_ANSWERS.health;
      } else if (lowerInput.includes("farmer") || lowerInput.includes("kisan")) {
        answer = MOCK_ANSWERS.farmer;
      } else if (lowerInput.includes("women") || lowerInput.includes("didi") || lowerInput.includes("lakhpati")) {
        answer = MOCK_ANSWERS.women;
      }

      if (session) {
        try {
          await saveMessageMutation.mutateAsync({
            role: "assistant",
            content: encodeContent(answer.text, answer.sources),
          });
        } catch (err) {
          console.error("Failed to save AI response", err);
        }
      }

      setIsTyping(false);
    }, 1000);
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 flex h-[600px] w-[380px] flex-col border-none shadow-2xl ring-1 ring-black/5 transition-all duration-300 sm:w-[420px]">
          <CardHeader className="bg-foreground flex flex-row items-center justify-between rounded-t-xl py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-display text-sm font-bold">Scheme Copilot</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_oklch(0.6_0.15_150)]" />
                  <span className="text-[10px] font-medium text-slate-400">Trusted AI Assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {session && !!history?.length && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Clear chat history"
                  className="h-8 w-8 text-primary-foreground hover:bg-white/10"
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending}
                >
                  {clearHistoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id ?? i}
                      className={cn(
                        "group flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-[10px] font-bold",
                        msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border"
                      )}>
                        {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "assistant"
                          ? "rounded-tl-sm bg-muted/50 text-foreground border border-border/50"
                          : "rounded-tr-sm bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      )}>
                        <p>{msg.content}</p>
                        {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                          <div className="space-y-1.5 border-t border-border/60 pt-2">
                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <FileText className="h-3 w-3" /> Sources
                            </p>
                            {msg.sources.map((s, si) => (
                              <a
                                key={si}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg border border-border/60 bg-background/70 px-2 py-1.5 transition-colors hover:bg-accent"
                              >
                                <span className="flex items-start gap-1 text-[11px] font-medium leading-snug text-foreground">
                                  <span className="text-primary">[{si + 1}]</span>
                                  {s.title}
                                  <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                                </span>
                                <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                                  {s.ref}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.id && session && (
                        <button
                          onClick={() => deleteMessageMutation.mutate(msg.id!)}
                          title="Delete message"
                          className="mt-2 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-2.5">
                      <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-tl-sm px-3.5 py-2">
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-background/50 backdrop-blur-sm p-4">
            <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-1 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
              <input
                type="text"
                placeholder="Ask about PMAY, Solar, PM-Kisan..."
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 rounded-xl text-primary hover:bg-primary/10"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <SendHorizonal className="h-4.5 w-4.5" />
              </Button>
            </div>

            <div className="flex w-full flex-wrap gap-1.5">
              {["PM Surya Ghar", "Ayushman Bharat", "Lakhpati Didi"].map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(`Tell me about ${q}`)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </CardFooter>
        </Card>
      )}

      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-2xl shadow-xl transition-all duration-500 hover:scale-110 active:scale-95",
          isOpen ? "bg-foreground text-white hover:bg-foreground/90" : "bg-primary text-primary-foreground shadow-primary/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-white shadow-sm"></span>
            </span>
          </div>
        )}
      </Button>
    </div>
  );
}
