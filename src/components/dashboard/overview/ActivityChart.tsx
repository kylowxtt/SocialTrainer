"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "~/components/ui/card";

export function ActivityChart() {
  // Mock data for the "pill" chart
  const data = [
    { label: "Mon", value: 65, active: false },
    { label: "Tue", value: 45, active: false },
    { label: "Wed", value: 85, active: true },
    { label: "Thu", value: 55, active: false },
    { label: "Fri", value: 75, active: false },
    { label: "Sat", value: 90, active: false },
    { label: "Sun", value: 40, active: false },
  ];

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</h3>
          <button className="text-xs text-muted-foreground hover:text-foreground">...</button>
        </div>

        <div className="mt-8 flex flex-1 items-end justify-between gap-4">
          {data.map((item, i) => (
            <div key={item.label} className="group flex h-full w-full flex-col items-center justify-end gap-3">
              <div className="relative flex h-full w-full items-end justify-center rounded-full bg-muted">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  className={`w-full max-w-[16px] rounded-full transition-colors ${item.active ? 'bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]' : 'bg-secondary group-hover:bg-secondary/80'}`}
                />
              </div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
