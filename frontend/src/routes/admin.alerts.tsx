import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { BellRing, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";
import { formatApiError } from "@/services/api-client";
import { formatDateTime } from "@/lib/format";
import { BLOOD_GROUPS, URGENCY_LEVELS, type Urgency } from "@/lib/types";

export const Route = createFileRoute("/admin/alerts")({
  head: () => ({
    meta: [
      { title: "Active blood alerts — BloodLink admin" },
      { name: "description", content: "Every open blood request across the BloodLink network with hospital and urgency." },
      { property: "og:title", content: "Active blood alerts — BloodLink admin" },
      { property: "og:description", content: "Open blood requests across the network." },
    ],
  }),
  component: AdminAlertsPage,
});

const URGENCY_PRIORITY: Record<string, number> = {
  critical: 0,
  Critical: 0,
  high: 1,
  High: 1,
  urgent: 1,
  normal: 2,
  Normal: 2,
  routine: 2,
};

function getUrgencyPriority(urgency: Urgency): number {
  return URGENCY_PRIORITY[urgency] ?? 3;
}

function AdminAlertsPage() {
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const q = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: adminService.getActiveAlerts,
    refetchInterval: 15000,
  });

  const alerts = q.data ?? [];

  const filteredAlerts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = alerts.filter((a) => {
      const matchesSearch =
        !term ||
        a.hospitals.name.toLowerCase().includes(term) ||
        a.hospitals.city.toLowerCase().includes(term);

      const matchesUrgency =
        urgencyFilter === "all" ||
        a.urgency.toLowerCase() === urgencyFilter.toLowerCase();

      const matchesGroup =
        groupFilter === "all" || a.blood_group === groupFilter;

      return matchesSearch && matchesUrgency && matchesGroup;
    });

    return list.sort(
      (a, b) => getUrgencyPriority(a.urgency) - getUrgencyPriority(b.urgency),
    );
  }, [alerts, search, urgencyFilter, groupFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Blood Alerts"
        description="Monitor network-wide blood requests, fulfillment progress, and hospital emergencies in real time."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Search hospital or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search alerts by hospital or city"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-36" aria-label="Urgency filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              {URGENCY_LEVELS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-36" aria-label="Blood group filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {q.isPending ? (
        <LoadingState rows={3} />
      ) : q.isError ? (
        <ErrorState
          message={formatApiError(q.error)}
          onRetry={() => void q.refetch()}
        />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No active alerts"
          description={
            search || urgencyFilter !== "all" || groupFilter !== "all"
              ? "No alerts match the selected search or filter criteria."
              : "All emergency requests across hospitals have been fulfilled."
          }
          icon={<BellRing className="size-6" aria-hidden />}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead className="hidden md:table-cell">Dept</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="tabular-nums">Units</TableHead>
                <TableHead className="hidden sm:table-cell">Responses</TableHead>
                <TableHead className="hidden lg:table-cell">Expires At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((a) => (
                <TableRow key={a.alert_id}>
                  <TableCell>
                    <BloodGroupBadge group={a.blood_group} size="sm" />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{a.hospitals.name}</p>
                    <p className="text-xs text-muted-foreground">{a.hospitals.city}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {a.department}
                  </TableCell>
                  <TableCell>
                    <UrgencyBadge urgency={a.urgency} />
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-sm">
                    {a.units_fulfilled}/{a.units_needed}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{a.accepted_count}</span> accepted /{" "}
                    {a.notified_count} notified
                  </TableCell>
                  <TableCell className="hidden lg:table-cell whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(a.expires_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
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
