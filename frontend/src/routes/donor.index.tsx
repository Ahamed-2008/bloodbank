import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, ClipboardList, Droplets, HeartPulse, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { useAuth } from "@/lib/auth-context";
import { formatDate, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/donor/")({
  head: () => ({
    meta: [
      { title: "Donor dashboard — BloodLink" },
      {
        name: "description",
        content:
          "Your blood group, donation eligibility, lifetime impact and the blood requests happening near you right now.",
      },
      { property: "og:title", content: "Donor dashboard — BloodLink" },
      {
        property: "og:description",
        content: "Eligibility, donation stats and nearby blood requests at a glance.",
      },
    ],
  }),
  component: DonorDashboard,
});

function DonorDashboard() {
  const { user } = useAuth();

  const profile = useQuery({ queryKey: ["donor", "profile"], queryFn: donorService.getProfile });
  const eligibility = useQuery({
    queryKey: ["donor", "eligibility"],
    queryFn: donorService.getEligibility,
  });
  const stats = useQuery({ queryKey: ["donor", "stats"], queryFn: donorService.getStats });
  const alerts = useQuery({ queryKey: ["donor", "alerts"], queryFn: donorService.getAlerts });

  const openAlerts = (alerts.data ?? []).filter((alert) => alert.status === "open").slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "donor"}`}
        description="Here's your donation status and the requests nearest to you."
        actions={
          <Button asChild>
            <Link to="/donor/alerts">
              <BellRing className="size-4" aria-hidden />
              View blood alerts
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <p className="text-sm font-medium text-muted-foreground">Your blood group</p>
          {profile.isPending ? (
            <LoadingState rows={1} className="mt-4" />
          ) : profile.isError ? (
            <ErrorState onRetry={() => void profile.refetch()} />
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <BloodGroupBadge group={profile.data.bloodGroup} size="lg" />
              <div>
                <p className="text-lg font-semibold">{profile.data.name}</p>
                <p className="text-sm text-muted-foreground">{profile.data.phone}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <p className="text-sm font-medium text-muted-foreground">Donation eligibility</p>
          {eligibility.isPending ? (
            <LoadingState rows={1} className="mt-4" />
          ) : eligibility.isError ? (
            <ErrorState onRetry={() => void eligibility.refetch()} />
          ) : (
            <div className="mt-4 space-y-3">
              <StatusBadge status={eligibility.data.eligible ? "eligible" : "not_eligible"} />
              <p className="text-sm text-muted-foreground">{eligibility.data.reason}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/donor/eligibility">
                  <HeartPulse className="size-4" aria-hidden />
                  Eligibility details
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Your impact</h2>
        {stats.isPending ? (
          <LoadingState rows={2} className="mt-4" />
        ) : stats.isError ? (
          <div className="mt-4">
            <ErrorState onRetry={() => void stats.refetch()} />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total donations"
              value={stats.data.totalDonations}
              icon={Droplets}
              tone="primary"
            />
            <StatCard
              label="Successful donations"
              value={stats.data.successfulDonations}
              icon={ClipboardList}
              tone="success"
            />
            <StatCard
              label="Lives impacted"
              value={stats.data.livesImpacted}
              hint="Up to three patients per donation"
              icon={Users}
              tone="info"
            />
            <StatCard
              label="Next eligible date"
              value={formatDate(stats.data.nextEligibleDate)}
              hint={`Last donated ${formatDate(stats.data.lastDonationDate)}`}
              icon={HeartPulse}
              tone="warning"
            />
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Requests near you</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/donor/alerts">See all</Link>
          </Button>
        </div>

        {alerts.isPending ? (
          <LoadingState className="mt-4" />
        ) : alerts.isError ? (
          <div className="mt-4">
            <ErrorState onRetry={() => void alerts.refetch()} />
          </div>
        ) : openAlerts.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No open requests nearby"
              description="We'll alert you the moment a hospital within your radius needs your blood group."
              icon={<BellRing className="size-6" aria-hidden />}
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {openAlerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  to="/donor/alerts/$alertId"
                  params={{ alertId: alert.id }}
                  className="block rounded-2xl border border-border bg-card p-5 card-elevated card-lift"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <BloodGroupBadge group={alert.bloodGroup} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{alert.hospitalName}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" aria-hidden />
                            {alert.city} · {alert.distanceKm} km
                          </span>
                          <span>{alert.unitsRequired} units needed</span>
                          <span>{timeAgo(alert.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <UrgencyBadge urgency={alert.urgency} />
                      {alert.myResponse ? <StatusBadge status={alert.myResponse} /> : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/donor/donations">
              <ClipboardList className="size-4" aria-hidden />
              Donation history
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/donor/location">
              <MapPin className="size-4" aria-hidden />
              Update location
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/donor/settings">Notification settings</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
