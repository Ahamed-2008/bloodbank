import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import { BLOOD_GROUPS, type DonorProfile } from "@/lib/types";

export const Route = createFileRoute("/donor/profile")({
  head: () => ({
    meta: [
      { title: "Donor profile — BloodLink" },
      { name: "description", content: "Update your name, blood group, date of birth and gender." },
      { property: "og:title", content: "Donor profile — BloodLink" },
      { property: "og:description", content: "Manage your donor profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["donor", "profile"], queryFn: donorService.getProfile });
  const [form, setForm] = useState<DonorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const save = useMutation({
    mutationFn: donorService.updateProfile,
    onSuccess: (data) => {
      qc.setQueryData(["donor", "profile"], data);
      toast.success("Profile saved");
    },
  });

  if (q.isPending || !form) return q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : <LoadingState rows={2} />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (form.name.trim().length < 2) return setError("Enter your full name.");
    if (!form.dateOfBirth) return setError("Enter your date of birth.");
    setError(null);
    save.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Hospitals see your name and blood group when you respond." />
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 card-elevated" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bg">Blood group</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v as DonorProfile["bloodGroup"] })}>
              <SelectTrigger id="bg"><SelectValue /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as DonorProfile["gender"] })}>
              <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save profile
        </Button>
      </form>
    </div>
  );
}
