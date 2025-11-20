import { type LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon?: LucideIcon;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, change, icon: Icon, className, trend = "neutral" }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden transition-all hover:bg-card/80", className)}>
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
        
        <div className="mt-4">
          <h3 className="font-heading text-4xl font-bold tracking-tight text-foreground">{value}</h3>
          {change && (
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold hover:bg-opacity-100",
                  trend === "up" && "bg-primary/20 text-primary hover:bg-primary/30",
                  trend === "down" && "bg-destructive/20 text-destructive hover:bg-destructive/30",
                  trend === "neutral" && "bg-secondary text-muted-foreground"
                )}
              >
                {change}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Decorative gradient glow */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      </CardContent>
    </Card>
  );
}
