import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Globe, Briefcase, Settings2,
  TrendingUp, FileText, UserCircle, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/lib/auth";

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: Role[];
};

const items: NavItem[] = [
  { title: "Dashboard",   url: "/",            icon: LayoutDashboard, roles: ["admin"] },
  { title: "Influencers", url: "/influencers",  icon: Users,           roles: ["admin"] },
  { title: "Proxies",     url: "/proxies",      icon: Globe,           roles: ["admin"] },
  { title: "Employees",   url: "/employees",    icon: Briefcase,       roles: ["admin", "hr"] },
  { title: "Operations",  url: "/operations",   icon: Settings2,       roles: ["admin"] },
  { title: "Forecast",    url: "/forecast",     icon: TrendingUp,      roles: ["admin"] },
  { title: "SOPs",        url: "/sops",         icon: FileText,        roles: ["admin", "hr", "employee"] },
  { title: "My Portal",   url: "/my-portal",    icon: UserCircle,      roles: ["employee"] },
];

const ROLE_BADGE: Record<Role, string> = {
  admin: "Admin",
  hr: "HR",
  employee: "Employee",
};

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visible = items.filter((it) => user && it.roles.includes(user.role));

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  if (!user) return null;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60">eLeopards Agency</div>
        <div className="text-lg font-semibold mt-1">Ledger / OS</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map((it) => {
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

      {/* User info + logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold uppercase">
            {user.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
              {ROLE_BADGE[user.role]}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
