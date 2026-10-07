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
import { formatApiError } from "@/services/api-client";
import type { NotificationSettings } from "@/lib/types";

export const Route = createFileRoute("/donor/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings — BloodLink" },
      {
        name: "description",
        content:
          "Turn blood request alerts on or off and choose how far you're willing to travel.",
      },
      { property: "og:title", content: "Notification settings — BloodLink" },
      { property: "og:description", content: "Control your blood request alerts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["donor", "profile"],
    queryFn: donorService.getProfile,
  });

  const [form, setForm] = useState<NotificationSettings>({
    notifications_enabled: true,
    max_alert_radius_km: 10,
  });
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        notifications_enabled: profileQuery.data.notifications_enabled ?? true,
        max_alert_radius_km: profileQuery.data.max_alert_radius_km ?? 10,
      });
      setIsAvailable(profileQuery.data.is_eligible ?? true);
    }
  }, [profileQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await donorService.updateNotificationSettings(form);
      await donorService.updateAvailability(isAvailable);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["donor"] });
      toast.success("Preferences updated successfully");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  if (profileQuery.isPending) return <LoadingState rows={2} />;
  if (profileQuery.isError) return <ErrorState onRetry={() => void profileQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your availability and alert broadcast radius."
      />

      <div className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6 card-elevated">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="availability" className="text-base font-semibold">
              Donor Availability
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              When active, hospitals near you can match and notify you. Pause this when you are travelling or temporarily unavailable.
            </p>
          </div>
          <Switch
            id="availability"
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="notif" className="text-base font-semibold">
                Blood request alerts
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Receive notifications when hospitals need your blood group.
              </p>
            </div>
            <Switch
              id="notif"
              checked={form.notifications_enabled}
              onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })}
            />
          </div>
        </div>

        <div className={`border-t border-border pt-6 ${form.notifications_enabled ? "" : "opacity-50"}`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="radius" className="text-base font-semibold">
              Maximum alert radius
            </Label>
            <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold text-primary-deep tabular-nums">
              {form.max_alert_radius_km} km
            </span>
          </div>
          <Slider
            id="radius"
            className="mt-4"
            min={1}
            max={50}
            step={1}
            disabled={!form.notifications_enabled}
            value={[form.max_alert_radius_km]}
            onValueChange={([v]) => setForm({ ...form, max_alert_radius_km: v ?? 10 })}
            aria-label="Maximum alert radius in kilometres"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        <Button
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending}
        >
          {saveSettingsMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
