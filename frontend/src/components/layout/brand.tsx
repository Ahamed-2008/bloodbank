import { Link } from "@tanstack/react-router";
import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}
      aria-label="BloodLink home"
    >
      <span className="grid size-9 place-items-center rounded-xl brand-surface shadow-sm">
        <Droplet className="size-5 fill-current" aria-hidden />
      </span>
      <span className="text-lg">
        Blood<span className="text-primary">Link</span>
      </span>
    </Link>
  );
}
