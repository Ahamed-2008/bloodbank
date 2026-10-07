import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary-deep",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    info: "bg-info-soft text-info",
  } as const;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 card-elevated card-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tones[tone])}>
            <Icon className="size-4.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
