import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Droplets, HeartPulse, ThumbsUp, Users } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/donor/statistics")({
  head: () => ({
    meta: [
      { title: "Donation statistics — BloodLink" },
      { name: "description", content: "Your total donations, success rate, lives impacted and next eligible date." },
      { property: "og:title", content: "Donation statistics — BloodLink" },
      { property: "og:description", content: "Your lifetime blood donation impact." },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const stats = useQuery({ queryKey: ["donor", "stats"], queryFn: donorService.getStats });
  const elig = useQuery({ queryKey: ["donor", "eligibility"], queryFn: donorService.getEligibility });

  if (stats.isPending) return <LoadingState rows={4} />;
  if (stats.isError) return <ErrorState onRetry={() => void stats.refetch()} />;
  const s = stats.data;
  const max = Math.max(1, ...s.monthly.map((m) => m.donations));
  const rate = s.totalDonations ? Math.round((s.successfulDonations / s.totalDonations) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" description="Your contribution to the BloodLink network." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total donations" value={s.totalDonations} icon={Droplets} tone="primary" />
        <StatCard label="Successful donations" value={s.successfulDonations} hint={`${rate}% success rate`} icon={ThumbsUp} tone="success" />
        <StatCard label="Lives impacted" value={s.livesImpacted} icon={Users} tone="info" />
        <StatCard label="Alerts accepted" value={s.alertsAccepted} icon={HeartPulse} />
        <StatCard label="Last donation" value={formatDate(s.lastDonationDate)} icon={CalendarCheck} />
        <StatCard label="Next eligible" value={formatDate(s.nextEligibleDate)} icon={CalendarCheck} tone="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Donations by month</h2>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label="Monthly donations chart">
            {s.monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold tabular-nums">{m.donations}</span>
                <div className="w-full rounded-t-lg bg-primary" style={{ height: `${(m.donations / max) * 140 + 4}px` }} />
                <span className="text-xs text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h2 className="font-semibold">Current eligibility</h2>
          {elig.data ? (
            <div className="mt-4 space-y-3">
              <StatusBadge status={elig.data.eligible ? "eligible" : "not_eligible"} />
              <p className="text-sm text-muted-foreground">{elig.data.reason}</p>
            </div>
          ) : (
            <LoadingState rows={1} className="mt-4" />
          )}
          <h3 className="mt-6 text-sm font-medium">Success rate</h3>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success" style={{ width: `${rate}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{rate}% of donations completed</p>
        </section>
      </div>
    </div>
  );
}
