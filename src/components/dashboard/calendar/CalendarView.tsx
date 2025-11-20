"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks,
  isToday,
  parseISO,
  addHours
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

// --- Types ---

type ViewType = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "session" | "consultation" | "block";
  client?: {
    name: string;
    image?: string;
  };
}

// --- Mock Data ---

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "PT Session with Sarah",
    start: addHours(new Date(), 2),
    end: addHours(new Date(), 3),
    type: "session",
    client: { name: "Sarah J.", image: "https://i.pravatar.cc/150?u=sarah" }
  },
  {
    id: "2",
    title: "Initial Consultation",
    start: addHours(new Date(), 26),
    end: addHours(new Date(), 27),
    type: "consultation",
    client: { name: "Mike T." }
  },
  {
    id: "3",
    title: "Deep Work Block",
    start: addHours(new Date(), -24),
    end: addHours(new Date(), -22),
    type: "block"
  }
];

// --- Components ---

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewType>("week");
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (!currentDate) return null;

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addHours(currentDate, 24));
  };

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addHours(currentDate, -24));
  };

  const today = () => setCurrentDate(new Date());

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">Manage your sessions and appointments.</p>
        </div>
        
        <div className="flex items-center gap-2 rounded-2xl bg-card p-1 shadow-sm border border-border/50">
          <Button 
            variant={view === "month" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("month")}
            className="rounded-xl"
          >
            Month
          </Button>
          <Button 
            variant={view === "week" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("week")}
            className="rounded-xl"
          >
            Week
          </Button>
          <Button 
            variant={view === "day" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("day")}
            className="rounded-xl"
          >
            Day
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-border bg-card p-1">
            <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center font-medium">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 rounded-xl">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={today} className="rounded-2xl">Today</Button>
          <Button className="gap-2 rounded-2xl">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        {view === "month" && <MonthView currentDate={currentDate} events={events} />}
        {view === "week" && <WeekView currentDate={currentDate} events={events} />}
        {view === "day" && <DayView currentDate={currentDate} events={events} />}
      </div>
    </div>
  );
}

function MonthView({ currentDate, events }: { currentDate: Date, events: CalendarEvent[] }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-5">
        {days.map((day, dayIdx) => {
          const dayEvents = events.filter(e => isSameDay(e.start, day));
          return (
            <div
              key={day.toString()}
              className={cn(
                "relative min-h-[100px] border-b border-r border-border p-2 transition-colors hover:bg-muted/10",
                !isSameMonth(day, monthStart) && "bg-muted/5 text-muted-foreground",
                dayIdx % 7 === 6 && "border-r-0" // Remove right border for last column
              )}
            >
              <div className={cn(
                "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                      event.type === "session" ? "bg-primary/10 text-primary-700 dark:text-primary" :
                      event.type === "consultation" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" :
                      "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events }: { currentDate: Date, events: CalendarEvent[] }) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to 6 AM by default
      scrollRef.current.scrollTop = 6 * 80;
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-8 border-b border-border bg-muted/30">
        <div className="border-r border-border p-4 text-center text-xs font-medium text-muted-foreground">
          Time
        </div>
        {days.map((day) => (
          <div 
            key={day.toString()} 
            className={cn(
              "flex flex-col items-center justify-center border-r border-border py-3 last:border-r-0",
              isToday(day) && "bg-primary/5"
            )}
          >
            <span className="text-xs font-medium uppercase text-muted-foreground">{format(day, "EEE")}</span>
            <span className={cn(
              "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold",
              isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
            )}>
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="grid grid-cols-8 relative">
          {/* Current Time Indicator Line */}
          <CurrentTimeIndicator />

          {/* Time Column */}
          <div className="border-r border-border">
            {hours.map((hour) => (
              <div key={hour} className="relative h-20 border-b border-border/50 text-right">
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((day) => (
            <div key={day.toString()} className="relative border-r border-border last:border-r-0">
              {hours.map((hour) => (
                <div key={hour} className="h-20 border-b border-border/50" />
              ))}
              
              {/* Events Overlay */}
              {events
                .filter(e => isSameDay(e.start, day))
                .map(event => {
                  const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={event.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg border p-2 text-xs shadow-sm overflow-hidden z-10",
                        event.type === "session" ? "bg-primary/10 border-primary/20 text-primary-700 dark:text-primary" :
                        event.type === "consultation" ? "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" :
                        "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400"
                      )}
                      style={{
                        top: `${startHour * 80}px`, // 80px per hour (h-20)
                        height: `${duration * 80}px`
                      }}
                    >
                      <div className="font-bold">{event.title}</div>
                      <div className="text-[10px] opacity-80">
                        {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                      </div>
                      {event.client && (
                        <div className="mt-1 flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={event.client.image} />
                            <AvatarFallback className="text-[8px]">{event.client.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{event.client.name}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setTop((hours + minutes / 60) * 80);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (top === null) return null;

  return (
    <div 
      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
      <div className="h-[2px] flex-1 bg-red-500" />
    </div>
  );
}


function DayView({ currentDate, events }: { currentDate: Date, events: CalendarEvent[] }) {
  // Simplified Day View reusing Week View logic but for single day
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = events.filter(e => isSameDay(e.start, currentDate));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 6 * 80;
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-center border-b border-border bg-muted/30 py-4">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium uppercase text-muted-foreground">{format(currentDate, "EEEE")}</span>
          <span className={cn(
            "mt-1 flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold",
            isToday(currentDate) ? "bg-primary text-primary-foreground" : "text-foreground"
          )}>
            {format(currentDate, "d")}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="relative min-h-[1920px]"> {/* 24 * 80px */}
          <CurrentTimeIndicator />
          {hours.map((hour) => (
            <div key={hour} className="flex h-20 border-b border-border/50">
              <div className="w-20 border-r border-border p-2 text-right text-xs text-muted-foreground">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
              <div className="flex-1" />
            </div>
          ))}

          {dayEvents.map(event => {
            const startHour = event.start.getHours() + event.start.getMinutes() / 60;
            const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
            
            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={event.id}
                className={cn(
                  "absolute left-24 right-4 rounded-xl border p-4 shadow-sm overflow-hidden z-10",
                  event.type === "session" ? "bg-primary/10 border-primary/20" :
                  event.type === "consultation" ? "bg-blue-500/10 border-blue-500/20" :
                  "bg-gray-500/10 border-gray-500/20"
                )}
                style={{
                  top: `${startHour * 80}px`,
                  height: `${duration * 80}px`
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={cn(
                      "font-bold text-lg",
                      event.type === "session" ? "text-primary-700 dark:text-primary" :
                      event.type === "consultation" ? "text-blue-700 dark:text-blue-400" :
                      "text-gray-700 dark:text-gray-400"
                    )}>{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                    </div>
                  </div>
                  {event.client && (
                    <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.client.image} />
                        <AvatarFallback>{event.client.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{event.client.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
