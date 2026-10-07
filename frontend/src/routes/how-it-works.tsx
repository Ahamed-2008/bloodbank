import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { PageHeader } from "@/components/common/state";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How BloodLink works — donors, hospitals and verification" },
      {
        name: "description",
        content:
          "See how BloodLink handles donor eligibility, hospital verification, and the alert-to-donation flow from start to finish.",
      },
      { property: "og:title", content: "How BloodLink works" },
      {
        property: "og:description",
        content: "Donor eligibility, hospital verification, and the alert-to-donation flow.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const SECTIONS = [
  {
    icon: UserRound,
    title: "For donors",
    points: [
      "Sign in with your mobile number and a one-time code.",
      "Set your blood group, home location and how far you're willing to travel.",
      "Receive requests only while you are medically eligible to donate.",
      "Accept or decline in one tap, and see the hospital's contact details straight away.",
      "Your donation history and lives impacted are tracked automatically.",
    ],
  },
  {
    icon: Building2,
    title: "For hospitals",
    points: [
      "Register with your hospital registration number and blood bank licence.",
      "Once verified, raise a request with blood group, units, urgency and deadline.",
      "Choose the alert radius so only realistically reachable donors are contacted.",
      "Watch responses arrive, sorted by distance, and confirm each donor who attends.",
      "Add operators and administrators to your hospital's staff list.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "For platform admins",
    points: [
      "Review every hospital application with its licence dates before approving.",
      "Reject with a written reason so hospitals know exactly what to fix.",
      "Monitor donors, active requests and fulfilment across the network.",
    ],
  },
];

function HowItWorksPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
        <PageHeader
          title="How BloodLink works"
          description="A short walkthrough of what each type of user does on the platform."
        />

        <div className="mt-10 space-y-6">
          {SECTIONS.map(({ icon: Icon, title, points }) => (
            <section
              key={title}
              className="rounded-2xl border border-border bg-card p-6 card-elevated sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Sign in
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/register-hospital">Register a hospital</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
