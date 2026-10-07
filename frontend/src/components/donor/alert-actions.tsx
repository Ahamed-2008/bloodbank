import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import type { BloodAlert } from "@/lib/types";

export function AlertActions({ alert }: { alert: BloodAlert }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (decision: "accepted" | "declined") =>
      donorService.respondToAlert(alert.id, decision),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["donor", "alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["donor", "alert", alert.id] });
      if (updated.myResponse === "accepted")
        toast.success("Thank you for responding", {
          description: `${alert.hospitalName} will contact you shortly.`,
        });
      else toast("Request declined");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not respond."),
  });

  if (alert.status !== "open") return <StatusBadge status={alert.status} />;
  if (alert.myResponse) return <StatusBadge status={alert.myResponse} />;

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate("accepted")}>
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        Accept
      </Button>
      <ConfirmDialog
        title="Decline this request?"
        description="The hospital will look for other donors. You won't be alerted about this request again."
        confirmLabel="Decline"
        destructive
        onConfirm={() => mutation.mutate("declined")}
        trigger={
          <Button size="sm" variant="outline" disabled={mutation.isPending}>
            <X className="size-4" aria-hidden />
            Decline
          </Button>
        }
      />
    </div>
  );
}
