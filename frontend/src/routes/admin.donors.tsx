import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Check, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { adminService } from "@/services/admin-service";
import { formatApiError } from "@/services/api-client";
import { BLOOD_GROUPS, type AdminDonor, type BloodGroup } from "@/lib/types";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/donors")({
  head: () => ({
    meta: [
      { title: "Donor management — BloodLink" },
      { name: "description", content: "Search and filter registered blood donors by verification, blood group and eligibility." },
      { property: "og:title", content: "Donor management — BloodLink" },
      { property: "og:description", content: "All registered donors on BloodLink." },
    ],
  }),
  component: DonorsPage,
});

function DonorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [rejectDonorTarget, setRejectDonorTarget] = useState<AdminDonor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const verifiedParam =
    filter === "pending" ? false : filter === "verified" ? true : undefined;

  const q = useQuery({
    queryKey: ["admin", "donors", filter],
    queryFn: () => adminService.getDonors(verifiedParam),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "donors"] });
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const approveMutation = useMutation({
    mutationFn: (userId: string) => adminService.approveDonor(userId),
    onSuccess: (data) => {
      refresh();
      toast.success(data?.message || "Donor approved successfully.");
    },
    onError: (e) => {
      toast.error(formatApiError(e));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.rejectDonor(userId, reason),
    onSuccess: (data) => {
      refresh();
      setRejectDonorTarget(null);
      setRejectReason("");
      toast.success(data?.message || "Donor rejected successfully.");
    },
    onError: (e) => {
      toast.error(formatApiError(e));
    },
  });

  const handleRejectSubmit = () => {
    if (!rejectDonorTarget) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 10) {
      setRejectError("Please provide a rejection reason (minimum 10 characters).");
      return;
    }
    if (trimmed.length > 500) {
      setRejectError("Rejection reason cannot exceed 500 characters.");
      return;
    }
    rejectMutation.mutate({
      userId: rejectDonorTarget.user_id,
      reason: trimmed,
    });
  };

  const term = search.trim().toLowerCase();
  const rows = (q.data ?? []).filter((d) => {
    const matchesSearch =
      !term ||
      d.name.toLowerCase().includes(term) ||
      d.phone.includes(term);

    const matchesGroup = group === "all" || d.blood_group === group;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donors"
        description="Verify donor identities and manage registered volunteers ready to donate."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All Donors</TabsTrigger>
            <TabsTrigger value="pending">Pending Verification</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-60">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Search name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search donors"
            />
          </div>

          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-36" aria-label="Blood group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {q.isPending ? (
        <LoadingState rows={3} />
      ) : q.isError ? (
        <ErrorState
          message={formatApiError(q.error)}
          onRetry={() => void q.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No donors found"
          description={
            search || group !== "all"
              ? "Try adjusting your search query or blood group filter."
              : "No donors match this verification status."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="hidden sm:table-cell">Eligibility</TableHead>
                <TableHead className="hidden md:table-cell">Tier / Score</TableHead>
                <TableHead className="hidden lg:table-cell">Last Donation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.user_id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{d.phone}</p>
                  </TableCell>
                  <TableCell>
                    <BloodGroupBadge group={d.blood_group} size="sm" />
                  </TableCell>
                  <TableCell>
                    {d.aadhaar_verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3.5" aria-hidden />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="size-3.5" aria-hidden />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={d.is_eligible ? "eligible" : "not_eligible"} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    <span className="font-medium">{d.tier}</span>
                    <span className="text-muted-foreground ml-1">({d.donor_score} pts)</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {d.last_donated_at ? formatDate(d.last_donated_at) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!d.aadhaar_verified ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <ConfirmDialog
                          title={`Approve ${d.name}?`}
                          description="Approving Aadhaar verification will allow this donor to view and accept emergency blood requests."
                          confirmLabel="Approve"
                          onConfirm={() => approveMutation.mutate(d.user_id)}
                          trigger={
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 px-2.5"
                              disabled={approveMutation.isPending}
                            >
                              <Check className="size-3.5" aria-hidden />
                              Approve
                            </Button>
                          }
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setRejectDonorTarget(d);
                            setRejectReason("");
                            setRejectError(null);
                          }}
                        >
                          <X className="size-3.5" aria-hidden />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Verified</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Donor Dialog */}
      <Dialog
        open={Boolean(rejectDonorTarget)}
        onOpenChange={(open) => !open && setRejectDonorTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Donor Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting verification for{" "}
              <strong>{rejectDonorTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="donor-reject-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="donor-reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError(null);
              }}
              aria-invalid={Boolean(rejectError)}
              placeholder="e.g. Identity document details could not be authenticated against records."
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Must be 10–500 characters</span>
              <span>{rejectReason.trim().length}/500</span>
            </div>
            {rejectError ? (
              <p role="alert" className="text-xs text-destructive">
                {rejectError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDonorTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={handleRejectSubmit}
            >
              {rejectMutation.isPending ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
