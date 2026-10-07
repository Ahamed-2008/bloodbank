import { cn } from "@/lib/utils";
import type {
  AlertStatus,
  BloodGroup,
  DonationStatus,
  ResponseStatus,
  Urgency,
  VerificationStatus,
} from "@/lib/types";
import { AlertTriangle, CheckCircle2, Clock, Droplet, XCircle } from "lucide-react";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

export function BloodGroupBadge({
  group,
  size = "md",
  className,
}: {
  group: BloodGroup;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-label={`Blood group ${group}`}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-xl border border-primary/25 bg-primary-soft font-bold text-primary-deep tabular-nums",
        size === "sm" && "h-6 min-w-9 px-1.5 text-xs",
        size === "md" && "h-8 min-w-11 px-2 text-sm",
        size === "lg" && "h-14 min-w-16 px-3 text-2xl",
        className,
      )}
    >
      <Droplet
        className={cn("shrink-0 fill-current", size === "lg" ? "size-5" : "size-3")}
        aria-hidden
      />
      {group}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const map: Record<Urgency, { label: string; className: string }> = {
    critical: {
      label: "Critical",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
    urgent: { label: "Urgent", className: "border-warning/40 bg-warning-soft text-warning-foreground" },
    routine: { label: "Routine", className: "border-info/30 bg-info-soft text-info" },
  };
  const item = map[urgency];
  return (
    <span className={cn(chip, item.className)}>
      {urgency === "critical" && <AlertTriangle className="size-3.5" aria-hidden />}
      {item.label}
    </span>
  );
}

type AnyStatus =
  | AlertStatus
  | ResponseStatus
  | DonationStatus
  | VerificationStatus
  | "eligible"
  | "not_eligible";

const STATUS_MAP: Record<AnyStatus, { label: string; className: string; icon?: "ok" | "no" | "wait" }> = {
  open: { label: "Open", className: "border-success/30 bg-success-soft text-success", icon: "ok" },
  fulfilled: { label: "Fulfilled", className: "border-info/30 bg-info-soft text-info", icon: "ok" },
  cancelled: { label: "Cancelled", className: "border-border bg-muted text-muted-foreground", icon: "no" },
  expired: { label: "Expired", className: "border-border bg-muted text-muted-foreground", icon: "no" },
  pending: { label: "Pending", className: "border-warning/40 bg-warning-soft text-warning-foreground", icon: "wait" },
  accepted: { label: "Accepted", className: "border-info/30 bg-info-soft text-info", icon: "ok" },
  declined: { label: "Declined", className: "border-border bg-muted text-muted-foreground", icon: "no" },
  confirmed: { label: "Confirmed", className: "border-success/30 bg-success-soft text-success", icon: "ok" },
  completed: { label: "Completed", className: "border-success/30 bg-success-soft text-success", icon: "ok" },
  deferred: { label: "Deferred", className: "border-warning/40 bg-warning-soft text-warning-foreground", icon: "wait" },
  verified: { label: "Verified", className: "border-success/30 bg-success-soft text-success", icon: "ok" },
  rejected: { label: "Rejected", className: "border-destructive/30 bg-destructive/10 text-destructive", icon: "no" },
  eligible: { label: "Eligible to donate", className: "border-success/30 bg-success-soft text-success", icon: "ok" },
  not_eligible: { label: "Not eligible yet", className: "border-warning/40 bg-warning-soft text-warning-foreground", icon: "wait" },
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const item = STATUS_MAP[status];
  return (
    <span className={cn(chip, item.className, className)}>
      {item.icon === "ok" && <CheckCircle2 className="size-3.5" aria-hidden />}
      {item.icon === "no" && <XCircle className="size-3.5" aria-hidden />}
      {item.icon === "wait" && <Clock className="size-3.5" aria-hidden />}
      {item.label}
    </span>
  );
}
