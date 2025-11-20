"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar,
  Users, 
  Target, 
  Dumbbell, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/leads", label: "Leads", icon: Target },
  { href: "/dashboard/programs", label: "Programs", icon: Dumbbell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background text-foreground">
      <div className="flex h-full flex-col p-4">
        {/* Logo Area */}
        <div className="flex h-16 items-center px-4">
          <h1 className="font-heading text-2xl font-bold tracking-tighter italic">
            SOCIAL<span className="text-primary">TRAINER</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 mt-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="mt-auto pt-4">
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="tracking-wide">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
