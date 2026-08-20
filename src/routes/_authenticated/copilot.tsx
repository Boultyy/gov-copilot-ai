import { useState, useRef, useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  getConversations, 
  getConversationMessages, 
  startNewConversation, 
  sendCopilotMessage 
} from "@/lib/copilot.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";

const copilotSearchSchema = z.object({
  id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/copilot")({
  validateSearch: (search) => copilotSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "AI Citizen Copilot | GovCopilot" },
      {
        name: "description",
        content: "Experience the next generation of government interaction with our premium AI assistant.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["conversations"],
      queryFn: () => getConversations(),
    });
  },
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
  const searchParams = useSearch({ from: "/_authenticated/copilot" });
  const [activeId, setActiveId] = useState<string | null>(searchParams.id || null);

  useEffect(() => {
    if (searchParams.id) {
      setActiveId(searchParams.id);
    }
  }, [searchParams.id]);

  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const getConvsFn = useServerFn(getConversations);
  const getMsgsFn = useServerFn(getConversationMessages);
  const startConvFn = useServerFn(startNewConversation);
  const sendMsgFn = useServerFn(sendCopilotMessage);

  // Queries
  const { data: conversations = [] } = useSuspenseQuery({
    queryKey: ["conversations"],
    queryFn: () => getConvsFn(),
  });

  const { data: messages = [] } = useSuspenseQuery({
    queryKey: ["messages", activeId],
    queryFn: () => activeId ? getMsgsFn({ data: { conversationId: activeId } }) : Promise.resolve([]),
  });

  // Mutations
  const startConv = useMutation({
    mutationFn: (title?: string) => startConvFn({ data: { title } }),
    onSuccess: (newConv: any) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveId(newConv.id);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (args: { conversationId: string; content: string }) => {
      console.log("[COPILOT_DIAGNOSTIC] client:mutation:start", args);
      const result = await sendMsgFn({ data: args });
      console.log("[COPILOT_DIAGNOSTIC] client:mutation:complete", { success: !!result });
      return result;
    },
    onMutate: async (variables) => {
      console.log("[COPILOT_DIAGNOSTIC] onMutate start", variables);
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["messages", variables.conversationId] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["messages", variables.conversationId]);
      console.log("[COPILOT_DIAGNOSTIC] previousMessages count:", (previousMessages as any)?.length);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["messages", variables.conversationId], (old: any) => {
        const newMsgs = [
          ...(old || []),
          { role: "user", content: variables.content, id: `temp-${Date.now()}` }
        ];
        console.log("[COPILOT_DIAGNOSTIC] setting optimistic data, new count:", newMsgs.length);
        return newMsgs;
      });
      
      return { previousMessages };
    },
    onSuccess: async (data, variables) => {
      console.log("[COPILOT_DIAGNOSTIC] client:mutation:onSuccess", { 
        hasUserMsg: !!(data as any)?.userMessage, 
        hasAssistantMsg: !!(data as any)?.assistantMessage,
        conversationId: variables.conversationId 
      });
      
      const result = data as any;
      if (result?.userMessage && result?.assistantMessage) {
        queryClient.setQueryData(["messages", variables.conversationId], (old: any) => {
          const messages = old || [];
          console.log("[COPILOT_DIAGNOSTIC] onSuccess: updating query data, old count:", messages.length);
          
          // Filter out the specific temporary message if possible, or all temp messages
          const filtered = messages.filter((m: any) => !m.id?.toString().startsWith('temp-'));
          
          const newMsgs = [...filtered, result.userMessage, result.assistantMessage];
          console.log("[COPILOT_DIAGNOSTIC] onSuccess: new count:", newMsgs.length);
          return newMsgs;
        });
      } else if (result) {
        // Fallback for old single-message return format if any
        queryClient.setQueryData(["messages", variables.conversationId], (old: any) => {
          const filtered = (old || []).filter((m: any) => !m.id?.toString().startsWith('temp-'));
          return [...filtered, { role: "user", content: variables.content }, result];
        });
      }
      
      // Trigger background refreshes
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error, variables, context) => {
      console.error("[COPILOT_DIAGNOSTIC] client:mutation:onError", error, { conversationId: variables.conversationId });
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", variables.conversationId], context.previousMessages);
      }
      toast.error("Failed to send message. Please try again.");
    },
    onSettled: (data, error, variables) => {
      console.log("[COPILOT_DIAGNOSTIC] client:mutation:onSettled", { 
        hasData: !!data, 
        hasError: !!error,
        conversationId: variables.conversationId 
      });
      // CRITICAL FIX: Only invalidate if the mutation was NOT successful or if we strictly need to sync.
      // For multi-turn conversations, invalidating while another query is potentially loading
      // or during high-frequency turns can cause race conditions where optimistic data is wiped by a stale refetch.
      queryClient.invalidateQueries({ 
        queryKey: ["messages", variables.conversationId],
        exact: true,
        refetchType: 'none' // Don't trigger an immediate background refetch that might overwrite state
      });
      // We still want the conversation list to update
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]); // Remove sendMessage.isPending to avoid confusion with thinking state

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    
    console.log("[COPILOT_DEBUG] handleSend triggered", { 
      textToSend, 
      isPending: sendMessage.isPending, 
      activeId,
      inputState: input
    });

    if (!textToSend.trim() || sendMessage.isPending) {
      console.log("[COPILOT_DEBUG] handleSend blocked", { 
        isEmpty: !textToSend.trim(), 
        isPending: sendMessage.isPending 
      });
      return;
    }
    
    let currentId = activeId;
    const userMsg = textToSend;
    
    // Clear input immediately for better UX
    setInput("");

    try {
      if (!currentId) {
        console.log("[COPILOT_DEBUG] No activeId, starting new conversation...");
        const newConv = await startConv.mutateAsync(userMsg.slice(0, 30));
        currentId = (newConv as any).id;
        console.log("[COPILOT_DEBUG] New conversation created", { currentId });
        setActiveId(currentId);
      }

      console.log("[COPILOT_DEBUG] Calling sendMessage.mutate", { currentId, userMsg });
      
      // We use the fire-and-forget mutate instead of mutateAsync to avoid awaiting the whole lifecycle
      // which can sometimes lead to state inconsistencies if not handled carefully
      sendMessage.mutate({ 
        conversationId: currentId as string, 
        content: userMsg 
      });
      
      console.log("[COPILOT_DEBUG] sendMessage mutation triggered");
    } catch (error) {
      console.error("[COPILOT_DEBUG] handleSend execution error", error);
      toast.error("Failed to start conversation. Please try again.");
      // Restore input on failure
      if (!overrideInput) setInput(userMsg);
    }
  };



  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-64px)] overflow-hidden sm:-mx-6 lg:-mx-8">
      {/* Copilot Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-border bg-muted/30 lg:flex">
        <div className="p-4">
          <Button 
            onClick={() => setActiveId(null)}
            className="w-full justify-start rounded-xl shadow-lg shadow-primary/20 py-6" 
            variant={activeId === null ? "default" : "outline"}
          >
            <Plus className="mr-2 h-4 w-4" /> New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent</p>
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">No recent chats</p>
            ) : (
              conversations.map((chat: any) => (
                <button 

                  key={chat.id} 
                  onClick={() => setActiveId(chat.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                    activeId === chat.id ? "bg-accent text-primary font-medium" : "text-foreground"
                  )}
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{chat.title || "Untitled Chat"}</span>
                </button>
              ))
            )}
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
          <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> Secure Official Channel
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12" ref={scrollRef}>
          <div className="mx-auto max-w-3xl space-y-8">
            {messages.map((msg: any, i: number) => {
              const metadata = msg.metadata as any;
              const sources = metadata?.sources || [];
              
              return (
                <div key={msg.id || i} className={cn("flex gap-4 animate-rise", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg", msg.role === "assistant" ? "bg-primary text-white shadow-primary/20" : "bg-foreground text-white shadow-foreground/10")}>
                    {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={cn("flex flex-col gap-3", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ring-1 whitespace-pre-wrap", msg.role === "assistant" ? "bg-card text-foreground ring-border shadow-md" : "bg-foreground text-white ring-foreground")}>
                      {msg.content}
                    </div>
                    
                    {sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {sources.map((source: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0 h-6 bg-muted/30 border-primary/20 text-primary flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {source.name}
                            {source.url && (
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-primary/70">
                                <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {msg.role === "assistant" && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full px-3 bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors">
                          Save to Workspace
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full px-3 bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors">
                          Share Result
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {sendMessage.isPending && (
              <div className="flex gap-4 animate-pulse">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-3 items-start">
                  <div className="rounded-2xl px-5 py-3 text-sm bg-card text-foreground ring-1 ring-border shadow-md flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    GovCopilot is thinking...
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="border-t border-border bg-background p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {(messages.length === 0) && !sendMessage.isPending && (
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button 
                    key={p} 
                    onClick={() => handleSend(p)} 
                    className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Input
                value={input}
                onChange={(e) => {
                  console.log("[COPILOT_DEBUG] Input changed", e.target.value);
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log("[COPILOT_DEBUG] Enter key pressed");
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sendMessage.isPending}
                placeholder="Ask GovCopilot about schemes, documents, or eligibility..."
                className="h-14 rounded-2xl border-border bg-muted/30 pl-6 pr-14 shadow-inner"
              />
              <Button 
                onClick={(e) => {
                  console.log("[COPILOT_DEBUG] Send button clicked");
                  e.preventDefault();
                  handleSend();
                }} 
                size="icon" 
                disabled={sendMessage.isPending || !input.trim()}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizonal className="h-5 w-5" />
                )}
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
