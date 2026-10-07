import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicShell } from "@/components/layout/public-shell";
import { PageHeader } from "@/components/common/state";
import { hospitalService } from "@/services/hospital-service";
import { formatApiError } from "@/services/api-client";
import type { RegisterHospitalInput } from "@/lib/types";

export const Route = createFileRoute("/register-hospital")({
  head: () => ({
    meta: [
      { title: "Register your hospital on BloodLink" },
      {
        name: "description",
        content:
          "Apply to join BloodLink as a verified hospital. Submit your registration number, blood bank licence and contact details for review.",
      },
      { property: "og:title", content: "Register your hospital on BloodLink" },
      {
        property: "og:description",
        content: "Submit your registration and licence details for verification.",
      },
    ],
  }),
  component: RegisterHospitalPage,
});

interface FormState {
  name: string;
  registrationNumber: string;
  type: "Government" | "Private" | "Trust" | "Clinic" | "";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  latitude: string;
  longitude: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  licenseNumber: string;
  licenseIssuedDate: string;
  licenseExpiryDate: string;
}

const INITIAL: FormState = {
  name: "City Hospital",
  registrationNumber: "REG-1001",
  type: "Private",
  contactName: "Hospital Admin",
  contactPhone: "+919888800005",
  contactEmail: "admin@example.com",
  latitude: "12.9165",
  longitude: "79.1325",
  address: "Hospital Road",
  pincode: "632001",
  city: "Vellore",
  state: "Tamil Nadu",
  licenseNumber: "LIC-1001",
  licenseIssuedDate: "2024-01-01",
  licenseExpiryDate: "2030-12-31",
};

const TYPES: { value: "Government" | "Private" | "Trust" | "Clinic"; label: string }[] = [
  { value: "Government", label: "Government" },
  { value: "Private", label: "Private" },
  { value: "Trust", label: "Trust" },
  { value: "Clinic", label: "Clinic" },
];

function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone.trim();
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Enter the hospital name (min 2 chars).";
  if (!form.registrationNumber.trim()) errors.registrationNumber = "Registration number is required.";
  if (!form.type) errors.type = "Select the hospital type.";
  if (!form.contactName.trim()) errors.contactName = "Contact person is required.";
  const cleanPhone = formatIndianPhone(form.contactPhone);
  if (!/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
    errors.contactPhone = "Enter a valid Indian phone number (+91 followed by 10 digits).";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
    errors.contactEmail = "Enter a valid email address.";
  }
  const lat = Number(form.latitude);
  if (!form.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = "Latitude must be between -90 and 90.";
  }
  const lng = Number(form.longitude);
  if (!form.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) {
    errors.longitude = "Longitude must be between -180 and 180.";
  }
  if (form.address.trim().length < 3) errors.address = "Enter the street address.";
  if (!/^\d{6,10}$/.test(form.pincode)) errors.pincode = "Pincode must be 6 to 10 characters.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (!form.licenseNumber.trim()) errors.licenseNumber = "Licence number is required.";
  if (!form.licenseIssuedDate) errors.licenseIssuedDate = "Issue date is required.";
  if (!form.licenseExpiryDate) errors.licenseExpiryDate = "Expiry date is required.";
  if (form.licenseIssuedDate && form.licenseExpiryDate && form.licenseExpiryDate <= form.licenseIssuedDate) {
    errors.licenseExpiryDate = "Expiry must be after the issue date.";
  }
  return errors;
}

function RegisterHospitalPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);
    try {
      const payload: RegisterHospitalInput = {
        name: form.name.trim(),
        registration_number: form.registrationNumber.trim(),
        hospital_type: form.type as "Government" | "Private" | "Trust" | "Clinic",
        contact_name: form.contactName.trim(),
        contact_phone: formatIndianPhone(form.contactPhone),
        contact_email: form.contactEmail.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        license_number: form.licenseNumber.trim(),
        license_issued_at: form.licenseIssuedDate,
        license_expires_at: form.licenseExpiryDate,
      };

      const result = await hospitalService.registerHospital(payload);
      setSubmittedId(result.hospital_id);
      toast.success("Application submitted successfully", {
        description: "A platform admin will review your licence details.",
      });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (submittedId) {
    return (
      <PublicShell>
        <div className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Application received</h1>
          <p className="mt-3 text-muted-foreground">
            Thanks — <strong>{form.name}</strong> is now registered and in the verification queue.
            Once approved by a platform administrator, your staff account will be activated.
          </p>
          <div className="mt-4 rounded-xl border border-border bg-card p-3 font-mono text-xs text-muted-foreground">
            Application ID: {submittedId}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </PublicShell>
    );
  }

  const field = (key: keyof FormState) => ({
    id: key,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  function FieldError({ name }: { name: keyof FormState }) {
    return errors[name] ? (
      <p id={`${name}-error`} role="alert" className="text-xs text-destructive">
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <PageHeader
          title="Hospital registration"
          description="Submit your hospital and blood bank licence details. A platform admin reviews every registration before requests can be raised."
        />

        <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
          <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <legend className="px-1 text-sm font-semibold">Hospital details</legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Hospital name</Label>
                <Input
                  {...field("name")}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="City General Hospital"
                />
                <FieldError name="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration number</Label>
                <Input
                  {...field("registrationNumber")}
                  value={form.registrationNumber}
                  onChange={(e) => update("registrationNumber", e.target.value)}
                  placeholder="REG-1001"
                />
                <FieldError name="registrationNumber" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Hospital type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => update("type", value as FormState["type"])}
                >
                  <SelectTrigger id="type" aria-invalid={Boolean(errors.type)}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="type" />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <legend className="px-1 text-sm font-semibold">Primary contact & Staff Administrator</legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact name</Label>
                <Input
                  {...field("contactName")}
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                  placeholder="Dr. Vikram Menon"
                />
                <FieldError name="contactName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact phone (+91...)</Label>
                <Input
                  {...field("contactPhone")}
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="+919888800005"
                />
                <FieldError name="contactPhone" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  {...field("contactEmail")}
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="admin@hospital.example"
                />
                <FieldError name="contactEmail" />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <legend className="px-1 text-sm font-semibold">Location</legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  {...field("latitude")}
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                  placeholder="12.9165"
                />
                <FieldError name="latitude" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  {...field("longitude")}
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  placeholder="79.1325"
                />
                <FieldError name="longitude" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  {...field("address")}
                  rows={2}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Hospital Road"
                />
                <FieldError name="address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  {...field("pincode")}
                  inputMode="numeric"
                  maxLength={10}
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  placeholder="632001"
                />
                <FieldError name="pincode" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  {...field("city")}
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Vellore"
                />
                <FieldError name="city" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="state">State</Label>
                <Input
                  {...field("state")}
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="Tamil Nadu"
                />
                <FieldError name="state" />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <legend className="px-1 text-sm font-semibold">Blood bank licence</legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="licenseNumber">Licence number</Label>
                <Input
                  {...field("licenseNumber")}
                  value={form.licenseNumber}
                  onChange={(e) => update("licenseNumber", e.target.value)}
                  placeholder="LIC-1001"
                />
                <FieldError name="licenseNumber" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseIssuedDate">Issued on</Label>
                <Input
                  {...field("licenseIssuedDate")}
                  type="date"
                  value={form.licenseIssuedDate}
                  onChange={(e) => update("licenseIssuedDate", e.target.value)}
                />
                <FieldError name="licenseIssuedDate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiryDate">Expires on</Label>
                <Input
                  {...field("licenseExpiryDate")}
                  type="date"
                  value={form.licenseExpiryDate}
                  onChange={(e) => update("licenseExpiryDate", e.target.value)}
                />
                <FieldError name="licenseExpiryDate" />
              </div>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Submit application
            </Button>
            <Button asChild type="button" variant="ghost" size="lg">
              <Link to="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </PublicShell>
  );
}
