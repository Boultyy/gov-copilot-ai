import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FileSearch,
  GitCompareArrows,
  PenLine,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const modules = [
  { title: "Decision Intelligence", url: "/", icon: BarChart3, hint: "KPIs & insights" },
  { title: "Document Intelligence", url: "/documents", icon: FileSearch, hint: "Ask your files" },
  { title: "Workflow Copilot", url: "/workflow", icon: RouteIcon, hint: "Service procedures" },
  { title: "Policy Conflict Checker", url: "/policy", icon: GitCompareArrows, hint: "Compare policies" },
  { title: "AI Draft Generator", url: "/drafts", icon: PenLine, hint: "Letters & orders" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-1 py-1.5">
          <span className="gradient-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-[var(--shadow-card)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-extrabold text-sidebar-foreground">
                GovCopilot
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                AI for Governance
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-auto py-2"
                    >
                      <Link to={item.url} className="flex items-start gap-3">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-medium">{item.title}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {item.hint}
                            </span>
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
            <p className="text-xs font-semibold text-sidebar-accent-foreground">Demo Mode</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Sample data only. Built for Smart India Hackathon.
            </p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
