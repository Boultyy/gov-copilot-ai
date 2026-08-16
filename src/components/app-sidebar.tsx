import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FileSearch,
  GitCompareArrows,
  PenLine,
  Route as RouteIcon,
  ShieldCheck,
  Landmark,
  Sparkle,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";

const primaryNav = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Copilot", url: "/copilot", icon: Sparkle },
  { title: "Schemes", url: "/schemes", icon: Landmark },
  { title: "Eligibility", url: "/eligibility", icon: ShieldCheck },
  { title: "Documents", url: "/documents", icon: FileSearch },
  { title: "Applications", url: "/applications", icon: RouteIcon },
];

const advancedModules = [
  { title: "Policy Checker", url: "/policy", icon: GitCompareArrows },
  { title: "Draft Generator", url: "/drafts", icon: PenLine },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate({ to: "/auth" });
    }
  };

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
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 px-3 transition-all duration-200"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        {!collapsed && (
                          <span className={cn("text-sm font-medium", active ? "text-primary" : "text-sidebar-foreground")}>
                            {item.title}
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

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Advanced Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedModules.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 px-3 transition-all duration-200"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        {!collapsed && (
                          <span className={cn("text-sm font-medium", active ? "text-primary" : "text-sidebar-foreground")}>
                            {item.title}
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="h-10 px-3">
              <Link to="/" className="flex items-center gap-3">
                <Settings className="h-4.5 w-4.5 text-muted-foreground" />
                {!collapsed && <span className="text-sm font-medium text-sidebar-foreground">Settings</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" className="h-10 px-3">
              <Link to="/profile" className="flex items-center gap-3">
                <User className="h-4.5 w-4.5 text-muted-foreground" />
                {!collapsed && <span className="text-sm font-medium text-sidebar-foreground">Profile</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Logout" 
              className="h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4.5 w-4.5" />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
