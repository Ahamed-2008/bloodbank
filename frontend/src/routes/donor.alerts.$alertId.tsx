import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarClock, MapPin, Stethoscope, Users } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { AlertActions } from "@/components/donor/alert-actions";
import { donorService } from "@/services/donor-service";
import { formatDateTime } from "@/lib/format";
import type { ActiveAlertItem } from "@/lib/types";

export const Route = createFileRoute("/donor/alerts/$alertId")({
  head: () => ({
    meta: [
      { title: "Blood request details — BloodLink" },
      {
        name: "description",
        content: "Full details of a blood request: hospital, location, units and urgency.",
      },
      { property: "og:title", content: "Blood request details — BloodLink" },
      { property: "og:description", content: "Hospital, location, units and urgency for this request." },
    ],
  }),
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const { alertId } = Route.useParams();
  const alertQuery = useQuery({
    queryKey: ["donor", "alert", alertId],
    queryFn: () => donorService.getAlert(alertId),
  });

  const historyQuery = useQuery({
    queryKey: ["donor", "donations"],
    queryFn: donorService.getDonations,
  });

  // Check if donor has an existing response for this alert
  // History items include response_id, status
  const matchedResponse = (historyQuery.data ?? []).find(
    (h) => (h as any).alert_id === alertId || (h.alerts as any)?.alert_id === alertId,
  );

  if (alertQuery.isPending) {
    return <LoadingState rows={2} />;
  }

  if (alertQuery.isError) {
    return <ErrorState message={alertQuery.error.message} onRetry={() => void alertQuery.refetch()} />;
  }

  const alert = alertQuery.data;

  // Adapt to ActiveAlertItem shape for AlertActions
  const alertItem: ActiveAlertItem = {
    alert_id: alert.alert_id,
    blood_group: alert.blood_group,
    units_needed: alert.units_needed,
    units_fulfilled: alert.units_fulfilled,
    urgency: alert.urgency,
    department: alert.department,
    patient_condition: alert.patient_condition,
    status: alert.status,
    expires_at: alert.expires_at,
    created_at: alert.created_at,
    hospitals: {
      name: alert.hospitals?.name ?? "Hospital",
      address: alert.hospitals?.address ?? "",
      city: alert.hospitals?.city ?? "",
    },
  };

  return (
    <div className="space-y-6">
      <Link
        to="/donor/alerts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> All alerts
      </Link>

      <PageHeader
        title={`${alert.blood_group} blood requested at ${alert.hospitals?.name ?? "Hospital"}`}
        description={`Raised on ${formatDateTime(alert.created_at)} · Expires ${formatDateTime(alert.expires_at)}`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex flex-wrap items-center gap-3">
            <BloodGroupBadge group={alert.blood_group} size="lg" />
            <UrgencyBadge urgency={alert.urgency} />
            <StatusBadge status={alert.status} />
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <Info
              label="Units required"
              value={`${alert.units_fulfilled} of ${alert.units_needed} fulfilled`}
            />
            <Info
              label="Department"
              value={alert.department}
            />
            <Info
              label="Expires at"
              value={formatDateTime(alert.expires_at)}
              icon={CalendarClock}
            />
            <Info
              label="Donors responded"
              value={`${alert.accepted_count} accepted (${alert.notified_count} notified)`}
              icon={Users}
            />
            {alert.patient_condition ? (
              <div className="sm:col-span-2">
                <Info
                  label="Patient condition"
                  value={alert.patient_condition}
                  icon={Stethoscope}
                />
              </div>
            ) : null}
            {alert.patient_ref ? (
              <Info
                label="Patient Reference"
                value={alert.patient_ref}
              />
            ) : null}
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            <AlertActions
              alert={alertItem}
              currentResponseStatus={matchedResponse?.status}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="flex items-center gap-2 font-semibold">
            <Building2 className="size-4 text-primary" aria-hidden /> Hospital Details
          </h2>
          <p className="mt-3 font-medium">{alert.hospitals?.name}</p>
          <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {alert.hospitals?.address ? `${alert.hospitals.address}, ` : ""}
            {alert.hospitals?.city}
          </p>
          {alert.radius_km ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Search radius: {alert.radius_km} km
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof MapPin;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
        {value}
      </dd>
    </div>
  );
}
