import type { ReactNode } from "react";

import Link from "next/link";
import { Dumbbell, Sparkles, TrendingUp, Users } from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-white/10 bg-black/60 px-14 py-14 backdrop-blur-xl lg:flex">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/0 to-pink-900/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(147,51,234,0.25),transparent_65%)]" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-pink-600/20 blur-3xl" />
        </div>

        <header className="relative flex items-center justify-between text-sm text-gray-300">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 opacity-70 blur-sm transition-opacity group-hover:opacity-100" />
              <Dumbbell className="relative h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">SocialTrainer</span>
          </Link>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
            Coach Platform
          </span>
        </header>

        <div className="relative space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1 text-sm font-semibold text-purple-200">
            <Sparkles className="h-4 w-4" />
            Built for creators
          </div>
          <h1 className="text-5xl font-black leading-tight">
            Your community.<br />
            Your programs.<br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-400 to-purple-300 bg-clip-text text-transparent">
              One platform.
            </span>
          </h1>
          <p className="max-w-md text-lg text-gray-300">
            Manage workouts, monetise subscriptions, and keep your members engaged with seamless integrations.
          </p>
          <dl className="grid max-w-sm grid-cols-2 gap-4 text-sm text-gray-300">
            {[
              {
                title: "Coaches onboarded",
                value: "500+",
                icon: Users,
              },
              {
                title: "Avg. revenue lift",
                value: "3.2x",
                icon: TrendingUp,
              },
            ].map((stat) => (
              <div key={stat.title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <stat.icon className="mb-3 h-5 w-5 text-purple-300" />
                <dt className="text-xs uppercase tracking-wide text-white/60">{stat.title}</dt>
                <dd className="text-xl font-semibold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer className="relative space-y-2 text-sm text-gray-400">
          {[
            "Automated client onboarding",
            "Seamless workout delivery",
            "Real-time engagement insights",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-400" />
              {item}
            </div>
          ))}
        </footer>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-8 py-20 sm:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(147,51,234,0.15),transparent_40%)]" />
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-black/70 px-12 py-14 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

