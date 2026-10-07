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
      { name: "description", content: "All blood alerts raised by your hospital with status, units and responses." },
      { property: "og:title", content: "My blood alerts — BloodLink" },
      { property: "og:description", content: "Track every blood alert your hospital has raised." },
    ],
  }),
  component: MyAlertsPage,
});

function MyAlertsPage() {
  const q = useQuery({ queryKey: ["hospital", "alerts"], queryFn: hospitalService.getAlerts });
  const [filter, setFilter] = useState("all");
  const rows = (q.data ?? []).filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My alerts"
        description="Every request raised by your hospital."
        actions={<Button asChild><Link to="/hospital/alerts/new"><PlusCircle className="size-4" aria-hidden />New alert</Link></Button>}
      />
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No alerts here" description="Alerts matching this filter will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="hidden md:table-cell">Urgency</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden sm:table-cell">Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><BloodGroupBadge group={a.bloodGroup} size="sm" /></TableCell>
                  <TableCell className="tabular-nums">{a.unitsFulfilled}/{a.unitsRequired}</TableCell>
                  <TableCell className="hidden md:table-cell"><UrgencyBadge urgency={a.urgency} /></TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{a.responseCount}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/hospital/alerts/$alertId" params={{ alertId: a.id }}>View</Link>
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
