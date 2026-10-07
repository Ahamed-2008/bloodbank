import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Loader2, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { hospitalService } from "@/services/hospital-service";
import { formatApiError } from "@/services/api-client";
import { formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/hospital/alerts/$alertId")({
  head: () => ({
    meta: [
      { title: "Manage blood alert — BloodLink" },
      {
        name: "description",
        content: "Review donor responses, confirm donations or cancel this blood alert.",
      },
      { property: "og:title", content: "Manage blood alert — BloodLink" },
      { property: "og:description", content: "Donor responses and actions for this alert." },
    ],
  }),
  component: AlertManagePage,
});

function AlertManagePage() {
  const { alertId } = Route.useParams();
  const qc = useQueryClient();

  const alertQuery = useQuery({
    queryKey: ["hospital", "alert", alertId],
    queryFn: () => hospitalService.getAlert(alertId),
  });

  const responsesQuery = useQuery({
    queryKey: ["hospital", "responses", alertId],
    queryFn: () => hospitalService.getAlertResponses(alertId),
  });

  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["hospital", "alert", alertId] });
    void qc.invalidateQueries({ queryKey: ["hospital", "responses", alertId] });
    void qc.invalidateQueries({ queryKey: ["hospital", "alerts"] });
  };

  const confirmMutation = useMutation({
    mutationFn: (responseId: string) => hospitalService.confirmDonation(alertId, responseId),
    onSuccess: (data) => {
      refresh();
      toast.success(data.message || "Donation confirmed successfully!");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => hospitalService.cancelAlert(alertId, reason.trim()),
    onSuccess: (data) => {
      refresh();
      setCancelOpen(false);
      toast.success(data.message || "Alert cancelled successfully");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  if (alertQuery.isPending) return <LoadingState rows={3} />;
  if (alertQuery.isError) {
    return (
      <ErrorState
        message={formatApiError(alertQuery.error)}
        onRetry={() => void alertQuery.refetch()}
      />
    );
  }

  const a = alertQuery.data;
  const pct = Math.round(
    Math.min(100, ((a.units_fulfilled ?? 0) / Math.max(1, a.units_needed ?? 1)) * 100),
  );
  const responses = responsesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Link
        to="/hospital/alerts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to hospital alerts
      </Link>

      <PageHeader
        title={`${a.blood_group} blood · ${a.units_needed} units required`}
        description={`Raised on ${formatDateTime(a.created_at)} · Department: ${a.department} · Expires ${formatDateTime(a.expires_at)}`}
        actions={
          a.status === "Active" || a.status === "open" ? (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <XCircle className="size-4" aria-hidden />
                  Cancel alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel this blood alert?</DialogTitle>
                  <DialogDescription>
                    Provide a reason. The alert will be marked as cancelled and donors will be updated.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="reason">Cancellation reason (5–500 chars)</Label>
                  <Textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError(null);
                    }}
                    placeholder="Patient condition stabilized or blood received from another facility..."
                  />
                  {reasonError ? (
                    <p role="alert" className="text-xs text-destructive">
                      {reasonError}
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                    Keep alert active
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (reason.trim().length < 5) {
                        setReasonError("Cancellation reason must be at least 5 characters.");
                        return;
                      }
                      cancelMutation.mutate();
                    }}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Confirm cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
        <div className="flex flex-wrap items-center gap-3">
          <BloodGroupBadge group={a.blood_group} size="lg" />
          <UrgencyBadge urgency={a.urgency} />
          <StatusBadge status={a.status} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Department: <strong className="text-foreground">{a.department}</strong></p>
            {a.patient_ref ? (
              <p className="text-muted-foreground mt-1">Patient Ref: <strong className="text-foreground">{a.patient_ref}</strong></p>
            ) : null}
            {a.patient_condition ? (
              <p className="text-muted-foreground mt-1">Condition: <strong className="text-foreground">{a.patient_condition}</strong></p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground">Notification reach: <strong className="text-foreground">{a.notified_count} donors notified</strong></p>
            <p className="text-muted-foreground mt-1">Accepted count: <strong className="text-foreground">{a.accepted_count} donors accepted</strong></p>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex justify-between text-sm">
            <span>Fulfilment progress</span>
            <span className="font-semibold tabular-nums">
              {a.units_fulfilled} / {a.units_needed} units
            </span>
          </div>
          <Progress value={pct} className="mt-2" aria-label="Units fulfilled" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Donor responses</h2>
        {responsesQuery.isPending ? (
          <LoadingState className="mt-4" />
        ) : responsesQuery.isError ? (
          <div className="mt-4">
            <ErrorState
              message={formatApiError(responsesQuery.error)}
              onRetry={() => void responsesQuery.refetch()}
            />
          </div>
        ) : responses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No donor responses yet"
              description="Eligible donors who accept will appear here. You can confirm donation arrival and completion."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {responses.map((r) => {
              const isConfirmed = r.status === "Donated";
              const canConfirm =
                (a.status === "Active" || a.status === "open") &&
                (r.status === "Accepted" || r.status === "Arrived");

              return (
                <li
                  key={r.response_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 card-elevated"
                >
                  <div className="flex items-center gap-4">
                    <BloodGroupBadge group={r.users?.blood_group ?? a.blood_group} size="sm" />
                    <div>
                      <p className="font-semibold">{r.users?.name || "Donor"}</p>
                      <p className="text-xs text-muted-foreground">
                        Tier: {r.users?.tier ?? "Registered"} ({r.users?.donor_score ?? 0} pts) ·
                        Accepted {timeAgo(r.accepted_at)}
                      </p>
                      {r.eta_minutes ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-primary font-medium">
                          <Clock className="size-3.5" /> Estimated ETA: {r.eta_minutes} mins
                        </p>
                      ) : null}
                      {r.arrived_at ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-success font-medium">
                          <MapPin className="size-3.5" /> Arrived at {formatDateTime(r.arrived_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={r.status} />

                    {canConfirm ? (
                      <ConfirmDialog
                        title={`Confirm donation from ${r.users?.name || "this donor"}?`}
                        description="This records 1 blood unit as fulfilled and marks the donor response as completed. The donor will be locked for a 90-day recovery period."
                        confirmLabel="Confirm donation"
                        onConfirm={() => confirmMutation.mutate(r.response_id)}
                        trigger={
                          <Button size="sm" disabled={confirmMutation.isPending}>
                            <Check className="size-4" aria-hidden />
                            Confirm donation
                          </Button>
                        }
                      />
                    ) : isConfirmed ? (
                      <span className="text-xs font-semibold text-success">Donation recorded</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
