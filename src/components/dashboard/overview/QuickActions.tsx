import Link from "next/link";
import { Target, Dumbbell, Plus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/dashboard/leads" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground transition-transform hover:scale-[1.02]">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">Action</span>
          <Plus className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <Target className="mb-2 h-8 w-8" />
          <h3 className="font-heading text-xl font-bold uppercase leading-none">Add Lead</h3>
        </div>
        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      </Link>

      <Link href="/dashboard/programs" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border p-6 transition-transform hover:scale-[1.02]">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</span>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4">
          <Dumbbell className="mb-2 h-8 w-8 text-foreground" />
          <h3 className="font-heading text-xl font-bold uppercase leading-none text-foreground">New Program</h3>
        </div>
      </Link>
    </div>
  );
}
