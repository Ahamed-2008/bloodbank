import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import { formatApiError } from "@/services/api-client";
import type { UpdateLocationInput } from "@/lib/types";

export const Route = createFileRoute("/donor/location")({
  head: () => ({
    meta: [
      { title: "Your location — BloodLink" },
      {
        name: "description",
        content: "Set your location so BloodLink can alert you to requests nearby.",
      },
      { property: "og:title", content: "Your location — BloodLink" },
      { property: "og:description", content: "Manage the location used for nearby alerts." },
    ],
  }),
  component: LocationPage,
});

function LocationPage() {
  const qc = useQueryClient();

  const [form, setForm] = useState<UpdateLocationInput>({
    latitude: 12.9165,
    longitude: 79.1325,
    pincode: "632001",
    city: "Vellore",
    state: "Tamil Nadu",
  });
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: donorService.updateLocation,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["donor"] });
      toast.success(data.message || "Location updated successfully");
      setError(null);
    },
    onError: (err) => {
      setError(formatApiError(err));
      toast.error(formatApiError(err));
    },
  });

  function locateDevice() {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser.");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: +pos.coords.latitude.toFixed(5),
          longitude: +pos.coords.longitude.toFixed(5),
        }));
        toast.success("Current GPS coordinates detected!");
      },
      () => toast.error("Could not obtain GPS coordinates. Please enter manually."),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (Math.abs(form.latitude) > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (Math.abs(form.longitude) > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      setError("Pincode must be exactly 6 numeric digits.");
      return;
    }

    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location"
        description="Used to match you with emergency blood requests within your travel radius."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 card-elevated"
          noValidate
        >
          <Button type="button" variant="outline" onClick={locateDevice}>
            <LocateFixed className="size-4" aria-hidden /> Use my current GPS location
          </Button>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode (6 digits)</Label>
              <Input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Input
                id="city"
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="state">State (optional)</Label>
              <Input
                id="state"
                value={form.state ?? ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Save location
          </Button>
        </form>

        <aside className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
          <span className="grid size-14 place-items-center rounded-full brand-surface">
            <MapPin className="size-7" aria-hidden />
          </span>
          <p className="mt-4 font-semibold">
            {form.city ? `${form.city}, ` : ""}
            {form.state || "India"}
          </p>
          <p className="text-sm text-muted-foreground">{form.pincode}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {form.latitude}, {form.longitude}
          </p>
        </aside>
      </div>
    </div>
  );
}
