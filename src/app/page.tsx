"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Instagram,
  Youtube,
  BarChart3,
  Target,
  Sparkles,
  Shield,
  Clock,
  MessageSquare,
  CreditCard,
  Calendar,
  Star,
  Play,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />
              <Dumbbell className="relative h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SocialTrainer
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <Link href="/auth/signin">Sign in</Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
              asChild
            >
              <Link href="/auth/signin">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="container relative mx-auto px-6 py-32">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/50 px-4 py-1.5 text-sm font-semibold">
                <Sparkles className="mr-2 h-3 w-3" />
                Built for Social Media Coaches
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-tight"
            >
              <span className="block">Monetize Your</span>
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Fitness Empire
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-10 text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              The all-in-one platform that turns your social media following into a thriving coaching business.
              <span className="block mt-2 text-lg text-gray-400">
                Stop juggling DMs, spreadsheets, and payment processors. Start scaling.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 py-6 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105"
                asChild
              >
                <Link href="/auth/signin">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg px-8 py-6 backdrop-blur-sm"
                asChild
              >
                <Link href="#features">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
            >
              {[
                { value: "500+", label: "Active Coaches", icon: Users },
                { value: "$2M+", label: "Revenue Generated", icon: DollarSign },
                { value: "50k+", label: "Clients Trained", icon: Target },
                { value: "4.9★", label: "Average Rating", icon: Star },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-purple-400" />
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Social Media Monetization Section */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-black via-purple-950/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="container relative mx-auto px-6">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/50">
                <TrendingUp className="mr-2 h-3 w-3" />
                Social Media Monetization
              </Badge>
              <h2 className="mb-4 text-5xl font-black tracking-tight">
                Turn Followers Into{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Paying Clients
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                Built specifically for fitness influencers and coaches who want to monetize their social media presence
              </p>
            </motion.div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Instagram,
                title: "Instagram Integration",
                description: "Seamlessly convert your Instagram followers into program members. Share workout previews, track engagement, and automate enrollments.",
                features: ["Direct DM automation", "Story link tracking", "Bio link optimization"],
                gradient: "from-pink-600 to-rose-600",
              },
              {
                icon: Youtube,
                title: "YouTube Program Sales",
                description: "Sell your coaching programs directly from your YouTube videos. Add program links, track conversions, and grow your revenue.",
                features: ["Video link tracking", "Comment automation", "Subscriber conversion"],
                gradient: "from-red-600 to-orange-600",
              },
              {
                icon: BarChart3,
                title: "Revenue Analytics",
                description: "Track exactly which social media posts drive the most revenue. Optimize your content strategy with data-driven insights.",
                features: ["Post performance tracking", "Revenue attribution", "ROI analysis"],
                gradient: "from-purple-600 to-indigo-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl hover:border-white/20 transition-all group">
                  <CardHeader>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feature.features.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 overflow-hidden bg-black">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-5xl font-black tracking-tight">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Scale
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                From program creation to client management, we&apos;ve got you covered
              </p>
            </motion.div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Dumbbell,
                title: "Program Management",
                description: "Create unlimited coaching programs with custom pricing, duration, and capacity",
                features: ["Flexible program structure", "Custom workout templates", "Progress tracking"],
                gradient: "from-orange-600 to-red-600",
              },
              {
                icon: Users,
                title: "Client Management",
                description: "Keep track of all your clients in one organized dashboard",
                features: ["Automated enrollment", "Performance insights", "Communication tools"],
                gradient: "from-blue-600 to-cyan-600",
              },
              {
                icon: Zap,
                title: "Automated Workflows",
                description: "Focus on coaching while we handle the administrative work",
                features: ["Automatic notifications", "Workout scheduling", "Payment processing"],
                gradient: "from-yellow-600 to-orange-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl hover:border-purple-500/50 transition-all group hover:shadow-2xl hover:shadow-purple-500/20">
                  <CardHeader>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feature.features.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-black via-purple-950/20 to-black">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-5xl font-black tracking-tight">
                Built for{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Serious Coaches
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                Advanced features designed to help you scale your coaching business
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CreditCard, title: "Payment Processing", description: "Stripe integration with automated billing" },
              { icon: Calendar, title: "Smart Scheduling", description: "Automated workout delivery and reminders" },
              { icon: MessageSquare, title: "Client Communication", description: "Built-in messaging and support tools" },
              { icon: Shield, title: "Secure & Reliable", description: "Enterprise-grade security and uptime" },
              { icon: Clock, title: "Time-Saving Automation", description: "Reduce admin work by 80%" },
              { icon: TrendingUp, title: "Growth Analytics", description: "Track revenue, clients, and growth metrics" },
              { icon: Target, title: "Goal Tracking", description: "Help clients achieve their fitness goals" },
              { icon: Sparkles, title: "Custom Branding", description: "White-label your coaching platform" },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Card className="border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl hover:border-purple-500/50 transition-all h-full group">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-lg font-bold text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_70%)]" />
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="mb-6 text-5xl font-black tracking-tight">
              Ready to Build Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Fitness Empire?
              </span>
            </h2>
            <p className="mb-10 text-xl text-gray-300 leading-relaxed">
              Join hundreds of coaches who&apos;ve transformed their social media following into a thriving business.
              <span className="block mt-2 text-lg text-gray-400">
                Start your free trial today. No credit card required.
              </span>
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-10 py-7 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105"
                asChild
              >
                <Link href="/auth/signin">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg px-10 py-7 backdrop-blur-sm"
                asChild
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                SocialTrainer
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 SocialTrainer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
