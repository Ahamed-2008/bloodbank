import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Clock, Droplets, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { hospitalService } from "@/services/hospital-service";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/hospital/")({
  head: () => ({
    meta: [
      { title: "Hospital dashboard — BloodLink" },
      { name: "description", content: "Active blood alerts, donor responses and fulfilment stats for your hospital." },
      { property: "og:title", content: "Hospital dashboard — BloodLink" },
      { property: "og:description", content: "Your hospital's blood requests at a glance." },
    ],
  }),
  component: HospitalDashboard,
});

function HospitalDashboard() {
  const hospital = useQuery({ queryKey: ["hospital", "me"], queryFn: hospitalService.getHospital });
  const stats = useQuery({ queryKey: ["hospital", "stats"], queryFn: hospitalService.getStats });
  const alerts = useQuery({ queryKey: ["hospital", "alerts"], queryFn: hospitalService.getAlerts });
  const responses = useQuery({ queryKey: ["hospital", "recent-responses"], queryFn: hospitalService.getRecentResponses });

  const active = (alerts.data ?? []).filter((a) => a.status === "open");
  const max = Math.max(1, ...(stats.data?.weekly ?? []).map((w) => w.responses));

  return (
    <div className="space-y-8">
      <PageHeader
        title={hospital.data?.name ?? "Hospital dashboard"}
        description={hospital.data ? `${hospital.data.city}, ${hospital.data.state}` : "Loading hospital…"}
        actions={
          <Button asChild>
            <Link to="/hospital/alerts/new"><PlusCircle className="size-4" aria-hidden />Create blood alert</Link>
          </Button>
        }
      />

      {stats.isPending ? (
        <LoadingState rows={2} />
      ) : stats.isError ? (
        <ErrorState onRetry={() => void stats.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active alerts" value={stats.data.activeAlerts} hint={`${stats.data.totalAlerts} total`} icon={BellRing} tone="primary" />
          <StatCard label="Donor responses" value={stats.data.donorResponses} icon={Users} tone="info" />
          <StatCard label="Units fulfilled" value={stats.data.unitsFulfilled} icon={Droplets} tone="success" />
          <StatCard label="Avg. first response" value={`${stats.data.averageResponseMinutes} min`} icon={Clock} tone="warning" />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active alerts</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/hospital/alerts">All alerts</Link></Button>
          </div>
          {alerts.isPending ? (
            <LoadingState className="mt-4" />
          ) : active.length === 0 ? (
            <div className="mt-4"><EmptyState title="No active alerts" description="Create an alert to notify nearby donors." /></div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {active.map((a) => (
                <li key={a.id}>
                  <Link to="/hospital/alerts/$alertId" params={{ alertId: a.id }} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-primary">
                    <span className="flex items-center gap-3">
                      <BloodGroupBadge group={a.bloodGroup} size="sm" />
                      <span className="text-sm font-medium">{a.unitsFulfilled}/{a.unitsRequired} units · {a.responseCount} responses</span>
                    </span>
                    <UrgencyBadge urgency={a.urgency} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Recent donor responses</h2>
          {responses.isPending ? (
            <LoadingState rows={2} className="mt-4" />
          ) : (
            <ul className="mt-4 space-y-3">
              {(responses.data ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.donorName}</p>
                    <p className="text-xs text-muted-foreground">{r.distanceKm} km · {timeAgo(r.respondedAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {stats.data ? (
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Donor responses this week</h2>
          <div className="mt-6 flex h-40 items-end gap-3" role="img" aria-label="Weekly responses chart">
            {stats.data.weekly.map((w) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold tabular-nums">{w.responses}</span>
                <div className="w-full rounded-t-lg bg-primary" style={{ height: `${(w.responses / max) * 110 + 4}px` }} />
                <span className="text-xs text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
