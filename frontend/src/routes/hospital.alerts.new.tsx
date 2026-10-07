import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/state";
import { hospitalService, type CreateAlertInput } from "@/services/hospital-service";
import { BLOOD_GROUPS, URGENCY_LEVELS } from "@/lib/types";
import { titleCase } from "@/lib/format";

export const Route = createFileRoute("/hospital/alerts/new")({
  head: () => ({
    meta: [
      { title: "Create blood alert — BloodLink" },
      { name: "description", content: "Raise a blood request and notify eligible donors near your hospital." },
      { property: "og:title", content: "Create blood alert — BloodLink" },
      { property: "og:description", content: "Notify nearby donors about an urgent blood need." },
    ],
  }),
  component: CreateAlertPage,
});

type Form = Record<keyof CreateAlertInput, string>;

const INITIAL: Form = {
  bloodGroup: "", unitsRequired: "1", urgency: "urgent", patientCondition: "", neededBy: "",
  contactPhone: "+91 80 4567 1200", address: "98 HAL Airport Road, Kodihalli", city: "Bengaluru",
  state: "Karnataka", pincode: "560017", latitude: "12.9592", longitude: "77.6474", radiusKm: "10", notes: "",
};

function CreateAlertPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  const create = useMutation({
    mutationFn: hospitalService.createAlert,
    onSuccess: (alert) => {
      void qc.invalidateQueries({ queryKey: ["hospital"] });
      toast.success("Alert sent to nearby donors");
      void navigate({ to: "/hospital/alerts/$alertId", params: { alertId: alert.id } });
    },
    onError: () => toast.error("Could not create the alert."),
  });

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Partial<Record<keyof Form, string>> = {};
    if (!form.bloodGroup) err.bloodGroup = "Select a blood group.";
    const units = Number(form.unitsRequired);
    if (!Number.isInteger(units) || units < 1 || units > 20) err.unitsRequired = "Between 1 and 20 units.";
    if (form.patientCondition.trim().length < 3) err.patientCondition = "Describe the patient's condition.";
    if (!form.neededBy) err.neededBy = "Choose when blood is needed by.";
    else if (new Date(form.neededBy) <= new Date()) err.neededBy = "Must be in the future.";
    if (form.contactPhone.replace(/\D/g, "").length < 10) err.contactPhone = "Enter a valid phone number.";
    if (!form.address.trim()) err.address = "Address is required.";
    if (!/^\d{6}$/.test(form.pincode)) err.pincode = "6-digit pincode.";
    if (Math.abs(Number(form.latitude)) > 90 || form.latitude === "") err.latitude = "Invalid latitude.";
    if (Math.abs(Number(form.longitude)) > 180 || form.longitude === "") err.longitude = "Invalid longitude.";
    const r = Number(form.radiusKm);
    if (!(r >= 1 && r <= 50)) err.radiusKm = "Between 1 and 50 km.";
    setErrors(err);
    if (Object.keys(err).length) return toast.error("Please fix the highlighted fields.");
    create.mutate({
      ...form,
      unitsRequired: units,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusKm: r,
      neededBy: new Date(form.neededBy).toISOString(),
    });
  }

  const Err = ({ k }: { k: keyof Form }) =>
    errors[k] ? <p role="alert" className="text-xs text-destructive">{errors[k]}</p> : null;
  const input = (k: keyof Form, props: React.ComponentProps<typeof Input> = {}) => (
    <Input id={k} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={Boolean(errors[k])} {...props} />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Create blood alert" description="Eligible donors within the radius are notified immediately." />
      <form onSubmit={submit} className="max-w-3xl space-y-6" noValidate>
        <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <legend className="px-1 text-sm font-semibold">Request</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood group</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
                <SelectTrigger id="bloodGroup" aria-invalid={Boolean(errors.bloodGroup)}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <Err k="bloodGroup" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitsRequired">Units required</Label>
              {input("unitsRequired", { type: "number", min: 1, max: 20 })}
              <Err k="unitsRequired" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => set("urgency", v)}>
                <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                <SelectContent>{URGENCY_LEVELS.map((u) => <SelectItem key={u} value={u}>{titleCase(u)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patientCondition">Patient condition</Label>
              {input("patientCondition", { placeholder: "Post-surgical blood loss" })}
              <Err k="patientCondition" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neededBy">Needed by</Label>
              {input("neededBy", { type: "datetime-local" })}
              <Err k="neededBy" />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <legend className="px-1 text-sm font-semibold">Location and contact</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Address</Label>{input("address")}<Err k="address" /></div>
            <div className="space-y-2"><Label htmlFor="city">City</Label>{input("city")}</div>
            <div className="space-y-2"><Label htmlFor="state">State</Label>{input("state")}</div>
            <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label>{input("pincode", { inputMode: "numeric", maxLength: 6 })}<Err k="pincode" /></div>
            <div className="space-y-2"><Label htmlFor="contactPhone">Contact phone</Label>{input("contactPhone", { type: "tel" })}<Err k="contactPhone" /></div>
            <div className="space-y-2"><Label htmlFor="latitude">Latitude</Label>{input("latitude", { inputMode: "decimal" })}<Err k="latitude" /></div>
            <div className="space-y-2"><Label htmlFor="longitude">Longitude</Label>{input("longitude", { inputMode: "decimal" })}<Err k="longitude" /></div>
            <div className="space-y-2"><Label htmlFor="radiusKm">Alert radius (km)</Label>{input("radiusKm", { type: "number", min: 1, max: 50 })}<Err k="radiusKm" /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes for donors (optional)</Label>
              <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Report to the blood bank on the ground floor." />
            </div>
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Send alert
        </Button>
      </form>
    </div>
  );
}
