import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  BellRing,
  ClipboardList,
  Droplets,
  HeartPulse,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatApiError } from "@/services/api-client";
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
  const qc = useQueryClient();

  const profile = useQuery({ queryKey: ["donor", "profile"], queryFn: donorService.getProfile });
  const eligibility = useQuery({
    queryKey: ["donor", "eligibility"],
    queryFn: donorService.getEligibility,
  });
  const stats = useQuery({ queryKey: ["donor", "stats"], queryFn: donorService.getStats });
  const activeAlertsQuery = useQuery({
    queryKey: ["donor", "active-alerts"],
    queryFn: donorService.getActiveAlerts,
    retry: false,
  });

  const [availabilityState, setAvailabilityState] = useState<boolean | null>(null);

  const toggleAvailability = useMutation({
    mutationFn: (next: boolean) => donorService.updateAvailability(next),
    onSuccess: (_, next) => {
      setAvailabilityState(next);
      toast.success(next ? "You are now available to donate" : "Availability paused");
      void qc.invalidateQueries({ queryKey: ["donor", "profile"] });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const isAvailable = availabilityState ?? profile.data?.is_eligible ?? true;
  const isAadhaarVerified = profile.data?.aadhaar_verified ?? true;
  const hasProfileName = Boolean(profile.data?.name?.trim());

  // Safe alerts list
  const alertsList = activeAlertsQuery.data?.alerts ?? [];
  const openAlerts = alertsList.slice(0, 3);

  // Check if 403 on alerts because location is not set or aadhaar not verified
  const alertErrorMessage = activeAlertsQuery.error
    ? formatApiError(activeAlertsQuery.error)
    : null;
  const isLocationMissing = alertErrorMessage?.toLowerCase().includes("location");
  const isAadhaarPending =
    alertErrorMessage?.toLowerCase().includes("aadhaar") || !isAadhaarVerified;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${profile.data?.name || user?.name || "donor"}`}
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

      {/* Onboarding Banner if profile name is missing */}
      {!profile.isPending && !hasProfileName ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <UserRound className="size-5 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">Complete your donor profile</p>
              <p className="text-sm text-muted-foreground">
                Set your full name, blood group, date of birth, and gender to start receiving blood alerts.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/donor/profile">Complete Profile</Link>
          </Button>
        </div>
      ) : null}

      {/* Verification Notice */}
      {!profile.isPending && isAadhaarPending ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning-soft p-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 text-warning-foreground" aria-hidden />
            <div>
              <p className="font-semibold text-warning-foreground">Verification pending</p>
              <p className="text-sm text-muted-foreground">
                A platform administrator will verify your donor account before nearby blood alerts become visible.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Your blood group</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Available to donate</span>
              <Switch
                checked={isAvailable}
                onCheckedChange={(val) => toggleAvailability.mutate(val)}
                disabled={toggleAvailability.isPending}
                aria-label="Toggle availability"
              />
            </div>
          </div>
          {profile.isPending ? (
            <LoadingState rows={1} className="mt-4" />
          ) : profile.isError ? (
            <ErrorState onRetry={() => void profile.refetch()} />
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <BloodGroupBadge group={profile.data.blood_group} size="lg" />
              <div>
                <p className="text-lg font-semibold">{profile.data.name || "Unnamed Donor"}</p>
                <p className="text-sm text-muted-foreground">{profile.data.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-deep">
                    {profile.data.tier}
                  </span>
                  {profile.data.aadhaar_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                      <ShieldCheck className="size-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unverified</span>
                  )}
                </div>
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
              <StatusBadge status={eligibility.data.is_eligible ? "eligible" : "not_eligible"} />
              <p className="text-sm text-muted-foreground">
                {eligibility.data.is_eligible
                  ? "You meet the health and rest interval requirements to donate today."
                  : eligibility.data.days_until_eligible
                    ? `Eligible again in ${eligibility.data.days_until_eligible} days (${formatDate(eligibility.data.eligible_from)}).`
                    : "Not currently eligible to donate."}
              </p>
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
              value={stats.data.total_donations ?? 0}
              icon={Droplets}
              tone="primary"
            />
            <StatCard
              label="Donor score"
              value={stats.data.donor_score ?? 0}
              icon={ClipboardList}
              tone="success"
            />
            <StatCard
              label="Reward points"
              value={stats.data.reward_points ?? 0}
              icon={HeartPulse}
              tone="info"
            />
            <StatCard
              label="Next eligible date"
              value={
                stats.data.is_eligible
                  ? "Eligible now"
                  : formatDate(stats.data.eligible_from)
              }
              hint={
                stats.data.last_donated_at
                  ? `Last donated ${formatDate(stats.data.last_donated_at)}`
                  : "No prior donations recorded"
              }
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

        {activeAlertsQuery.isPending ? (
          <LoadingState className="mt-4" />
        ) : activeAlertsQuery.isError ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-6 card-elevated">
            {isLocationMissing ? (
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-2 text-warning-foreground font-semibold">
                  <MapPin className="size-5" /> Location required
                </div>
                <p className="text-sm text-muted-foreground">
                  Please update your location so we can find blood requests within your travel radius.
                </p>
                <Button asChild size="sm">
                  <Link to="/donor/location">Set Location</Link>
                </Button>
              </div>
            ) : isAadhaarPending ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="size-5" />
                <p className="text-sm">Alerts will appear here once your account is verified by an administrator.</p>
              </div>
            ) : (
              <ErrorState onRetry={() => void activeAlertsQuery.refetch()} />
            )}
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
              <li key={alert.alert_id}>
                <Link
                  to="/donor/alerts/$alertId"
                  params={{ alertId: alert.alert_id }}
                  className="block rounded-2xl border border-border bg-card p-5 card-elevated card-lift"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <BloodGroupBadge group={alert.blood_group} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{alert.hospitals?.name ?? "Hospital"}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" aria-hidden />
                            {alert.hospitals?.city} · {alert.department}
                          </span>
                          <span>
                            {alert.units_fulfilled} of {alert.units_needed} units fulfilled
                          </span>
                          {alert.created_at ? <span>{timeAgo(alert.created_at)}</span> : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <UrgencyBadge urgency={alert.urgency} />
                      <StatusBadge status={alert.status} />
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
