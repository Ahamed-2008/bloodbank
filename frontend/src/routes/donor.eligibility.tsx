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
      {
        name: "description",
        content: "Check whether you can donate blood today and when you'll next be eligible.",
      },
      { property: "og:title", content: "Donation eligibility — BloodLink" },
      { property: "og:description", content: "Can you donate today? See your eligibility status." },
    ],
  }),
  component: EligibilityPage,
});

const GAP_DAYS = 90;

function EligibilityPage() {
  const query = useQuery({
    queryKey: ["donor", "eligibility"],
    queryFn: donorService.getEligibility,
  });

  if (query.isPending) return <LoadingState rows={2} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const e = query.data;
  const daysLeft = e.days_until_eligible ?? 0;
  const progress = e.is_eligible ? 100 : Math.round(((GAP_DAYS - Math.min(daysLeft, GAP_DAYS)) / GAP_DAYS) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eligibility"
        description="Whole blood donors require at least 90 days of recovery between donations."
      />
      <section
        className={`rounded-2xl border p-6 card-elevated ${
          e.is_eligible
            ? "border-success/30 bg-success-soft"
            : "border-warning/40 bg-warning-soft"
        }`}
      >
        <div className="flex items-start gap-4">
          {e.is_eligible ? (
            <CheckCircle2 className="size-8 shrink-0 text-success" aria-hidden />
          ) : (
            <Clock className="size-8 shrink-0 text-warning-foreground" aria-hidden />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {e.is_eligible ? "You're eligible to donate" : `Eligible again in ${daysLeft} days`}
            </h2>
            <p className="mt-1 text-sm">
              {e.is_eligible
                ? "Your health interval has been fulfilled. You are eligible to accept active alerts."
                : `Next eligible donation date: ${formatDate(e.eligible_from)}.`}
            </p>
          </div>
        </div>
        {!e.is_eligible ? (
          <div className="mt-5">
            <Progress value={progress} aria-label="Recovery progress" />
            <p className="mt-1 text-xs text-muted-foreground">
              {progress}% of the standard 90-day recovery period complete
            </p>
          </div>
        ) : null}
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Last donation</dt>
          <dd className="mt-1 text-lg font-semibold">{formatDate(e.last_donated_at)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Next eligible date</dt>
          <dd className="mt-1 text-lg font-semibold">
            {e.is_eligible ? "Today" : formatDate(e.eligible_from)}
          </dd>
        </div>
      </dl>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">General medical guidelines</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Age between 18 and 65 years and weight at least 45 kg.</li>
          <li>Haemoglobin level of 12.5 g/dL or higher.</li>
          <li>No major surgery, tattoo, or piercing within the past 6 months.</li>
          <li>The hospital medical staff conducts a final vitals assessment before drawing blood.</li>
        </ul>
      </section>
    </div>
  );
}
