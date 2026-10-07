import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import type { DonorLocation } from "@/lib/types";

export const Route = createFileRoute("/donor/location")({
  head: () => ({
    meta: [
      { title: "Your location — BloodLink" },
      { name: "description", content: "Set your location so BloodLink can alert you to requests nearby." },
      { property: "og:title", content: "Your location — BloodLink" },
      { property: "og:description", content: "Manage the location used for nearby alerts." },
    ],
  }),
  component: LocationPage,
});

function LocationPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["donor", "location"], queryFn: donorService.getLocation });
  const [form, setForm] = useState<DonorLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);
  const save = useMutation({
    mutationFn: donorService.updateLocation,
    onSuccess: (d) => {
      qc.setQueryData(["donor", "location"], d);
      toast.success("Location updated");
    },
  });

  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  if (!form) return <LoadingState rows={2} />;

  function locateDevice() {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => f && { ...f, latitude: +pos.coords.latitude.toFixed(5), longitude: +pos.coords.longitude.toFixed(5) }),
      () => toast.error("Couldn't read your location. Enter it manually."),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (Math.abs(form.latitude) > 90 || Math.abs(form.longitude) > 180) return setError("Check latitude and longitude.");
    if (!/^\d{6}$/.test(form.pincode)) return setError("Pincode must be 6 digits.");
    if (!form.city.trim() || !form.state.trim()) return setError("City and state are required.");
    setError(null);
    save.mutate(form);
  }

  const text = (k: "pincode" | "city" | "state") => ({
    id: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Location" description="Used only to find requests within your alert radius." />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6 card-elevated" noValidate>
          <Button type="button" variant="outline" onClick={locateDevice}>
            <LocateFixed className="size-4" aria-hidden /> Use my current location
          </Button>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
            </div>
            <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input {...text("pincode")} inputMode="numeric" maxLength={6} /></div>
            <div className="space-y-2"><Label htmlFor="city">City</Label><Input {...text("city")} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="state">State</Label><Input {...text("state")} /></div>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Save location
          </Button>
        </form>
        <aside className="grid-hairline flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
          <span className="grid size-14 place-items-center rounded-full brand-surface">
            <MapPin className="size-7" aria-hidden />
          </span>
          <p className="mt-4 font-semibold">{form.city}, {form.state}</p>
          <p className="text-sm text-muted-foreground">{form.pincode}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{form.latitude}, {form.longitude}</p>
        </aside>
      </div>
    </div>
  );
}
