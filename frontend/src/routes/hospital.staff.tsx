import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { hospitalService } from "@/services/hospital-service";
import { formatApiError } from "@/services/api-client";
import { formatDate } from "@/lib/format";
import type { AddStaffInput } from "@/lib/types";

export const Route = createFileRoute("/hospital/staff")({
  head: () => ({
    meta: [
      { title: "Staff management — BloodLink" },
      {
        name: "description",
        content:
          "Manage the administrators and operators who can raise blood alerts for your hospital.",
      },
      { property: "og:title", content: "Staff management — BloodLink" },
      { property: "og:description", content: "Add and view hospital staff." },
    ],
  }),
  component: StaffPage,
});

const EMPTY_FORM: AddStaffInput = {
  name: "",
  phone: "+919999900005",
  email: "",
  role: "Operator",
};

function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone.trim();
}

function StaffPage() {
  const qc = useQueryClient();
  const staffQuery = useQuery({
    queryKey: ["hospital", "staff"],
    queryFn: hospitalService.getStaff,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddStaffInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const addStaffMutation = useMutation({
    mutationFn: hospitalService.addStaff,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["hospital", "staff"] });
      toast.success(data.message || `Staff member added successfully`);
      setOpen(false);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => {
      setError(formatApiError(err));
      toast.error(formatApiError(err));
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    if (name.length < 2 || name.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    const cleanPhone = formatIndianPhone(form.phone);
    if (!/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Enter a valid Indian phone number (+91 followed by 10 digits).");
      return;
    }

    const email = form.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    addStaffMutation.mutate({
      name,
      phone: cleanPhone,
      email: email || undefined,
      role: form.role,
    });
  }

  const staffList = staffQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="Authorised staff who can broadcast blood alerts and confirm donations."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="size-4" aria-hidden />
                Add staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={submit} noValidate className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add staff member</DialogTitle>
                  <DialogDescription>
                    They can sign in to manage blood requests using their phone number.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input
                    id="s-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Staff Member"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-phone">Phone number (+91...)</Label>
                  <Input
                    id="s-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+919999900005"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-email">Email address (optional)</Label>
                  <Input
                    id="s-email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s-role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as "Admin" | "Operator" })}
                  >
                    <SelectTrigger id="s-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin (can add staff & manage alerts)</SelectItem>
                      <SelectItem value="Operator">Operator (manage alerts & responses)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <DialogFooter>
                  <Button type="submit" disabled={addStaffMutation.isPending}>
                    {addStaffMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Add staff member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {staffQuery.isPending ? (
        <LoadingState />
      ) : staffQuery.isError ? (
        <ErrorState onRetry={() => void staffQuery.refetch()} />
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No staff members registered"
          description="Add administrators or operators for your hospital."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((s) => (
                <TableRow key={s.staff_id}>
                  <TableCell>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{s.phone}</p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-sm md:table-cell">{s.phone}</TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">{s.email || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        s.role === "Admin"
                          ? "border-primary/25 bg-primary-soft text-primary-deep"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="size-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <XCircle className="size-3.5" /> Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {formatDate(s.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
