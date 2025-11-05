import Link from "next/link";
import { Dumbbell, Users, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

export default async function Home() {
  const session = await auth();
  const programs = await api.program.getAll();

  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SocialTrainer</span>
            </Link>
            <nav className="flex items-center space-x-4">
              {session ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/api/auth/signout">Sign out</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/api/auth/signin">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/api/auth/signin">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700/25" />
          <div className="container relative mx-auto px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4" variant="secondary">
                Built for Social Media Coaches
              </Badge>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Your Coaching Platform,{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Simplified
                </span>
              </h1>
              <p className="mb-8 text-xl text-muted-foreground">
                Stop juggling spreadsheets, DMs, and payment processors. 
                Manage your entire coaching business in one powerful platform.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="group">
                  <Link href={session ? "/dashboard" : "/api/auth/signin"}>
                    {session ? "Go to Dashboard" : "Start Free Trial"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
              {session && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Welcome back, {session.user.name}! 👋
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-b bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-sm text-muted-foreground">Active Coaches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">10k+</div>
                <div className="text-sm text-muted-foreground">Clients Trained</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50k+</div>
                <div className="text-sm text-muted-foreground">Workouts Logged</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4.9★</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold">
                Everything You Need to Scale
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                From program creation to client management, we've got you covered
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Program Management</CardTitle>
                  <CardDescription>
                    Create unlimited coaching programs with custom pricing, duration, and capacity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Flexible program structure
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Custom workout templates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Progress tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Client Management</CardTitle>
                  <CardDescription>
                    Keep track of all your clients in one organized dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Automated enrollment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Performance insights
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Communication tools
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Automated Workflows</CardTitle>
                  <CardDescription>
                    Focus on coaching while we handle the administrative work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Automatic notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Workout scheduling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Payment processing
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="border-t bg-muted/30 py-24">
            <div className="container mx-auto px-4">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold">Featured Programs</h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Join thousands of clients transforming their lives
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programs.slice(0, 6).map((program) => (
                  <Card key={program.id} className="group transition-all hover:shadow-xl">
                    <CardHeader>
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={program.coach.user.image ?? ""} />
                          <AvatarFallback>
                            {program.coach.user.name?.charAt(0) ?? "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{program.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {program.coach.user.name}
                          </p>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold text-primary">
                            ${program.price}
                          </div>
                          <div className="text-sm text-muted-foreground">per month</div>
                        </div>
                        <Badge variant="secondary">{program.duration} weeks</Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href={`/programs/${program.id}`}>
                          View Program
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-4xl font-bold">
                Ready to Transform Your Coaching Business?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join hundreds of coaches who've simplified their workflow and scaled their impact
              </p>
              <Button size="lg" asChild>
                <Link href={session ? "/dashboard" : "/api/auth/signin"}>
                  {session ? "Go to Dashboard" : "Start Your Free Trial"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="font-semibold">SocialTrainer</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 SocialTrainer. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
