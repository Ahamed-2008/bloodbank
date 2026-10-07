import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarClock, MapPin, Phone, Stethoscope } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { AlertActions } from "@/components/donor/alert-actions";
import { donorService } from "@/services/donor-service";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/donor/alerts/$alertId")({
  head: () => ({
    meta: [
      { title: "Blood request details — BloodLink" },
      { name: "description", content: "Full details of a blood request: hospital, location, units and urgency." },
      { property: "og:title", content: "Blood request details — BloodLink" },
      { property: "og:description", content: "Hospital, location, units and urgency for this request." },
    ],
  }),
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const { alertId } = Route.useParams();
  const query = useQuery({
    queryKey: ["donor", "alert", alertId],
    queryFn: () => donorService.getAlert(alertId),
  });

  return (
    <div className="space-y-6">
      <Link to="/donor/alerts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All alerts
      </Link>
      {query.isPending ? (
        <LoadingState rows={2} />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <PageHeader
            title={`${query.data.bloodGroup} needed at ${query.data.hospitalName}`}
            description={`Requested ${formatDateTime(query.data.createdAt)}`}
          />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
              <div className="flex flex-wrap items-center gap-3">
                <BloodGroupBadge group={query.data.bloodGroup} size="lg" />
                <UrgencyBadge urgency={query.data.urgency} />
                <StatusBadge status={query.data.status} />
              </div>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <Info label="Units required" value={`${query.data.unitsFulfilled} of ${query.data.unitsRequired} fulfilled`} />
                <Info label="Needed by" value={formatDateTime(query.data.neededBy)} icon={CalendarClock} />
                <Info label="Patient condition" value={query.data.patientCondition} icon={Stethoscope} />
                <Info label="Donors responded" value={String(query.data.responseCount)} />
              </dl>
              <div className="mt-6 border-t border-border pt-5">
                <AlertActions alert={query.data} />
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
              <h2 className="flex items-center gap-2 font-semibold">
                <Building2 className="size-4 text-primary" aria-hidden /> Hospital
              </h2>
              <p className="mt-3 font-medium">{query.data.hospitalName}</p>
              <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {query.data.address}, {query.data.city}, {query.data.state}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{query.data.distanceKm} km from your location</p>
              <a
                href={`tel:${query.data.contactPhone.replace(/\s/g, "")}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Phone className="size-4" aria-hidden /> {query.data.contactPhone}
              </a>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
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
