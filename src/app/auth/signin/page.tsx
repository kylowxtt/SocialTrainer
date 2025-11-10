  "use client";

  import type { ComponentType } from "react";
  import { useState } from "react";

  import {
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Lock,
    ShieldCheck,
    Sparkles,
    Zap,
  } from "lucide-react";
  import { signIn } from "next-auth/react";
  import Link from "next/link";

  import { Button } from "~/components/ui/button";
  import { Separator } from "~/components/ui/separator";
  import { cn } from "~/lib/utils";

  type AuthMethodIcon = ComponentType<{ className?: string }>;

  type AuthMethod = {
    id: string;
    label: string;
    description: string;
    gradient: string;
    icon: AuthMethodIcon;
    available: boolean;
    comingSoonCopy?: string;
  };

  const DiscordIcon: AuthMethodIcon = ({ className }) => (
    <svg
      aria-hidden
      focusable="false"
      className={cn("h-6 w-6", className)}
      viewBox="0 0 24 24"
      role="presentation"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M20.317 4.368A19.791 19.791 0 0 0 16.532 3c-.208.364-.44.86-.605 1.248a18.27 18.27 0 0 0-3.854 0A11.812 11.812 0 0 0 11.468 3a19.736 19.736 0 0 0-3.79 1.378C3.954 8.53 3.18 12.58 3.47 16.58a19.9 19.9 0 0 0 4.707 2.384c.38-.516.72-1.064 1.008-1.644a12.716 12.716 0 0 1-1.59-.764c.134-.098.264-.2.39-.304 3 1.378 6.267 1.378 9.213 0 .126.104.256.206.39.304-.509.302-1.039.56-1.59.764.288.58.627 1.128 1.008 1.644a19.897 19.897 0 0 0 4.707-2.384c.386-4.953-.655-8.978-2.886-12.213ZM9.861 14.728c-.9 0-1.642-.82-1.642-1.828 0-1.008.72-1.828 1.642-1.828s1.649.82 1.642 1.828c0 1.008-.72 1.828-1.642 1.828Zm4.278 0c-.9 0-1.642-.82-1.642-1.828 0-1.008.72-1.828 1.642-1.828s1.649.82 1.642 1.828c0 1.008-.719 1.828-1.642 1.828Z" />
    </svg>
  );

  const AUTH_METHODS: AuthMethod[] = [
    {
      id: "discord",
      label: "Continue with Discord",
      description: "Stay in sync with your community and manage coaching directly from your channels.",
      gradient: "from-[#5865F2] to-[#7289DA]",
      icon: DiscordIcon,
      available: true,
    },
    {
      id: "email",
      label: "Email magic link",
      description: "Secure, passwordless access for your team and clients.",
      gradient: "from-purple-500 to-pink-500",
      icon: ({ className }) => <Lock className={cn("h-6 w-6", className)} />,
      available: false,
      comingSoonCopy: "Coming soon",
    },
  ];

  const WHY_DISCORD_FEATURES = [
    {
      title: "Automated access control",
      description: "Sync premium roles, upgrade clients instantly, and never double-handle permissions.",
      icon: ShieldCheck,
    },
    {
      title: "Launch drops that convert",
      description: "Trigger channel announcements and DMs at the exact moment workouts go live.",
      icon: Zap,
    },
    {
      title: "Keep the vibe on-brand",
      description: "Layer custom emoji, welcome flows, and templates that match your coaching identity.",
      icon: Sparkles,
    },
  ];

  export default function SignInPage() {
    const [pendingProvider, setPendingProvider] = useState<string | null>(null);

    const handleSignIn = async (method: AuthMethod) => {
      if (!method.available) return;

      try {
        setPendingProvider(method.id);
        await signIn(method.id, { callbackUrl: "/dashboard" });
      } finally {
        setPendingProvider(null);
      }
    };

    return (
    <div className="flex flex-col gap-12">
      <header className="space-y-8">
        <Button variant="ghost" className="group gap-2 self-start text-white/70 hover:text-white" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to site
          </Link>
        </Button>

        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-purple-500/40 bg-purple-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-purple-200">
            <SparklesPulse className="h-3 w-3" />
            Social-first workflows
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">Sign in to your coaching HQ</h1>
            <p className="max-w-lg text-base text-gray-300">
              Unlock the dashboard to build programs, automate onboarding, and track your clients in real time. Continue with Discord to keep everything your community loves in one place.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="space-y-4">
          {AUTH_METHODS.map((method) => (
            <AuthMethodButton
              key={method.id}
              method={method}
              pendingProvider={pendingProvider}
              onSignIn={() => void handleSignIn(method)}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          By continuing you agree to our
          {" "}
          <Link href="/legal/terms" className="text-purple-200 transition hover:text-purple-100">
            Terms
          </Link>
          {" "}
          and
          {" "}
          <Link href="/legal/privacy" className="text-purple-200 transition hover:text-purple-100">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <Separator className="border-white/10" />

      <section className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Why Discord powers SocialTrainer</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {WHY_DISCORD_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-lg shadow-purple-950/10"
            >
              <feature.icon className="h-5 w-5 text-purple-200" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
    );
  }

  type AuthMethodButtonProps = {
    method: AuthMethod;
    pendingProvider: string | null;
    onSignIn: () => void;
  };

  function AuthMethodButton({ method, pendingProvider, onSignIn }: AuthMethodButtonProps) {
    const Icon = method.icon;

    return (
      <button
        type="button"
        onClick={onSignIn}
        disabled={!method.available || pendingProvider === method.id}
        className={cn(
          "group relative flex w-full items-center justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 px-8 py-7 text-left transition duration-200",
          method.available
            ? "cursor-pointer hover:border-white/20 hover:from-white/10 hover:to-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/80"
            : "cursor-not-allowed opacity-60",
        )}
      >
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "flex aspect-square h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-purple-800/30",
              "bg-gradient-to-br",
              method.gradient,
            )}
          >
            <Icon className="h-7 w-7 shrink-0" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold text-white">{method.label}</p>
            <p className="text-sm text-gray-400">{method.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-purple-100">
          {method.available ? (
            pendingProvider === method.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-purple-200 opacity-70 transition group-hover:opacity-100" />
            )
          ) : (
            <span className="text-purple-200/70">{method.comingSoonCopy ?? "Not available"}</span>
          )}
        </div>
      </button>
    );
}

type SparklesPulseProps = {
  className?: string;
};

const SparklesPulse = ({ className }: SparklesPulseProps) => (
  <span className={cn("relative inline-flex h-3 w-3", className)}>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
    <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-300" />
  </span>
);

