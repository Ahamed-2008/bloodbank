import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  Droplets,
  PlusCircle,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { hospitalService } from "@/services/hospital-service";
import { formatDateTime, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/hospital/")({
  head: () => ({
    meta: [
      { title: "Hospital dashboard — BloodLink" },
      {
        name: "description",
        content: "Active blood alerts, donor responses and fulfilment stats for your hospital.",
      },
      { property: "og:title", content: "Hospital dashboard — BloodLink" },
      { property: "og:description", content: "Your hospital's blood requests at a glance." },
    ],
  }),
  component: HospitalDashboard,
});

function HospitalDashboard() {
  const hospitalQuery = useQuery({
    queryKey: ["hospital", "profile"],
    queryFn: hospitalService.getProfile,
  });

  const alertsQuery = useQuery({
    queryKey: ["hospital", "alerts"],
    queryFn: hospitalService.getHospitalAlerts,
  });

  const alerts = alertsQuery.data ?? [];
  const activeAlerts = alerts.filter((a) => a.status === "Active" || a.status === "open");

  const totalUnitsNeeded = alerts.reduce((acc, a) => acc + (a.units_needed ?? 0), 0);
  const totalUnitsFulfilled = alerts.reduce((acc, a) => acc + (a.units_fulfilled ?? 0), 0);
  const totalAcceptedCount = alerts.reduce((acc, a) => acc + (a.accepted_count ?? 0), 0);
  const totalNotifiedCount = alerts.reduce((acc, a) => acc + (a.notified_count ?? 0), 0);

  const h = hospitalQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={h?.name ?? "Hospital dashboard"}
        description={h ? `${h.city}, ${h.state} · ${h.registration_number}` : "Loading hospital…"}
        actions={
          <Button asChild disabled={h && !h.is_verified}>
            <Link to="/hospital/alerts/new">
              <PlusCircle className="size-4" aria-hidden />
              Create blood alert
            </Link>
          </Button>
        }
      />

      {/* Verification status alert */}
      {h && !h.is_verified ? (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-5 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-warning-foreground" />
          <div>
            <p className="font-semibold text-warning-foreground">Verification in progress</p>
            <p className="text-muted-foreground">
              Your hospital registration is awaiting approval by a platform administrator. Once verified, you will be able to broadcast blood alerts to nearby donors.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active alerts"
          value={activeAlerts.length}
          hint={`${alerts.length} total alerts created`}
          icon={BellRing}
          tone="primary"
        />
        <StatCard
          label="Donors accepted"
          value={totalAcceptedCount}
          hint={`${totalNotifiedCount} donors notified`}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Units fulfilled"
          value={totalUnitsFulfilled}
          hint={`${totalUnitsNeeded} total units required`}
          icon={Droplets}
          tone="success"
        />
        <StatCard
          label="Hospital Status"
          value={h?.is_verified ? "Verified" : "Pending"}
          hint={h?.hospital_type ?? "General"}
          icon={h?.is_verified ? CheckCircle2 : Clock}
          tone={h?.is_verified ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active alerts</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/hospital/alerts">All alerts</Link>
            </Button>
          </div>

          {alertsQuery.isPending ? (
            <LoadingState className="mt-4" />
          ) : alertsQuery.isError ? (
            <div className="mt-4">
              <ErrorState onRetry={() => void alertsQuery.refetch()} />
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No active alerts"
                description="Raise an alert to broadcast immediate blood requirements to nearby donors."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {activeAlerts.map((a) => (
                <li key={a.alert_id}>
                  <Link
                    to="/hospital/alerts/$alertId"
                    params={{ alertId: a.alert_id }}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:text-primary"
                  >
                    <span className="flex items-center gap-3">
                      <BloodGroupBadge group={a.blood_group} size="sm" />
                      <div>
                        <span className="text-sm font-medium">
                          {a.units_fulfilled}/{a.units_needed} units · {a.accepted_count} accepted
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {a.department} · {timeAgo(a.created_at)}
                        </p>
                      </div>
                    </span>
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={a.urgency} />
                      <StatusBadge status={a.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Quick links & Management</h2>
          <div className="mt-4 space-y-3">
            <Button asChild variant="outline" className="w-full justify-start gap-2.5">
              <Link to="/hospital/alerts/new">
                <PlusCircle className="size-4" /> Create new blood alert
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2.5">
              <Link to="/hospital/staff">
                <Users className="size-4" /> Manage staff & operators
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2.5">
              <Link to="/hospital/profile">
                <Building2 className="size-4" /> Hospital licence & profile
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
