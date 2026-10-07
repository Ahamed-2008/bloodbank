import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CalendarClock, MapPin } from "lucide-react";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, UrgencyBadge } from "@/components/common/badges";
import { AlertActions } from "@/components/donor/alert-actions";
import { donorService } from "@/services/donor-service";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/donor/alerts/")({
  head: () => ({
    meta: [
      { title: "Active blood alerts — BloodLink" },
      { name: "description", content: "Blood requests from verified hospitals near you. Accept or decline in one tap." },
      { property: "og:title", content: "Active blood alerts — BloodLink" },
      { property: "og:description", content: "Nearby blood requests from verified hospitals." },
    ],
  }),
  component: DonorAlertsPage,
});

function DonorAlertsPage() {
  const alerts = useQuery({ queryKey: ["donor", "alerts"], queryFn: donorService.getAlerts });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood alerts"
        description="Requests from verified hospitals within your alert radius, nearest first."
      />
      {alerts.isPending ? (
        <LoadingState rows={4} />
      ) : alerts.isError ? (
        <ErrorState onRetry={() => void alerts.refetch()} />
      ) : alerts.data.length === 0 ? (
        <EmptyState
          title="No alerts right now"
          description="You'll be notified as soon as a matching request comes in."
          icon={<BellRing className="size-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {[...alerts.data]
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map((alert) => (
              <li key={alert.id} className="rounded-2xl border border-border bg-card p-5 card-elevated">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <BloodGroupBadge group={alert.bloodGroup} />
                    <div className="min-w-0">
                      <Link
                        to="/donor/alerts/$alertId"
                        params={{ alertId: alert.id }}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {alert.hospitalName}
                      </Link>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {alert.city} · {alert.distanceKm} km away
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3.5" aria-hidden />
                          {formatDateTime(alert.createdAt)}
                        </span>
                        <span>
                          {alert.unitsRequired} unit{alert.unitsRequired === 1 ? "" : "s"} required
                        </span>
                      </p>
                    </div>
                  </div>
                  <UrgencyBadge urgency={alert.urgency} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Link
                    to="/donor/alerts/$alertId"
                    params={{ alertId: alert.id }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View details
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
