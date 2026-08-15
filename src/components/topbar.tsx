import { useEffect, useState } from "react";
import { Bell, Command, Moon, Search, Sun } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services, documents, orders…"
            className="h-10 rounded-xl border-border bg-muted/30 pl-10 pr-12 text-sm focus-visible:ring-primary/20"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </div>
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
