import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./brand";
import { ROLE_HOME, useAuth } from "@/lib/auth-context";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/register-hospital", label: "For hospitals" },
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to={ROLE_HOME[user.role]}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">Donate blood</Link>
                </Button>
              </>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="px-4">Menu</SheetTitle>
                <nav className="mt-2 flex flex-col gap-1 px-2" aria-label="Mobile">
                  {LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    Sign in
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              BloodLink connects verified hospitals with nearby eligible donors so urgent blood
              requests reach the right people within minutes.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/how-it-works" className="hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/register-hospital" className="hover:text-foreground">
                  Hospital registration
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground">
                  Donor sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Emergency</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              For medical emergencies always contact your nearest hospital directly. BloodLink
              supports coordination and does not replace emergency services.
            </p>
          </div>
        </div>
        <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BloodLink. Demo interface with sample data.
        </div>
      </footer>
    </div>
  );
}
