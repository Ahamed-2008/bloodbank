import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/state";
import { hospitalService } from "@/services/hospital-service";
import { formatApiError } from "@/services/api-client";
import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  URGENCY_LEVELS,
  type BloodGroup,
  type Department,
} from "@/lib/types";

export const Route = createFileRoute("/hospital/alerts/new")({
  head: () => ({
    meta: [
      { title: "Create blood alert — BloodLink" },
      {
        name: "description",
        content: "Raise an emergency blood request and notify eligible donors near your hospital.",
      },
      { property: "og:title", content: "Create blood alert — BloodLink" },
      { property: "og:description", content: "Broadcast urgent blood requirements to nearby donors." },
    ],
  }),
  component: CreateAlertPage,
});

interface FormState {
  blood_group: BloodGroup;
  units_needed: number;
  urgency: "Critical" | "High" | "Normal";
  department: Department;
  patient_ref: string;
  patient_condition: string;
  radius_km: number;
  auto_expand_radius: boolean;
}

const INITIAL_FORM: FormState = {
  blood_group: "O+",
  units_needed: 1,
  urgency: "Normal",
  department: "Emergency",
  patient_ref: "REF-001",
  patient_condition: "Emergency requirement",
  radius_km: 10,
  auto_expand_radius: false,
};

function CreateAlertPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const createAlertMutation = useMutation({
    mutationFn: hospitalService.createAlert,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["hospital", "alerts"] });
      toast.success(data.message || "Alert posted successfully.");
      void navigate({
        to: "/hospital/alerts/$alertId",
        params: { alertId: data.alert.alert_id },
      });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Partial<Record<keyof FormState, string>> = {};

    if (!form.blood_group) err.blood_group = "Select a blood group.";
    if (!Number.isInteger(form.units_needed) || form.units_needed < 1 || form.units_needed > 10) {
      err.units_needed = "Units needed must be an integer between 1 and 10.";
    }
    if (!form.department) err.department = "Select a department.";
    if (form.patient_ref && form.patient_ref.length > 50) {
      err.patient_ref = "Patient reference must be 50 characters or fewer.";
    }
    if (form.patient_condition && form.patient_condition.length > 500) {
      err.patient_condition = "Patient condition must be 500 characters or fewer.";
    }
    if (form.radius_km < 1 || form.radius_km > 50) {
      err.radius_km = "Search radius must be between 1 and 50 km.";
    }

    setErrors(err);
    if (Object.keys(err).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    createAlertMutation.mutate({
      blood_group: form.blood_group,
      units_needed: form.units_needed,
      urgency: form.urgency,
      department: form.department,
      patient_ref: form.patient_ref.trim() || undefined,
      patient_condition: form.patient_condition.trim() || undefined,
      radius_km: form.radius_km,
      auto_expand_radius: form.auto_expand_radius,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create blood alert"
        description="Notify eligible and compatible blood donors within your area."
      />

      <form onSubmit={submit} className="max-w-2xl space-y-6" noValidate>
        <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <legend className="px-1 text-sm font-semibold">Blood requirement details</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood group</Label>
              <Select
                value={form.blood_group}
                onValueChange={(v) => setForm({ ...form, blood_group: v as BloodGroup })}
              >
                <SelectTrigger id="blood_group">
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
              <Label htmlFor="units_needed">Units needed (1–10)</Label>
              <Input
                id="units_needed"
                type="number"
                min={1}
                max={10}
                value={form.units_needed}
                onChange={(e) => setForm({ ...form, units_needed: parseInt(e.target.value, 10) || 1 })}
              />
              {errors.units_needed ? (
                <p className="text-xs text-destructive">{errors.units_needed}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency level</Label>
              <Select
                value={form.urgency}
                onValueChange={(v) => setForm({ ...form, urgency: v as FormState["urgency"] })}
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm({ ...form, department: v as Department })}
              >
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patient_ref">Patient reference / Bed number (optional)</Label>
              <Input
                id="patient_ref"
                value={form.patient_ref}
                onChange={(e) => setForm({ ...form, patient_ref: e.target.value })}
                placeholder="e.g. ICU-BED-04"
                maxLength={50}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patient_condition">Clinical condition / Notes (optional)</Label>
              <Textarea
                id="patient_condition"
                rows={3}
                value={form.patient_condition}
                onChange={(e) => setForm({ ...form, patient_condition: e.target.value })}
                placeholder="Emergency surgery blood loss"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius_km">Search radius (1–50 km)</Label>
              <Input
                id="radius_km"
                type="number"
                min={1}
                max={50}
                value={form.radius_km}
                onChange={(e) => setForm({ ...form, radius_km: parseInt(e.target.value, 10) || 10 })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
              <div>
                <Label htmlFor="auto_expand" className="text-sm font-medium">
                  Auto-expand radius
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gradually increase notification radius if units are not fulfilled.
                </p>
              </div>
              <Switch
                id="auto_expand"
                checked={form.auto_expand_radius}
                onCheckedChange={(checked) => setForm({ ...form, auto_expand_radius: checked })}
              />
            </div>
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={createAlertMutation.isPending}>
          {createAlertMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Broadcast blood alert
        </Button>
      </form>
    </div>
  );
}
