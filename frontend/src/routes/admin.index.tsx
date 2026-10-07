import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Building2, Clock, Droplets, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatCard } from "@/components/common/stat-card";
import { adminService } from "@/services/admin-service";
import { formatApiError } from "@/services/api-client";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — BloodLink" },
      {
        name: "description",
        content:
          "Network-wide stats: hospitals, pending verifications, donors and active blood alerts.",
      },
      { property: "og:title", content: "Admin dashboard — BloodLink" },
      { property: "og:description", content: "BloodLink network overview." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminService.getDashboard,
  });

  if (dashboardQuery.isPending) return <LoadingState rows={3} />;
  if (dashboardQuery.isError) {
    return (
      <ErrorState
        message={formatApiError(dashboardQuery.error)}
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  const s = dashboardQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Network overview"
        description="Real-time status across blood banks, registered donors, and active emergency alerts."
        actions={
          s.pending_hospitals > 0 ? (
            <Button asChild>
              <Link to="/admin/hospitals">Review {s.pending_hospitals} pending hospitals</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Registered donors"
          value={s.total_donors.toLocaleString("en-IN")}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Registered hospitals"
          value={s.total_hospitals}
          icon={Building2}
          tone="info"
        />
        <StatCard
          label="Pending hospital verifications"
          value={s.pending_hospitals}
          hint={s.pending_hospitals > 0 ? "Action required" : "All reviewed"}
          icon={Clock}
          tone={s.pending_hospitals > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Active blood alerts"
          value={s.active_alerts}
          icon={BellRing}
          tone="primary"
        />
        <StatCard
          label="Total completed donations"
          value={s.total_donations}
          icon={Droplets}
          tone="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h3 className="font-semibold">Hospital verification queue</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Review hospital registrations, check medical licence credentials, and activate staff administrator logins.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/hospitals">Manage hospitals</Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h3 className="font-semibold">Donor verification</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Review donor Aadhaar and identity verifications so verified donors can begin receiving urgent nearby requests.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/donors">Manage donors</Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h3 className="font-semibold">Network alerts monitor</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor active blood alerts across all participating hospitals, tracked by blood group, urgency, and fulfillment.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/alerts">Monitor alerts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
