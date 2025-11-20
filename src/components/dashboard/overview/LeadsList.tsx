import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type RouterOutputs } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

type Lead = RouterOutputs["leads"]["getLeads"][number];

interface LeadsListProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
}

export function LeadsList({ leads, isLoading }: LeadsListProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Leads</h3>
          <Link href="/dashboard/leads" className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline">
            View All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : leads && leads.length > 0 ? (
            leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="group flex items-center gap-3 rounded-full bg-secondary/30 p-2 pr-4 transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-background text-[10px] font-bold text-muted-foreground group-hover:text-foreground">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-bold text-foreground">{lead.name}</p>
                </div>
                <div className={`h-2 w-2 rounded-full ${
                  lead.status === 'CONVERTED' ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : 
                  lead.status === 'REJECTED' ? 'bg-destructive' : 
                  'bg-muted-foreground'
                }`} />
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No leads yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
