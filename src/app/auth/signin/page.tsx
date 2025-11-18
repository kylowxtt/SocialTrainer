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
  ArrowRight,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type AuthMethodIcon = ComponentType<{ className?: string }>;

type AuthMethod = {
  id: string;
  label: string;
  description: string;
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

const GoogleIcon: AuthMethodIcon = ({ className }) => (
  <svg
    aria-hidden
    focusable="false"
    className={cn("h-6 w-6", className)}
    viewBox="0 0 24 24"
    role="presentation"
    fill="currentColor"
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const InstagramIcon: AuthMethodIcon = ({ className }) => (
  <svg
    aria-hidden
    focusable="false"
    className={cn("h-6 w-6", className)}
    viewBox="0 0 24 24"
    role="presentation"
    fill="currentColor"
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const AUTH_METHODS: AuthMethod[] = [
  {
    id: "discord",
    label: "Continue with Discord",
    description: "Streamline client management through your community server",
    icon: DiscordIcon,
    available: true,
  },
  {
    id: "google",
    label: "Continue with Google",
    description: "Sign in quickly with your Google account",
    icon: GoogleIcon,
    available: true,
  },
  {
    id: "instagram",
    label: "Continue with Instagram",
    description: "Connect using your Instagram account",
    icon: InstagramIcon,
    available: true,
  },
  {
    id: "email",
    label: "Email magic link",
    description: "Secure, passwordless authentication",
    icon: ({ className }) => <Lock className={cn("h-6 w-6", className)} />,
    available: false,
    comingSoonCopy: "Coming soon",
  },
];

const WHY_DISCORD_FEATURES = [
  {
    title: "Automated Access Control",
    description: "Sync premium roles and manage client permissions automatically",
    icon: ShieldCheck,
  },
  {
    title: "Launch Drops That Convert",
    description: "Trigger announcements when new programs go live",
    icon: Zap,
  },
  {
    title: "Keep The Vibe On-Brand",
    description: "Customize flows and templates to match your identity",
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
    <div className="flex flex-col gap-8">
      <header className="space-y-6">
        <Button 
          variant="ghost" 
          className="group gap-2 self-start text-stone-600 hover:text-stone-900 hover:bg-stone-50" 
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>
        </Button>

        <div className="space-y-4">
          <div className="inline-block px-4 py-2 bg-lime-400/20 rounded-full">
            <span className="text-xs uppercase tracking-wider text-stone-900">For Fitness Coaches</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl uppercase tracking-tighter leading-tight">
            Sign in to your<br />
            <span className="italic">Coaching HQ</span>
          </h1>
          
          <p className="text-base text-stone-600 max-w-md leading-relaxed">
            Access your dashboard to build programs, manage clients, and track conversions in real-time.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="space-y-3">
          {AUTH_METHODS.map((method) => (
            <AuthMethodButton
              key={method.id}
              method={method}
              pendingProvider={pendingProvider}
              onSignIn={() => void handleSignIn(method)}
            />
          ))}
        </div>
        
        <div className="space-y-3 pt-2">
          {["Secure authentication", "5-minute setup", "No credit card required"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-500" />
              <span className="text-xs text-stone-600">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-stone-200 pt-6">
        <p className="text-xs text-stone-500 mb-6 uppercase tracking-wider">
          Why Discord Integration
        </p>
        <div className="grid gap-4">
          {WHY_DISCORD_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-stone-50 rounded-xl p-4 hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-stone-900 uppercase tracking-tight">{feature.title}</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-stone-500 text-center pt-2">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="text-stone-900 underline hover:no-underline">
          Terms
        </Link>
        {" "}and{" "}
        <Link href="/legal/privacy" className="text-stone-900 underline hover:no-underline">
          Privacy Policy
        </Link>
        .
      </p>
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
        "group relative flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left transition-all",
        method.available
          ? "border-stone-900 bg-white hover:bg-stone-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
          : "border-stone-200 bg-stone-50 cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0",
            method.available ? "bg-stone-900" : "bg-stone-300"
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-stone-900 tracking-tight">{method.label}</p>
          <p className="text-xs text-stone-600">{method.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {method.available ? (
          pendingProvider === method.id ? (
            <Loader2 className="h-5 w-5 animate-spin text-stone-900" />
          ) : (
            <ArrowRight className="h-5 w-5 text-stone-900 transition-transform group-hover:translate-x-1" />
          )
        ) : (
          <span className="text-xs text-stone-500 uppercase tracking-wide">{method.comingSoonCopy ?? "Not available"}</span>
        )}
      </div>
    </button>
  );
}


