import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Globe, Briefcase, Settings2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Influencers", url: "/influencers", icon: Users },
  { title: "Proxies", url: "/proxies", icon: Globe },
  { title: "Employees", url: "/employees", icon: Briefcase },
  { title: "Operations", url: "/operations", icon: Settings2 },
  { title: "Forecast", url: "/forecast", icon: TrendingUp },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60">Agency</div>
        <div className="text-lg font-semibold mt-1">Ledger / OS</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = pathname === it.url;
          return (
            <Link
              key={it.url}
              to={it.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
        v1.0 — Monochrome
      </div>
    </aside>
  );
}