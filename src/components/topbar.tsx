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
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-5">
        <SidebarTrigger className="shrink-0" />

        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services, documents, orders…"
            className="h-10 rounded-full border-border bg-muted/60 pl-9 pr-16 text-sm"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </span>
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
