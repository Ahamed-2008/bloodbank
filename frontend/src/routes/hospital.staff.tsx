import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { hospitalService } from "@/services/hospital-service";
import { formatDate } from "@/lib/format";
import type { StaffRole } from "@/lib/types";

export const Route = createFileRoute("/hospital/staff")({
  head: () => ({
    meta: [
      { title: "Staff management — BloodLink" },
      { name: "description", content: "Manage the administrators and operators who can raise blood alerts for your hospital." },
      { property: "og:title", content: "Staff management — BloodLink" },
      { property: "og:description", content: "Add and view hospital staff." },
    ],
  }),
  component: StaffPage,
});

const EMPTY = { name: "", phone: "", email: "", role: "operator" as StaffRole };

function StaffPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hospital", "staff"], queryFn: hospitalService.getStaff });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: hospitalService.addStaff,
    onSuccess: (s) => {
      void qc.invalidateQueries({ queryKey: ["hospital", "staff"] });
      toast.success(`${s.name} added`);
      setOpen(false);
      setForm(EMPTY);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError("Enter the staff member's name.");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid email.");
    setError(null);
    add.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="People who can raise and manage alerts for your hospital."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><UserPlus className="size-4" aria-hidden />Add staff</Button></DialogTrigger>
            <DialogContent>
              <form onSubmit={submit} noValidate className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add staff member</DialogTitle>
                  <DialogDescription>They'll sign in with this phone number.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2"><Label htmlFor="s-name">Name</Label><Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="s-phone">Phone</Label><Input id="s-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="s-email">Email</Label><Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label htmlFor="s-role">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}>
                    <SelectTrigger id="s-role"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="operator">Operator</SelectItem></SelectContent>
                  </Select>
                </div>
                {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
                <DialogFooter>
                  <Button type="submit" disabled={add.isPending}>
                    {add.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}Add staff
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {q.isPending ? <LoadingState /> : q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : q.data.length === 0 ? (
        <EmptyState title="No staff yet" description="Add the first person who can manage alerts." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead className="hidden lg:table-cell">Email</TableHead><TableHead>Role</TableHead><TableHead className="hidden sm:table-cell">Added</TableHead></TableRow></TableHeader>
            <TableBody>
              {q.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground md:hidden">{s.phone}</p></TableCell>
                  <TableCell className="hidden md:table-cell">{s.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{s.email}</TableCell>
                  <TableCell>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${s.role === "admin" ? "border-primary/25 bg-primary-soft text-primary-deep" : "border-border bg-muted text-muted-foreground"}`}>
                      {s.role === "admin" ? "Admin" : "Operator"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(s.addedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
