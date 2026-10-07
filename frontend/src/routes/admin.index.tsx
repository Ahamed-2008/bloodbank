import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Building2, Clock, Droplets, Percent, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { BloodGroupBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — BloodLink" },
      { name: "description", content: "Network-wide stats: hospitals, pending verifications, donors and active blood alerts." },
      { property: "og:title", content: "Admin dashboard — BloodLink" },
      { property: "og:description", content: "BloodLink network overview." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const q = useQuery({ queryKey: ["admin", "stats"], queryFn: adminService.getStats });
  if (q.isPending) return <LoadingState rows={3} />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  const s = q.data;
  const max = Math.max(1, ...s.alertsByGroup.map((g) => g.alerts));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Network overview"
        description="Everything happening across BloodLink today."
        actions={
          s.pendingVerifications > 0 ? (
            <Button asChild><Link to="/admin/hospitals">Review {s.pendingVerifications} pending</Link></Button>
          ) : null
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Hospitals" value={s.hospitals} icon={Building2} tone="info" />
        <StatCard label="Pending verifications" value={s.pendingVerifications} icon={Clock} tone="warning" />
        <StatCard label="Registered donors" value={s.donors.toLocaleString("en-IN")} icon={Users} tone="success" />
        <StatCard label="Active blood alerts" value={s.activeAlerts} icon={BellRing} tone="primary" />
        <StatCard label="Units fulfilled this month" value={s.unitsFulfilledThisMonth} icon={Droplets} />
        <StatCard label="Donor response rate" value={`${s.responseRate}%`} icon={Percent} />
      </div>
      <section className="rounded-2xl border border-border bg-card p-6 card-elevated">
        <h2 className="font-semibold">Open alerts by blood group</h2>
        <ul className="mt-5 space-y-3">
          {s.alertsByGroup.map((g) => (
            <li key={g.bloodGroup} className="flex items-center gap-3">
              <BloodGroupBadge group={g.bloodGroup} size="sm" className="w-14" />
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(g.alerts / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-semibold tabular-nums">{g.alerts}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
