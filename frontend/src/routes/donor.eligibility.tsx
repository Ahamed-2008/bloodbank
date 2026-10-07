import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { donorService } from "@/services/donor-service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/donor/eligibility")({
  head: () => ({
    meta: [
      { title: "Donation eligibility — BloodLink" },
      { name: "description", content: "Check whether you can donate blood today and when you'll next be eligible." },
      { property: "og:title", content: "Donation eligibility — BloodLink" },
      { property: "og:description", content: "Can you donate today? See your eligibility status." },
    ],
  }),
  component: EligibilityPage,
});

const GAP_DAYS = 90;

function EligibilityPage() {
  const q = useQuery({ queryKey: ["donor", "eligibility"], queryFn: donorService.getEligibility });
  if (q.isPending) return <LoadingState rows={2} />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  const e = q.data;
  const progress = e.eligible ? 100 : Math.round(((GAP_DAYS - e.daysUntilEligible) / GAP_DAYS) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Eligibility" description="Whole blood donors need at least 90 days between donations." />
      <section className={`rounded-2xl border p-6 card-elevated ${e.eligible ? "border-success/30 bg-success-soft" : "border-warning/40 bg-warning-soft"}`}>
        <div className="flex items-start gap-4">
          {e.eligible ? <CheckCircle2 className="size-8 shrink-0 text-success" aria-hidden /> : <Clock className="size-8 shrink-0 text-warning-foreground" aria-hidden />}
          <div>
            <h2 className="text-xl font-bold">{e.eligible ? "You're eligible to donate" : `Eligible again in ${e.daysUntilEligible} days`}</h2>
            <p className="mt-1 text-sm">{e.reason}</p>
          </div>
        </div>
        {!e.eligible ? (
          <div className="mt-5">
            <Progress value={progress} aria-label="Recovery progress" />
            <p className="mt-1 text-xs">{progress}% of the recovery period complete</p>
          </div>
        ) : null}
      </section>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Last donation</dt>
          <dd className="mt-1 text-lg font-semibold">{formatDate(e.lastDonationDate)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Next eligible date</dt>
          <dd className="mt-1 text-lg font-semibold">{e.eligible ? "Today" : formatDate(e.nextEligibleDate)}</dd>
        </div>
      </dl>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">General guidelines</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Age 18–65 and weight at least 45 kg.</li>
          <li>Haemoglobin of 12.5 g/dL or higher.</li>
          <li>No fever, infection, or recent tattoo/piercing in the last 6 months.</li>
          <li>The hospital's medical team makes the final decision before every donation.</li>
        </ul>
      </section>
    </div>
  );
}
