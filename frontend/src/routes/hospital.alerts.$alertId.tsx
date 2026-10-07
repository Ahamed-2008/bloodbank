import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Phone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { hospitalService } from "@/services/hospital-service";
import { formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/hospital/alerts/$alertId")({
  head: () => ({
    meta: [
      { title: "Manage blood alert — BloodLink" },
      { name: "description", content: "Review donor responses, confirm donations or cancel this blood alert." },
      { property: "og:title", content: "Manage blood alert — BloodLink" },
      { property: "og:description", content: "Donor responses and actions for this alert." },
    ],
  }),
  component: AlertManagePage,
});

function AlertManagePage() {
  const { alertId } = Route.useParams();
  const qc = useQueryClient();
  const alert = useQuery({ queryKey: ["hospital", "alert", alertId], queryFn: () => hospitalService.getAlert(alertId) });
  const responses = useQuery({ queryKey: ["hospital", "responses", alertId], queryFn: () => hospitalService.getResponses(alertId) });
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["hospital"] });
  const confirm = useMutation({
    mutationFn: (rid: string) => hospitalService.confirmDonation(alertId, rid),
    onSuccess: () => { refresh(); toast.success("Donation confirmed"); },
  });
  const cancel = useMutation({
    mutationFn: () => hospitalService.cancelAlert(alertId, reason.trim()),
    onSuccess: () => { refresh(); setCancelOpen(false); toast.success("Alert cancelled"); },
  });

  if (alert.isPending) return <LoadingState rows={3} />;
  if (alert.isError) return <ErrorState message={alert.error.message} onRetry={() => void alert.refetch()} />;
  const a = alert.data;
  const pct = Math.round((a.unitsFulfilled / a.unitsRequired) * 100);

  return (
    <div className="space-y-6">
      <Link to="/hospital/alerts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> My alerts
      </Link>
      <PageHeader
        title={`${a.bloodGroup} · ${a.unitsRequired} units`}
        description={`Raised ${formatDateTime(a.createdAt)} · needed by ${formatDateTime(a.neededBy)}`}
        actions={
          a.status === "open" ? (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><XCircle className="size-4" aria-hidden />Cancel alert</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel this alert?</DialogTitle>
                  <DialogDescription>Donors who responded will be told the request is no longer needed.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for cancelling</Label>
                  <Textarea id="reason" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(null); }} aria-invalid={Boolean(reasonError)} />
                  {reasonError ? <p role="alert" className="text-xs text-destructive">{reasonError}</p> : null}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep alert</Button>
                  <Button
                    variant="destructive"
                    disabled={cancel.isPending}
                    onClick={() => (reason.trim().length < 5 ? setReasonError("Give a short reason (5+ characters).") : cancel.mutate())}
                  >
                    Cancel alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
        <div className="flex flex-wrap items-center gap-3">
          <BloodGroupBadge group={a.bloodGroup} size="lg" />
          <UrgencyBadge urgency={a.urgency} />
          <StatusBadge status={a.status} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{a.patientCondition} · {a.address}, {a.city}</p>
        <div className="mt-5">
          <div className="flex justify-between text-sm"><span>Units fulfilled</span><span className="font-semibold tabular-nums">{a.unitsFulfilled}/{a.unitsRequired}</span></div>
          <Progress value={pct} className="mt-2" aria-label="Units fulfilled" />
        </div>
        {a.status === "cancelled" && a.cancellationReason ? (
          <div className="mt-5 rounded-xl border border-border bg-muted p-4 text-sm">
            <p className="font-semibold">Cancellation reason</p>
            <p className="mt-1 text-muted-foreground">{a.cancellationReason}</p>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Donor responses</h2>
        {responses.isPending ? (
          <LoadingState className="mt-4" />
        ) : (responses.data ?? []).length === 0 ? (
          <div className="mt-4"><EmptyState title="No responses yet" description="Donors who accept will appear here, nearest first." /></div>
        ) : (
          <ul className="mt-4 space-y-3">
            {[...(responses.data ?? [])].sort((x, y) => x.distanceKm - y.distanceKm).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 card-elevated">
                <div className="flex items-center gap-3">
                  <BloodGroupBadge group={r.bloodGroup} size="sm" />
                  <div>
                    <p className="font-medium">{r.donorName}</p>
                    <p className="text-xs text-muted-foreground">{r.distanceKm} km · responded {timeAgo(r.respondedAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Phone className="size-3.5" aria-hidden />{r.phone}
                  </a>
                  <StatusBadge status={r.status} />
                  {a.status === "open" && (r.status === "accepted" || r.status === "pending") ? (
                    <ConfirmDialog
                      title={`Confirm donation from ${r.donorName}?`}
                      description="This records one unit as fulfilled and updates the donor's history."
                      confirmLabel="Confirm donation"
                      onConfirm={() => confirm.mutate(r.id)}
                      trigger={<Button size="sm" disabled={confirm.isPending}><Check className="size-4" aria-hidden />Confirm</Button>}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
