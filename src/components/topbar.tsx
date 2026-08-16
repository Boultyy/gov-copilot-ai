import { useEffect, useState } from "react";
import { Bell, Command, Moon, Search, Sun, Landmark, FileText, Layout, MessageSquare, ShieldCheck, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "@/lib/search.functions";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function Topbar() {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => globalSearch({ data: { query } }),
    enabled: query.length > 2,
  });

  const hasResults = searchResults && (
    searchResults.schemes.length > 0 ||
    searchResults.services.length > 0 ||
    searchResults.applications.length > 0 ||
    searchResults.documents.length > 0
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground sm:flex">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Official Government Information
          </div>
        </div>

        <div className="relative max-w-md flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search schemes, docs, applications…"
              className="h-10 rounded-xl border-border bg-muted/30 pl-10 pr-12 text-sm focus-visible:ring-primary/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
              <Command className="h-3 w-3" />K
            </div>
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && query.length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 space-y-6">
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-muted-foreground">Searching backend...</span>
                  </div>
                )}

                {!isLoading && !hasResults && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No matches found for "{query}"</p>
                  </div>
                )}

                {!isLoading && searchResults && (
                  <>
                    {/* Schemes */}
                    {searchResults.schemes.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Landmark className="h-3 w-3" /> Government Schemes
                        </h4>
                        <div className="grid gap-2">
                          {searchResults.schemes.map((s: any) => (
                            <Link 
                              key={s.id} 
                              to="/schemes" 
                              search={{ id: s.id }}
                              className="group flex flex-col p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                              onClick={() => setIsSearchFocused(false)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold group-hover:text-primary transition-colors truncate">{s.name}</span>
                                <Badge variant="outline" className="text-[9px] uppercase">{s.government_level}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground truncate">{s.department}</span>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-primary font-medium">Verified {format(new Date(s.last_verified_at), 'MMM yyyy')}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Documents */}
                    {searchResults.documents.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3 w-3" /> Personal Documents
                        </h4>
                        <div className="grid gap-2">
                          {searchResults.documents.map((d: any, i: number) => (
                            <Link 
                              key={i} 
                              to="/documents" 
                              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                              onClick={() => setIsSearchFocused(false)}
                            >
                              <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{d.document_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate italic">"...{d.content.substring(0, 60)}..."</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Applications */}
                    {searchResults.applications.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Layout className="h-3 w-3" /> Tracked Applications
                        </h4>
                        <div className="grid gap-2">
                          {searchResults.applications.map((a: any) => (
                            <Link 
                              key={a.id} 
                              to="/workflow" 
                              className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                              onClick={() => setIsSearchFocused(false)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold truncate">#{a.external_app_id}</span>
                                <span className="text-[10px] text-muted-foreground">{a.department}</span>
                              </div>
                              <Badge className={`text-[9px] uppercase ${
                                a.status === 'completed' || a.status === 'approved' ? 'bg-success/10 text-success border-success/20' : 
                                a.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                                'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {a.status.replace('_', ' ')}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Links Footer */}
                    <div className="pt-4 border-t border-border mt-2">
                      <Button variant="ghost" className="w-full text-xs text-primary justify-between h-8 px-2" asChild onClick={() => setIsSearchFocused(false)}>
                        <Link to="/schemes">
                          View all government schemes
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {isSearchFocused && (
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setIsSearchFocused(false)}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
            className="rounded-full"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              DC
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
