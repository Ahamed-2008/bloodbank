import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, X, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatusBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { HospitalDetails } from "@/components/hospital/hospital-details";
import { adminService } from "@/services/admin-service";
import { formatApiError } from "@/services/api-client";
import type { VerificationStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/hospitals/$hospitalId")({
  head: () => ({
    meta: [
      { title: "Review hospital — BloodLink" },
      { name: "description", content: "Review a hospital's registration and licence, then approve or reject it." },
      { property: "og:title", content: "Review hospital — BloodLink" },
      { property: "og:description", content: "Hospital verification review." },
    ],
  }),
  component: HospitalReviewPage,
});

export function HospitalReviewPage() {
  const { hospitalId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "hospital", hospitalId],
    queryFn: () => adminService.getHospital(hospitalId),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "hospital", hospitalId] });
    void qc.invalidateQueries({ queryKey: ["admin", "hospitals"] });
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const approve = useMutation({
    mutationFn: () => adminService.approveHospital(hospitalId),
    onSuccess: (data) => {
      refresh();
      toast.success(data?.message || "Hospital approved successfully. Staff account activated.");
    },
    onError: (e) => {
      toast.error(formatApiError(e));
    },
  });

  const reject = useMutation({
    mutationFn: () => adminService.rejectHospital(hospitalId, reason.trim()),
    onSuccess: (data) => {
      refresh();
      setOpen(false);
      setReason("");
      toast.success(data?.message || "Hospital rejected successfully.");
    },
    onError: (e) => {
      toast.error(formatApiError(e));
    },
  });

  if (q.isPending) return <LoadingState rows={3} />;
  if (q.isError) {
    return (
      <ErrorState
        message={formatApiError(q.error)}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const h = q.data;
  const primaryVerification = h.hospital_verifications?.[0];
  const effectiveStatus: VerificationStatus = h.is_verified
    ? "Approved"
    : primaryVerification?.status ?? "Pending";
  const isRejected = effectiveStatus.toLowerCase() === "rejected";
  const isApproved = h.is_verified || effectiveStatus.toLowerCase() === "approved";
  const rejectionReason = primaryVerification?.rejection_reason;

  const handleRejectSubmit = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setErr("Please provide a clear rejection reason (minimum 10 characters).");
      return;
    }
    if (trimmed.length > 500) {
      setErr("Rejection reason cannot exceed 500 characters.");
      return;
    }
    reject.mutate();
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/hospitals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> All hospitals
      </Link>

      <PageHeader
        title={h.name}
        description={`${h.city}, ${h.state}`}
        actions={
          <>
            {!isApproved ? (
              <ConfirmDialog
                title={`Approve ${h.name}?`}
                description="Approving will verify this hospital and activate its primary administrator staff account to post blood alerts."
                confirmLabel="Approve hospital"
                onConfirm={() => approve.mutate()}
                trigger={
                  <Button disabled={approve.isPending}>
                    <Check className="size-4" aria-hidden />
                    {approve.isPending ? "Approving…" : "Approve"}
                  </Button>
                }
              />
            ) : null}

            {!isApproved && !isRejected ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <X className="size-4" aria-hidden />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject hospital registration</DialogTitle>
                    <DialogDescription>
                      The rejection reason is recorded in the system so the hospital can address compliance issues and reapply.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">
                      Rejection reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reject-reason"
                      rows={4}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setErr(null);
                      }}
                      aria-invalid={Boolean(err)}
                      placeholder="e.g. State blood bank licence has expired or registration number could not be validated with state registry."
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Must be 10–500 characters</span>
                      <span>{reason.trim().length}/500</span>
                    </div>
                    {err ? (
                      <p role="alert" className="text-xs text-destructive">
                        {err}
                      </p>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={reject.isPending}
                      onClick={handleRejectSubmit}
                    >
                      {reject.isPending ? "Rejecting…" : "Confirm Rejection"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={effectiveStatus} />
        <span className="text-xs text-muted-foreground">
          Type: <strong>{h.hospital_type}</strong>
        </span>
        <span className="text-xs text-muted-foreground">
          Registration: <strong className="font-mono">{h.registration_number}</strong>
        </span>
      </div>

      {isRejected && rejectionReason ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 text-sm flex gap-3 items-start">
          <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-destructive">Rejection Reason</p>
            <p className="mt-1 text-foreground">{rejectionReason}</p>
          </div>
        </div>
      ) : null}

      <HospitalDetails hospital={h} />

      {h.hospital_staff && h.hospital_staff.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <h3 className="font-semibold text-foreground">Associated Hospital Staff</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h.hospital_staff.map((staff) => (
                  <TableRow key={staff.staff_id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {staff.phone}
                    </TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell>
                      <StatusBadge status={staff.is_active ? "Active" : "Pending"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
