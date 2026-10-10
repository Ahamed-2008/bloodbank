import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarCheck, Droplets, HeartPulse, ThumbsUp, XCircle } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/donor/statistics")({
  head: () => ({
    meta: [
      { title: "Donation statistics — BloodLink" },
      {
        name: "description",
        content: "Your total donations, donor score, reward points and next eligible date.",
      },
      { property: "og:title", content: "Donation statistics — BloodLink" },
      { property: "og:description", content: "Your lifetime blood donation impact." },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const statsQuery = useQuery({ queryKey: ["donor", "stats"], queryFn: donorService.getStats });
  const eligQuery = useQuery({ queryKey: ["donor", "eligibility"], queryFn: donorService.getEligibility });

  if (statsQuery.isPending) return <LoadingState rows={4} />;
  if (statsQuery.isError) return <ErrorState onRetry={() => void statsQuery.refetch()} />;

  const s = statsQuery.data;
  const total = s.total_donations ?? 0;
  const noShows = s.no_shows ?? 0;
  const attendanceRate = total + noShows > 0 ? Math.round((total / (total + noShows)) * 100) : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics & Reputation"
        description="Your verified lifetime contribution to the BloodLink network."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Confirmed donations"
          value={total}
          icon={Droplets}
          tone="primary"
        />
        <StatCard
          label="Donor score"
          value={s.donor_score ?? 0}
          hint={`Current tier: ${s.tier}`}
          icon={ThumbsUp}
          tone="success"
        />
        <StatCard
          label="Reward points"
          value={s.reward_points ?? 0}
          icon={Award}
          tone="info"
        />
        <StatCard
          label="No-shows"
          value={noShows}
          hint={`${attendanceRate}% attendance rate`}
          icon={XCircle}
          tone={noShows > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Last donation"
          value={formatDate(s.last_donated_at)}
          icon={CalendarCheck}
        />
        <StatCard
          label="Next eligible date"
          value={s.is_eligible ? "Eligible today" : formatDate(s.eligible_from)}
          icon={CalendarCheck}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Current eligibility status</h2>
          {eligQuery.data ? (
            <div className="mt-4 space-y-3">
              <StatusBadge status={eligQuery.data.is_eligible ? "eligible" : "not_eligible"} />
              <p className="text-sm text-muted-foreground">
                {eligQuery.data.is_eligible
                  ? "You are eligible to donate whole blood today."
                  : eligQuery.data.days_until_eligible
                    ? `Eligible again in ${eligQuery.data.days_until_eligible} days (${formatDate(eligQuery.data.eligible_from)}).`
                    : "Not eligible to donate at this time."}
              </p>
            </div>
          ) : (
            <LoadingState rows={1} className="mt-4" />
          )}

          <h3 className="mt-6 text-sm font-medium">Reliability rate</h3>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success" style={{ width: `${attendanceRate}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {attendanceRate}% of accepted requests fulfilled without no-shows
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Donor tier & benefits</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-medium">Current Status</span>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-deep">
                {s.tier}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-medium">Lifetime Impact Score</span>
              <span className="font-semibold tabular-nums">{s.donor_score} pts</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Donating when emergency requests arise awards points and promotes your donor tier across the network.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
