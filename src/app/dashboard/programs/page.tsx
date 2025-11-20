"use client";

import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { Plus, Dumbbell, Clock, Users } from "lucide-react";

export default function ProgramsPage() {
  const { data: programs, isLoading } = api.programs.getPrograms.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter">Training Programs</h2>
          <p className="text-muted-foreground">Design and manage your workout plans.</p>
        </div>
        <button className="group flex items-center gap-2 bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground transition-transform hover:translate-y-[-2px] active:translate-y-0">
          <Plus className="h-4 w-4" />
          <span>Create Program</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading programs...</div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col justify-between border border-border bg-card p-6 transition-all hover:border-primary"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-none bg-secondary p-3">
                    <Dumbbell className="h-6 w-6 text-foreground" />
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-1 ${program.isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {program.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
                
                <h3 className="font-heading text-2xl font-bold uppercase leading-none">{program.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{program.description}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{program.duration} Weeks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{program.maxClients ? `${program.maxClients} Max` : 'Unlimited'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-heading text-xl font-bold">${program.price}</span>
                  <button className="text-xs font-bold uppercase text-primary hover:underline">
                    Edit Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border bg-secondary/10">
          <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="font-heading text-xl font-bold uppercase">No Programs Found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first training program to start selling.
          </p>
        </div>
      )}
    </div>
  );
}
