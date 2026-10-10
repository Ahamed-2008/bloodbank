import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { hospitalService } from "@/services/hospital-service";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/hospital/alerts/")({
  head: () => ({
    meta: [
      { title: "My blood alerts — BloodLink" },
      {
        name: "description",
        content: "All blood alerts raised by your hospital with status, units and responses.",
      },
      { property: "og:title", content: "My blood alerts — BloodLink" },
      { property: "og:description", content: "Track every blood alert your hospital has raised." },
    ],
  }),
  component: MyAlertsPage,
});

function MyAlertsPage() {
  const query = useQuery({
    queryKey: ["hospital", "alerts"],
    queryFn: hospitalService.getHospitalAlerts,
  });

  const [filter, setFilter] = useState("all");

  const alerts = query.data ?? [];
  const rows = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital alerts"
        description="Every blood request broadcast by your hospital."
        actions={
          <Button asChild>
            <Link to="/hospital/alerts/new">
              <PlusCircle className="size-4" aria-hidden />
              New blood alert
            </Link>
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No alerts match this filter"
          description="Alerts raised by your hospital will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="hidden md:table-cell">Urgency</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead className="hidden sm:table-cell">Responses</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.alert_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BloodGroupBadge group={a.blood_group} size="sm" />
                      {a.patient_ref ? (
                        <span className="text-xs text-muted-foreground">{a.patient_ref}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">
                    {a.units_fulfilled} / {a.units_needed}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <UrgencyBadge urgency={a.urgency} />
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {a.department}
                  </TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">
                    {a.accepted_count} accepted ({a.notified_count} notified)
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(a.expires_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/hospital/alerts/$alertId" params={{ alertId: a.alert_id }}>
                        Manage
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
