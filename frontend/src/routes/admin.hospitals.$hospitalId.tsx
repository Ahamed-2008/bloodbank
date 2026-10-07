import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatusBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { HospitalDetails } from "@/components/hospital/hospital-details";
import { adminService } from "@/services/admin-service";

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

function HospitalReviewPage() {
  const { hospitalId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "hospital", hospitalId], queryFn: () => adminService.getHospital(hospitalId) });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin"] });
  const approve = useMutation({ mutationFn: () => adminService.approveHospital(hospitalId), onSuccess: () => { refresh(); toast.success("Hospital approved"); } });
  const reject = useMutation({
    mutationFn: () => adminService.rejectHospital(hospitalId, reason.trim()),
    onSuccess: () => { refresh(); setOpen(false); toast.success("Hospital rejected"); },
  });

  if (q.isPending) return <LoadingState rows={3} />;
  if (q.isError) return <ErrorState message={q.error.message} onRetry={() => void q.refetch()} />;
  const h = q.data;

  return (
    <div className="space-y-6">
      <Link to="/admin/hospitals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All hospitals
      </Link>
      <PageHeader
        title={h.name}
        description={`${h.city}, ${h.state}`}
        actions={
          <>
            {h.verificationStatus !== "verified" ? (
              <ConfirmDialog
                title={`Approve ${h.name}?`}
                description="The hospital will be able to raise blood alerts immediately."
                confirmLabel="Approve"
                onConfirm={() => approve.mutate()}
                trigger={<Button disabled={approve.isPending}><Check className="size-4" aria-hidden />Approve</Button>}
              />
            ) : null}
            {h.verificationStatus !== "rejected" ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button variant="outline"><X className="size-4" aria-hidden />Reject</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject this hospital?</DialogTitle>
                    <DialogDescription>The reason is shared with the hospital so they can fix and reapply.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">Rejection reason</Label>
                    <Textarea id="reject-reason" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} aria-invalid={Boolean(err)} placeholder="Blood bank licence has expired…" />
                    {err ? <p role="alert" className="text-xs text-destructive">{err}</p> : null}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Go back</Button>
                    <Button variant="destructive" disabled={reject.isPending} onClick={() => (reason.trim().length < 10 ? setErr("Give a clear reason (10+ characters).") : reject.mutate())}>
                      Reject hospital
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={h.verificationStatus} />
      </div>
      {h.verificationStatus === "rejected" && h.rejectionReason ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 text-sm">
          <p className="font-semibold text-destructive">Rejection reason</p>
          <p className="mt-1">{h.rejectionReason}</p>
        </div>
      ) : null}
      <HospitalDetails hospital={h} />
    </div>
  );
}
