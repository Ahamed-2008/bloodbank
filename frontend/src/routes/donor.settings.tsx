import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import type { NotificationSettings } from "@/lib/types";

export const Route = createFileRoute("/donor/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings — BloodLink" },
      { name: "description", content: "Turn blood request alerts on or off and choose how far you're willing to travel." },
      { property: "og:title", content: "Notification settings — BloodLink" },
      { property: "og:description", content: "Control your blood request alerts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["donor", "settings"], queryFn: donorService.getNotificationSettings });
  const [form, setForm] = useState<NotificationSettings | null>(null);
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);
  const save = useMutation({
    mutationFn: donorService.updateNotificationSettings,
    onSuccess: (d) => {
      qc.setQueryData(["donor", "settings"], d);
      toast.success("Settings saved");
    },
  });
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  if (!form) return <LoadingState rows={2} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Notification settings" description="Choose when and how far BloodLink should alert you." />
      <div className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6 card-elevated">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="notif" className="text-base">Blood request alerts</Label>
            <p className="mt-1 text-sm text-muted-foreground">Receive notifications when nearby hospitals need your blood group.</p>
          </div>
          <Switch id="notif" checked={form.notificationsEnabled} onCheckedChange={(v) => setForm({ ...form, notificationsEnabled: v })} />
        </div>
        <div className={form.notificationsEnabled ? "" : "opacity-50"}>
          <div className="flex items-center justify-between">
            <Label htmlFor="radius" className="text-base">Maximum alert radius</Label>
            <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold text-primary-deep tabular-nums">{form.maxAlertRadiusKm} km</span>
          </div>
          <Slider
            id="radius"
            className="mt-4"
            min={1}
            max={50}
            step={1}
            disabled={!form.notificationsEnabled}
            value={[form.maxAlertRadiusKm]}
            onValueChange={([v]) => setForm({ ...form, maxAlertRadiusKm: v ?? form.maxAlertRadiusKm })}
            aria-label="Maximum alert radius in kilometres"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>1 km</span><span>50 km</span></div>
        </div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save settings
        </Button>
      </div>
    </div>
  );
}
