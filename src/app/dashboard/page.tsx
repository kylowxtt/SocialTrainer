"use client";

import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { Users, Target, Dumbbell, TrendingUp, DollarSign } from "lucide-react";
import { StatCard } from "~/components/dashboard/overview/StatCard";
import { ActivityChart } from "~/components/dashboard/overview/ActivityChart";
import { LeadsList } from "~/components/dashboard/overview/LeadsList";
import { QuickActions } from "~/components/dashboard/overview/QuickActions";
import { Button } from "~/components/ui/button";

export default function DashboardPage() {
  const { data: leads, isLoading: leadsLoading } = api.leads.getLeads.useQuery();
  const { data: enrollments, isLoading: enrollmentsLoading } = api.enrollments.getEnrollmentsForCoach.useQuery();

  const totalLeads = leads?.length ?? 0;
  const totalClients = enrollments?.length ?? 0;
  // Mock revenue for now as we don't have payments yet
  const totalRevenue = totalClients * 150; 

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex items-end justify-between pb-4">
        <div>
          <h2 className="font-heading text-4xl font-bold uppercase italic tracking-tighter">
            Overview
          </h2>
          <p className="text-muted-foreground">Welcome back, Coach.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground border-transparent bg-card hover:bg-secondary">
            Daily
          </Button>
          <Button size="sm" className="text-xs font-bold uppercase">
            Weekly
          </Button>
          <Button variant="outline" size="sm" className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground border-transparent bg-card hover:bg-secondary">
            Monthly
          </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <StatCard 
            label="Total Revenue" 
            value={`$${totalRevenue.toLocaleString()}`} 
            change="+12.5%" 
            trend="up"
            icon={DollarSign}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="Active Clients" 
            value={totalClients.toString()} 
            change="+4" 
            trend="up"
            icon={Users}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="New Leads" 
            value={totalLeads.toString()} 
            change="+8" 
            trend="up"
            icon={Target}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="Programs" 
            value="3" 
            change="0" 
            trend="neutral"
            icon={Dumbbell}
          />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-2 min-h-[500px]">
        {/* Activity Chart - Takes up 2x2 space */}
        <motion.div variants={item} className="lg:col-span-2 lg:row-span-2">
          <ActivityChart />
        </motion.div>

        {/* Recent Leads List */}
        <motion.div variants={item} className="lg:col-span-1 lg:row-span-1">
          <LeadsList leads={leads} isLoading={leadsLoading} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="lg:col-span-1 lg:row-span-1">
          <QuickActions />
        </motion.div>
      </div>
    </motion.div>
  );
}
