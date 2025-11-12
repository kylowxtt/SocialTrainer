import type { ReactNode } from "react";

import Link from "next/link";
import { Dumbbell, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import Image from "next/image";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-white px-14 py-14 lg:flex border-r border-stone-200">
        <header className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center transition-transform group-hover:scale-105">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase">SocialTrainer</span>
          </Link>
          <span className="rounded-full bg-lime-400/20 px-3 py-1 text-xs uppercase tracking-wide text-stone-900">
            Coach Platform
          </span>
        </header>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl uppercase tracking-tighter leading-tight">
              Your community.<br />
              Your programs.<br />
              <span className="italic">One platform.</span>
            </h2>
            <p className="max-w-md text-base text-stone-600 leading-relaxed">
              Build programs, automate onboarding, and track conversions — all from one dashboard built for fitness coaches.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              {
                title: "Active Coaches",
                value: "500+",
                icon: Users,
              },
              {
                title: "Avg. Revenue Lift",
                value: "3.2x",
                icon: TrendingUp,
              },
            ].map((stat) => (
              <div key={stat.title} className="bg-stone-50 rounded-2xl p-5 border border-stone-200">
                <stat.icon className="mb-3 h-5 w-5 text-stone-900" />
                <dt className="text-xs uppercase tracking-wide text-stone-600 mb-1">{stat.title}</dt>
                <dd className="text-2xl font-bold text-stone-900">{stat.value}</dd>
              </div>
            ))}
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-900 bg-stone-900 w-full max-w-md mx-auto">
            <div className="relative aspect-[9/16]">
              <Image
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=90"
                alt="Fitness coach working with client"
                className="w-full h-full object-cover"
                fill
                priority
              />
            </div>
          </div>
        </div>

        <footer className="space-y-3 pt-4">
          {[
            "Automated client onboarding",
            "Seamless program delivery",
            "Real-time engagement insights",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-stone-600">
              <CheckCircle2 className="h-4 w-4 text-lime-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </footer>
      </aside>

      <main className="flex flex-1 items-center justify-center px-8 py-20 sm:px-16">
        <div className="w-full max-w-lg rounded-3xl border-2 border-stone-200 bg-white px-10 py-12 shadow-xl">
          {children}
        </div>
      </main>
    </div>
  );
}

