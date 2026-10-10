import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
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
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import { formatApiError } from "@/services/api-client";
import { useAuth } from "@/lib/auth-context";
import { BLOOD_GROUPS, GENDERS, type BloodGroup, type Gender } from "@/lib/types";

export const Route = createFileRoute("/donor/profile")({
  head: () => ({
    meta: [
      { title: "Donor profile — BloodLink" },
      {
        name: "description",
        content: "Update your name, blood group, date of birth and gender for blood requests.",
      },
      { property: "og:title", content: "Donor profile — BloodLink" },
      { property: "og:description", content: "Manage your donor profile." },
    ],
  }),
  component: ProfilePage,
});

interface FormState {
  name: string;
  blood_group: BloodGroup;
  date_of_birth: string;
  gender: Gender;
}

function ProfilePage() {
  const qc = useQueryClient();
  const { updateCurrentUser } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["donor", "profile"],
    queryFn: donorService.getProfile,
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    blood_group: "O+",
    date_of_birth: "2000-01-01",
    gender: "Other",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name ?? "",
        blood_group: profileQuery.data.blood_group ?? "O+",
        date_of_birth: profileQuery.data.date_of_birth
          ? profileQuery.data.date_of_birth.slice(0, 10)
          : "2000-01-01",
        gender: profileQuery.data.gender ?? "Other",
      });
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: donorService.updateProfile,
    onSuccess: (updated) => {
      qc.setQueryData(["donor", "profile"], updated);
      void qc.invalidateQueries({ queryKey: ["donor"] });
      updateCurrentUser({ name: updated.name });
      toast.success("Profile saved successfully");
      setError(null);
    },
    onError: (err) => {
      setError(formatApiError(err));
      toast.error(formatApiError(err));
    },
  });

  if (profileQuery.isPending) {
    return <LoadingState rows={2} />;
  }

  if (profileQuery.isError) {
    return <ErrorState onRetry={() => void profileQuery.refetch()} />;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = form.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    if (!form.date_of_birth) {
      setError("Date of birth is required.");
      return;
    }

    const dob = new Date(form.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18 || age > 65) {
      setError("Donor must be between 18 and 65 years old.");
      return;
    }

    saveMutation.mutate({
      name: trimmedName,
      blood_group: form.blood_group,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
    });
  }

  const p = profileQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Verified hospitals see your name and blood group when you accept an alert."
      />

      {/* Verification Status Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 card-elevated">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Aadhaar Status</p>
          <div className="mt-1 flex items-center gap-2">
            {p.aadhaar_verified ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                <ShieldCheck className="size-4" /> Verified Donor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-warning-foreground">
                <ShieldAlert className="size-4" /> Pending Administrator Verification
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</p>
          <p className="mt-1 font-mono font-medium">{p.phone}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Donor Tier</p>
          <p className="mt-1 font-semibold text-primary">{p.tier} ({p.donor_score} pts)</p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 card-elevated"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Asha Donor"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bg">Blood group</Label>
            <Select
              value={form.blood_group}
              onValueChange={(v) => setForm({ ...form, blood_group: v as BloodGroup })}
            >
              <SelectTrigger id="bg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gen) => (
                  <SelectItem key={gen} value={gen}>
                    {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save profile
        </Button>
      </form>
    </div>
  );
}
