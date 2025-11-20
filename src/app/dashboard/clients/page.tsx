"use client";

import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { User, Calendar, MoreHorizontal, Mail } from "lucide-react";

export default function ClientsPage() {
  const { data: relationships, isLoading } = api.coachingRelationships.getCoachingRelationships.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter">Active Clients</h2>
          <p className="text-muted-foreground">Monitor your athletes and their progress.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading clients...</div>
      ) : relationships && relationships.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {relationships.map((rel, i) => (
            <motion.div
              key={rel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden border border-border bg-card p-6 transition-all hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center bg-secondary text-lg font-bold uppercase text-foreground">
                    {rel.client.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold uppercase">{rel.client.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {rel.client.email}
                    </div>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold uppercase text-primary">{rel.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">{new Date(rel.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 border border-border bg-transparent py-2 text-xs font-bold uppercase transition-colors hover:bg-secondary">
                  View Profile
                </button>
                <button className="flex-1 bg-primary py-2 text-xs font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90">
                  Message
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border bg-secondary/10">
          <User className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="font-heading text-xl font-bold uppercase">No Clients Yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Convert your leads to clients to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
