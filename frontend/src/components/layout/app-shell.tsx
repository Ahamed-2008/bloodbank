import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_HOME, useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Section">
      {items.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: exact ?? false }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
          }}
        >
          <Icon className="size-4.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  role,
  roleLabel,
  items,
  children,
}: {
  role: Role;
  roleLabel: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <RequireRole role={role}>
      <div className="min-h-screen bg-surface">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
          <Brand to={ROLE_HOME[role]} />
          <p className="mt-1 mb-5 pl-12 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {roleLabel}
          </p>
          <NavLinks items={items} />
          <div className="mt-auto">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
              <LogOut className="size-4.5" aria-hidden />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 px-4 py-5">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Brand to={ROLE_HOME[role]} />
                  <p className="mt-1 mb-5 pl-12 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {roleLabel}
                  </p>
                  <NavLinks items={items} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
              <span className="truncate text-sm font-semibold lg:hidden">BloodLink</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-left transition-colors hover:bg-accent"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary-deep">
                      {user ? initials(user.name) : "BL"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block max-w-32 truncate text-sm font-semibold">
                      {user?.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{roleLabel}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{user?.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {user?.phone}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:pb-10">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
          aria-label="Quick navigation"
        >
          <ul className="mx-auto flex max-w-lg">
            {items.slice(0, 4).map(({ to, label, icon: Icon, exact }) => (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  activeOptions={{ exact: exact ?? false }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                  )}
                  activeProps={{ className: "text-primary" }}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </RequireRole>
  );
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (user.role !== role) {
      void navigate({ to: ROLE_HOME[user.role], replace: true });
    }
  }, [isLoading, user, role, navigate]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
