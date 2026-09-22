import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen relative z-10 overflow-hidden bg-background text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <Navbar />
        <div className="px-margin-mobile md:px-margin-desktop py-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
