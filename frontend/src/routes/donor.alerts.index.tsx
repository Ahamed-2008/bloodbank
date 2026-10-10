import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CalendarClock, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, UrgencyBadge } from "@/components/common/badges";
import { AlertActions } from "@/components/donor/alert-actions";
import { donorService } from "@/services/donor-service";
import { formatApiError } from "@/services/api-client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/donor/alerts/")({
  head: () => ({
    meta: [
      { title: "Active blood alerts — BloodLink" },
      {
        name: "description",
        content:
          "Blood requests from verified hospitals near you. Accept, decline or mark arrival.",
      },
      { property: "og:title", content: "Active blood alerts — BloodLink" },
      { property: "og:description", content: "Nearby blood requests from verified hospitals." },
    ],
  }),
  component: DonorAlertsPage,
});

function DonorAlertsPage() {
  const alertsQuery = useQuery({
    queryKey: ["donor", "active-alerts"],
    queryFn: donorService.getActiveAlerts,
    refetchInterval: 12000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ["donor", "donations"],
    queryFn: donorService.getDonations,
  });

  // Create a lookup of donor's response status for each alert if possible
  const responseMap = new Map<string, string>();
  for (const item of historyQuery.data ?? []) {
    // History contains response_id and status
    // Note: API.md states response item has response_id and status
    responseMap.set(item.response_id, item.status);
  }

  const errorMessage = alertsQuery.error ? formatApiError(alertsQuery.error) : null;
  const isLocationMissing = errorMessage?.toLowerCase().includes("location");
  const isAadhaarPending = errorMessage?.toLowerCase().includes("aadhaar");

  const alerts = alertsQuery.data?.alerts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood alerts"
        description="Active requests matching your blood group, polled automatically every 12s."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void alertsQuery.refetch()}
            disabled={alertsQuery.isFetching}
          >
            <RefreshCw
              className={`size-4 ${alertsQuery.isFetching ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </Button>
        }
      />

      {alertsQuery.isPending ? (
        <LoadingState rows={4} />
      ) : alertsQuery.isError ? (
        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          {isLocationMissing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-warning-foreground">
                <MapPin className="size-5" /> Location required to view nearby alerts
              </div>
              <p className="text-sm text-muted-foreground">
                Blood requests are matched by hospital distance. Please set your GPS location.
              </p>
              <Button asChild>
                <Link to="/donor/location">Update Location</Link>
              </Button>
            </div>
          ) : isAadhaarPending ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-warning-foreground">
                <ShieldAlert className="size-5" /> Verification pending
              </div>
              <p className="text-sm text-muted-foreground">
                Please wait for an administrator to verify your donor account before you can receive alerts.
              </p>
            </div>
          ) : (
            <ErrorState message={errorMessage} onRetry={() => void alertsQuery.refetch()} />
          )}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts right now"
          description="You will be alerted as soon as a hospital raises an emergency request for your blood group."
          icon={<BellRing className="size-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-4">
          {alerts.map((alert) => (
            <li
              key={alert.alert_id}
              className="rounded-2xl border border-border bg-card p-5 card-elevated"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <BloodGroupBadge group={alert.blood_group} />
                  <div className="min-w-0">
                    <Link
                      to="/donor/alerts/$alertId"
                      params={{ alertId: alert.alert_id }}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {alert.hospitals?.name ?? "Hospital"}
                    </Link>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {alert.hospitals?.city} · {alert.department}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3.5" aria-hidden />
                        Expires {formatDateTime(alert.expires_at)}
                      </span>
                      <span>
                        {alert.units_fulfilled} of {alert.units_needed} unit
                        {alert.units_needed === 1 ? "" : "s"} fulfilled
                      </span>
                    </p>
                    {alert.patient_condition ? (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        Condition: {alert.patient_condition}
                      </p>
                    ) : null}
                  </div>
                </div>
                <UrgencyBadge urgency={alert.urgency} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Link
                  to="/donor/alerts/$alertId"
                  params={{ alertId: alert.alert_id }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View full details
                </Link>
                <AlertActions alert={alert} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
