import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { BloodGroupBadge } from "@/components/common/badges";
import { BLOOD_GROUPS } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloodLink — Urgent blood requests answered in minutes" },
      {
        name: "description",
        content:
          "BloodLink alerts nearby eligible donors the moment a verified hospital needs blood. Track eligibility, respond to requests, and save lives.",
      },
      { property: "og:title", content: "BloodLink — Urgent blood requests answered in minutes" },
      {
        property: "og:description",
        content: "Verified hospitals, nearby donors, and real-time blood requests in one place.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  {
    icon: BellRing,
    title: "Instant nearby alerts",
    body: "When a hospital raises a request, matching donors inside the chosen radius are notified immediately.",
  },
  {
    icon: ShieldCheck,
    title: "Verified hospitals only",
    body: "Every hospital is checked against its registration and blood bank licence before it can post requests.",
  },
  {
    icon: Timer,
    title: "Eligibility built in",
    body: "Donors are only alerted when they are medically eligible, based on their last recorded donation.",
  },
  {
    icon: MapPin,
    title: "Distance aware",
    body: "Requests are ranked by travel distance so the closest available donor can respond first.",
  },
];

const STEPS = [
  {
    title: "Hospital raises a request",
    body: "Blood group, units needed, urgency and the deadline are captured in one short form.",
  },
  {
    title: "Nearby donors are alerted",
    body: "Eligible donors within the radius receive the request with distance and contact details.",
  },
  {
    title: "Donation is confirmed",
    body: "The hospital confirms each donor who arrives, and units fulfilled update in real time.",
  },
];

function HomePage() {
  return (
    <PublicShell>
      <section className="hero-surface border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-deep">
              <HeartHandshake className="size-3.5" aria-hidden />
              Every donation supports up to three patients
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-extrabold sm:text-5xl">
              Urgent blood requests, answered in minutes.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              BloodLink connects verified hospitals with nearby eligible donors. Hospitals raise a
              request, the right donors hear about it instantly, and every confirmed unit is tracked
              end to end.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Become a donor
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register-hospital">
                  <Building2 className="size-4" aria-hidden />
                  Register a hospital
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { label: "Registered donors", value: "14,382" },
                { label: "Verified hospitals", value: "128" },
                { label: "Avg. first response", value: "24 min" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 card-elevated sm:p-8">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Blood groups we coordinate
            </h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {BLOOD_GROUPS.map((group) => (
                <BloodGroupBadge key={group} group={group} size="lg" className="w-full" />
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft p-5">
              <p className="text-sm font-semibold text-primary-deep">Critical request example</p>
              <p className="mt-2 text-sm text-primary-deep/80">
                3 units of O+ needed at Manipal Central Hospital, 4.2 km away, before 10:00 PM
                tonight. Six donors have already responded.
              </p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link to="/auth">Sign in to respond</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Built for emergencies, not paperwork</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything is designed around the few minutes that matter most after a request is raised.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 card-elevated card-lift"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Three steps from request to donation</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid size-9 place-items-center rounded-full brand-surface text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link to="/how-it-works">
                See the full flow
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border brand-surface p-8 sm:p-12">
          <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">
            One donation. Up to three patients who make it home.
          </h2>
          <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            Join as a donor and you will only ever be contacted when you are eligible and genuinely
            nearby.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
