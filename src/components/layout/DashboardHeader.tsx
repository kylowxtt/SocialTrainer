"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get the current page name from the path
  const pageName = pathname?.split("/").pop() || "Dashboard";
  const title = pageName === "dashboard" ? "Overview" : pageName;

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-background/80 px-8 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or Title could go here if needed, but we have page titles */}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-10 w-64 rounded-full border border-border bg-secondary/50 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        <button className="relative rounded-full bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold leading-none">Utsav Sharma</p>
            <p className="text-xs text-muted-foreground">Head Coach</p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-secondary bg-secondary">
            {/* Placeholder Avatar */}
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold">
              US
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
