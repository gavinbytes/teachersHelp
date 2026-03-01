"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const authPages = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="container mx-auto p-6 pt-16 md:pt-6">{children}</div>
      </main>
    </div>
  );
}
