import { DashboardSidebar } from "~/components/layout/DashboardSidebar";
import { DashboardHeader } from "~/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="container mx-auto max-w-7xl p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
