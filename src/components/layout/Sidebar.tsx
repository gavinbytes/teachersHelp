"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  LogOut,
  Menu,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Settings,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

function NavContent() {
  const pathname = usePathname();
  const { data: classes } = useClasses();
  const [gradebookExpanded, setGradebookExpanded] = useState(false);
  const [unitPlansExpanded, setUnitPlansExpanded] = useState(false);

  const isGradebookActive = pathname.includes("/gradebook");
  const isUnitPlansActive = pathname.includes("/unit-plans");

  // Automatically expand sections if on their routes
  const shouldExpandGradebook = gradebookExpanded || isGradebookActive;
  const shouldExpandUnitPlans = unitPlansExpanded || isUnitPlansActive;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-bold">Teachers Help</h1>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) && !pathname.includes("/gradebook") && !pathname.includes("/unit-plans");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Gradebook Section */}
          <div>
            <button
              onClick={() => setGradebookExpanded(!gradebookExpanded)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isGradebookActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span className="flex-1 text-left">Gradebook</span>
              {shouldExpandGradebook ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {shouldExpandGradebook && classes && classes.length > 0 && (
              <div className="ml-7 mt-1 space-y-1 border-l pl-2">
                {classes.map((cls) => {
                  const isActive = pathname === `/classes/${cls.id}/gradebook`;
                  return (
                    <Link
                      key={cls.id}
                      href={`/classes/${cls.id}/gradebook`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      {cls.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unit Plans Section */}
          <div>
            <button
              onClick={() => setUnitPlansExpanded(!unitPlansExpanded)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isUnitPlansActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="flex-1 text-left">Unit Plans</span>
              {shouldExpandUnitPlans ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {shouldExpandUnitPlans && classes && classes.length > 0 && (
              <div className="ml-7 mt-1 space-y-1 border-l pl-2">
                {classes.map((cls) => {
                  const isActive = pathname === `/classes/${cls.id}/unit-plans`;
                  return (
                    <Link
                      key={cls.id}
                      href={`/classes/${cls.id}/unit-plans`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      {cls.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar Link */}
          <Link
            href="/calendar"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/calendar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Link>
        </nav>
      </ScrollArea>
      <div className="border-t p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 border-r bg-card md:block">
        <NavContent />
      </aside>
    </>
  );
}
