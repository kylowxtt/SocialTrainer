import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, Dumbbell, TrendingUp, Calendar } from "lucide-react";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const myPrograms = await api.program.getMyPrograms();
  const myEnrollments = await api.enrollment.getMyEnrollments();

  const isCoach = myPrograms.length > 0;
  const isClient = myEnrollments.length > 0;

  // Calculate stats
  const totalClients = myPrograms.reduce((acc, p) => acc + p._count.enrollments, 0);
  const totalWorkouts = myPrograms.reduce((acc, p) => acc + p._count.workouts, 0);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SocialTrainer</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/api/auth/signout">Sign out</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}! 👋
            </p>
          </div>

          {/* Stats Cards for Coaches */}
          {isCoach && (
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Programs
                  </CardTitle>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myPrograms.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total programs created
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Clients
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClients}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all programs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Workouts
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalWorkouts}</div>
                  <p className="text-xs text-muted-foreground">
                    Workout templates created
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg">
                <Link href="/dashboard/programs/new">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Create a Program</CardTitle>
                    <CardDescription>
                      Start coaching by creating your first program
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
              <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg">
                <Link href="/">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Browse Programs</CardTitle>
                    <CardDescription>
                      Find programs to join as a client
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          </div>

          {/* Coach Section */}
          {isCoach && (
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Programs</h2>
                <Button asChild>
                  <Link href="/dashboard/programs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Program
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myPrograms.map((program) => (
                  <Card key={program.id} className="group transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant={program.isActive ? "success" : "secondary"}>
                          {program.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-2xl font-bold text-primary">
                          ${program.price}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-1">{program.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Clients
                          </div>
                          <div className="text-lg font-semibold">
                            {program._count.enrollments}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Dumbbell className="h-4 w-4" />
                            Workouts
                          </div>
                          <div className="text-lg font-semibold">
                            {program._count.workouts}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href={`/dashboard/programs/${program.id}`}>
                          Manage
                        </Link>
                      </Button>
                      <Button className="flex-1" asChild>
                        <Link href={`/dashboard/programs/${program.id}/workouts`}>
                          Workouts
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Client Section */}
          {isClient && (
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Your Enrollments</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="group transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={enrollment.program.coach.user.image ?? ""} />
                          <AvatarFallback>
                            {enrollment.program.coach.user.name?.charAt(0) ?? "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {enrollment.program.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {enrollment.program.coach.user.name}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === "ACTIVE"
                            ? "success"
                            : enrollment.status === "COMPLETED"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Started {new Date(enrollment.startDate).toLocaleDateString()}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href={`/dashboard/programs/${enrollment.program.id}/workouts`}>
                          View Workouts
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isCoach && !isClient && (
            <Card className="border-2 border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription className="text-base">
                  You haven't created any programs or enrolled in any yet.
                  Start your journey today!
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/dashboard/programs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create a Program
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Browse Programs</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

