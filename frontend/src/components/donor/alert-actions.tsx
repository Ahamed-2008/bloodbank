import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CheckCircle2, Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatApiError } from "@/services/api-client";
import type { ActiveAlertItem } from "@/lib/types";

export function AlertActions({
  alert,
  currentResponseStatus,
}: {
  alert: ActiveAlertItem;
  currentResponseStatus?: string | null;
}) {
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<string>("30");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["donor"] });
  };

  const acceptMutation = useMutation({
    mutationFn: (eta?: number) => donorService.acceptAlert(alert.alert_id, eta),
    onSuccess: (data) => {
      invalidate();
      setAcceptOpen(false);
      toast.success("Alert accepted successfully!", {
        description: `Please proceed to ${data.hospital?.name ?? alert.hospitals?.name ?? "the hospital"}.`,
      });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => donorService.declineAlert(alert.alert_id),
    onSuccess: () => {
      invalidate();
      toast("Request declined");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const arriveMutation = useMutation({
    mutationFn: () => donorService.markArrived(alert.alert_id),
    onSuccess: () => {
      invalidate();
      toast.success("Arrival confirmed", {
        description: "Please check in with hospital staff at reception.",
      });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  // If already confirmed or donated
  if (currentResponseStatus === "Donated") {
    return <StatusBadge status="Donated" />;
  }

  // If arrived
  if (currentResponseStatus === "Arrived") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-deep">
        <CheckCircle2 className="size-3.5" /> Arrived at hospital
      </span>
    );
  }

  // If accepted, give option to mark arrived
  if (currentResponseStatus === "Accepted") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
          Accepted
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={arriveMutation.isPending}
          onClick={() => arriveMutation.mutate()}
        >
          {arriveMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <MapPin className="size-3.5 text-primary" aria-hidden />
          )}
          Mark Arrived
        </Button>
      </div>
    );
  }

  if (alert.status !== "Active" && alert.status !== "open") {
    return <StatusBadge status={alert.status} />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Check className="size-4" aria-hidden />
            Accept Alert
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Blood Request</DialogTitle>
            <DialogDescription>
              Confirm your willingness to donate at {alert.hospitals?.name ?? "the hospital"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="eta">Estimated arrival time (minutes)</Label>
            <Input
              id="eta"
              type="number"
              min={1}
              max={120}
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(e.target.value)}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">
              Between 1 and 120 minutes. Helps the hospital prepare.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcceptOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={acceptMutation.isPending}
              onClick={() => {
                const parsed = parseInt(etaMinutes, 10);
                const eta = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
                acceptMutation.mutate(eta);
              }}
            >
              {acceptMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Confirm Acceptance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title="Decline this blood request?"
        description="The hospital will look for other donors. You won't be alerted about this request again."
        confirmLabel="Decline"
        destructive
        onConfirm={() => declineMutation.mutate()}
        trigger={
          <Button size="sm" variant="outline" disabled={declineMutation.isPending}>
            {declineMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <X className="size-4" aria-hidden />
            )}
            Decline
          </Button>
        }
      />
    </div>
  );
}
