"use client";

import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";

export default function LeadsPage() {
  const { data: leads, isLoading } = api.leads.getLeads.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter">Leads Pipeline</h2>
          <p className="text-muted-foreground">Manage and convert your potential clients.</p>
        </div>
        <button className="group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground transition-transform hover:translate-y-[-2px] active:translate-y-0 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
          <Plus className="h-4 w-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 rounded-3xl bg-card p-2 pl-6">
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="w-full bg-transparent px-8 py-2 text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="h-6 w-px bg-border" />
        <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Leads List */}
      <div className="rounded-3xl bg-card overflow-hidden">
        <div className="grid grid-cols-12 border-b border-border bg-secondary/30 px-8 py-4 text-xs font-bold uppercase text-muted-foreground">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading pipeline...</div>
        ) : leads && leads.length > 0 ? (
          <div className="divide-y divide-border">
            {leads.map((lead, i) => (
              <motion.div 
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-12 items-center px-8 py-5 transition-colors hover:bg-secondary/30"
              >
                <div className="col-span-4 font-bold">{lead.name}</div>
                <div className="col-span-4 text-sm text-muted-foreground">{lead.email}</div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    lead.status === 'CONVERTED' ? 'bg-primary/20 text-primary' : 
                    lead.status === 'REJECTED' ? 'bg-destructive/20 text-destructive' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <button className="text-xs font-bold uppercase text-primary hover:underline">
                    Manage
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-xl font-bold uppercase">No Leads Found</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your pipeline is empty. Start promoting your coaching services to get leads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
