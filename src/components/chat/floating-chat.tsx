import { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  SendHorizonal, 
  Bot, 
  User, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchemeChatHistory, saveSchemeChatMessage } from "@/lib/chat.functions";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const MOCK_ANSWERS: Record<string, string> = {
  "default": "I can help you with information regarding various government schemes like PM Surya Ghar, PMAY, Ayushman Bharat, PM-Kisan, and Lakhpati Didi. Which one would you like to know more about?",
  "solar": "The PM Surya Ghar: Muft Bijli Yojana provides up to 300 units of free electricity monthly through rooftop solar. The government provides significant subsidies: Rs. 30,000 for 1kW, Rs. 60,000 for 2kW, and Rs. 78,000 for 3kW or higher systems.",
  "housing": "Pradhan Mantri Awas Yojana (PMAY) provides financial assistance for building pucca houses. For PMAY-U (Urban), the interest subsidy is available for loans up to Rs. 12 lakh based on income categories.",
  "health": "Ayushman Bharat (PM-JAY) provides Rs. 5 lakh health cover per family. It covers over 1,900 procedures including oncology, cardiology, and neurosurgery.",
  "farmer": "PM-Kisan provides Rs. 6,000 annually in three equal installments directly to bank accounts. You can check your status on the PM-Kisan portal using your Aadhaar or mobile number.",
  "women": "The Lakhpati Didi scheme focuses on skill development for women in SHGs, covering areas like plumbing and drone operation to ensure a minimum annual income of Rs. 1 lakh."
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

  const saveMessageMutation = useMutation({
    mutationFn: (msg: { role: "user" | "assistant"; content: string }) => 
      saveSchemeChatMessage({ data: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheme-chat-history", session?.user?.id] });
    },
  });

  const messages: Message[] = history?.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content
  })) || [
    { role: "assistant", content: "Hello! I am GovCopilot's Scheme Assistant. Ask me anything about recent government schemes like PM Surya Ghar, Lakhpati Didi, or PMAY." }
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
      let response = MOCK_ANSWERS.default;
      const lowerInput = userMsg.toLowerCase();
      
      if (lowerInput.includes("solar") || lowerInput.includes("bijli") || lowerInput.includes("electricity")) {
        response = MOCK_ANSWERS.solar;
      } else if (lowerInput.includes("housing") || lowerInput.includes("awas") || lowerInput.includes("house")) {
        response = MOCK_ANSWERS.housing;
      } else if (lowerInput.includes("health") || lowerInput.includes("ayushman") || lowerInput.includes("hospital")) {
        response = MOCK_ANSWERS.health;
      } else if (lowerInput.includes("farmer") || lowerInput.includes("kisan")) {
        response = MOCK_ANSWERS.farmer;
      } else if (lowerInput.includes("women") || lowerInput.includes("didi") || lowerInput.includes("lakhpati")) {
        response = MOCK_ANSWERS.women;
      }

      if (session) {
        try {
          await saveMessageMutation.mutateAsync({ role: "assistant", content: response });
        } catch (err) {
          console.error("Failed to save AI response", err);
        }
      } else {
        // Fallback for non-logged in users if we wanted to allow it (but the request said "each user's", implying auth)
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
        <Card className="animate-in fade-in slide-in-from-bottom-4 flex h-[500px] w-[380px] flex-col shadow-2xl transition-all duration-300 sm:w-[420px]">
          <CardHeader className="gradient-primary flex flex-row items-center justify-between rounded-t-xl py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Scheme Copilot</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  <span className="text-[10px] opacity-90">Online Assistant</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
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
                      key={i} 
                      className={cn(
                        "flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2",
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
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                        msg.role === "assistant" 
                          ? "rounded-tl-sm bg-muted text-foreground" 
                          : "rounded-tr-sm bg-primary text-primary-foreground"
                      )}>
                        {msg.content}
                      </div>
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

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 p-4">
            <div className="flex w-full gap-2">
              <input
                type="text"
                placeholder="Ask about PMAY, Solar, PM-Kisan..."
                className="flex-1 bg-transparent text-sm outline-none focus:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button 
                size="icon" 
                className="h-8 w-8 shrink-0 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex w-full flex-wrap gap-1.5">
              {["PM Surya Ghar", "Ayushman Bharat", "Lakhpati Didi"].map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(`Tell me about ${q}`)}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105",
          isOpen ? "bg-muted text-muted-foreground hover:bg-muted/80" : "gradient-primary text-primary-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
            </span>
          </div>
        )}
      </Button>
    </div>
  );
}
